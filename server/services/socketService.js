const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const User = require('../models/User');
const Channel = require('../models/Channel');
const logger = require('../utils/logger');

class SocketService {
    constructor(server) {
        this.io = socketIo(server, {
            cors: {
                origin: process.env.CLIENT_URL || 'http://localhost:3000',
                methods: ['GET', 'POST'],
                credentials: true
            }
        });

        this.connectedUsers = new Map();
        this.typingUsers = new Map();

        this.initialize();
    }

    initialize() {
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                if (!token) {
                    return next(new Error('Authentication error'));
                }

                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded._id);
                if (!user) {
                    return next(new Error('User not found'));
                }

                socket.user = user;
                next();
            } catch (error) {
                logger.error('Socket authentication error:', error);
                next(new Error('Authentication error'));
            }
        });

        this.io.on('connection', (socket) => {
            this.handleConnection(socket);
            this.setupEventHandlers(socket);
        });
    }

    handleConnection(socket) {
        const userId = socket.user._id.toString();
        this.connectedUsers.set(userId, socket.id);

        // Update user status
        User.findByIdAndUpdate(userId, { status: 'online', lastSeen: new Date() })
            .then(() => {
                this.io.emit('user:status', { userId, status: 'online' });
                logger.info(`User connected: ${userId}`);
            })
            .catch(error => logger.error('Error updating user status:', error));

        socket.join(userId); // Join personal room
    }

    setupEventHandlers(socket) {
        const userId = socket.user._id.toString();

        // Handle disconnection
        socket.on('disconnect', () => {
            this.connectedUsers.delete(userId);
            this.typingUsers.delete(userId);

            // Update user status
            User.findByIdAndUpdate(userId, { status: 'offline', lastSeen: new Date() })
                .then(() => {
                    this.io.emit('user:status', { userId, status: 'offline' });
                    logger.info(`User disconnected: ${userId}`);
                })
                .catch(error => logger.error('Error updating user status:', error));
        });

        // Join channel
        socket.on('channel:join', async (channelId) => {
            try {
                const channel = await Channel.findById(channelId);
                if (channel && channel.members.includes(userId)) {
                    socket.join(channelId);
                    logger.info(`User ${userId} joined channel ${channelId}`);
                }
            } catch (error) {
                logger.error('Error joining channel:', error);
            }
        });

        // Leave channel
        socket.on('channel:leave', (channelId) => {
            socket.leave(channelId);
            logger.info(`User ${userId} left channel ${channelId}`);
        });

        // New message
        socket.on('message:new', async (data) => {
            try {
                const { content, type, channelId, metadata } = data;
                const message = new Message({
                    content,
                    type,
                    userId: socket.user._id,
                    channelId,
                    metadata
                });

                const savedMessage = await message.save();
                await savedMessage.populate('userId', 'username avatar');

                this.io.to(channelId).emit('message:new', savedMessage);
                logger.info(`New message in channel ${channelId}`);
            } catch (error) {
                logger.error('Error handling new message:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // Update message
        socket.on('message:update', async (data) => {
            try {
                const { messageId, content } = data;
                const message = await Message.findById(messageId);

                if (message && message.userId.toString() === userId) {
                    message.content = content;
                    const updatedMessage = await message.save();
                    await updatedMessage.populate('userId', 'username avatar');

                    this.io.to(message.channelId.toString()).emit('message:update', updatedMessage);
                    logger.info(`Message updated: ${messageId}`);
                }
            } catch (error) {
                logger.error('Error updating message:', error);
                socket.emit('error', { message: 'Failed to update message' });
            }
        });

        // Delete message
        socket.on('message:delete', async (messageId) => {
            try {
                const message = await Message.findById(messageId);
                if (message && message.userId.toString() === userId) {
                    await message.remove();
                    this.io.to(message.channelId.toString()).emit('message:delete', messageId);
                    logger.info(`Message deleted: ${messageId}`);
                }
            } catch (error) {
                logger.error('Error deleting message:', error);
                socket.emit('error', { message: 'Failed to delete message' });
            }
        });

        // Typing indicator
        socket.on('typing:start', (channelId) => {
            const key = `${channelId}:${userId}`;
            this.typingUsers.set(key, socket.user.username);
            this.io.to(channelId).emit('typing:update', Array.from(this.typingUsers.values()));
        });

        socket.on('typing:stop', (channelId) => {
            const key = `${channelId}:${userId}`;
            this.typingUsers.delete(key);
            this.io.to(channelId).emit('typing:update', Array.from(this.typingUsers.values()));
        });

        // Message reaction
        socket.on('message:react', async (data) => {
            try {
                const { messageId, emoji } = data;
                const message = await Message.findById(messageId);
                if (message) {
                    await message.addReaction(userId, emoji, socket.user.username);
                    this.io.to(message.channelId.toString()).emit('message:update', message);
                    logger.info(`Reaction added to message: ${messageId}`);
                }
            } catch (error) {
                logger.error('Error adding reaction:', error);
                socket.emit('error', { message: 'Failed to add reaction' });
            }
        });

        // Message read receipt
        socket.on('message:read', async (messageId) => {
            try {
                const message = await Message.findById(messageId);
                if (message) {
                    // Emit to message author
                    const authorSocket = this.connectedUsers.get(message.userId.toString());
                    if (authorSocket) {
                        this.io.to(authorSocket).emit('message:read', {
                            messageId,
                            userId,
                            username: socket.user.username
                        });
                    }
                }
            } catch (error) {
                logger.error('Error handling read receipt:', error);
            }
        });

        // Handle errors
        socket.on('error', (error) => {
            logger.error('Socket error:', error);
        });
    }

    // Utility methods
    broadcastToChannel(channelId, event, data) {
        this.io.to(channelId).emit(event, data);
    }

    broadcastToUser(userId, event, data) {
        const socketId = this.connectedUsers.get(userId);
        if (socketId) {
            this.io.to(socketId).emit(event, data);
        }
    }

    isUserOnline(userId) {
        return this.connectedUsers.has(userId);
    }

    getOnlineUsers() {
        return Array.from(this.connectedUsers.keys());
    }
}

module.exports = SocketService; 