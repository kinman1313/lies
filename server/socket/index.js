const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const {
    handleMessage,
    handleReaction,
    handleScheduledMessage,
    handleReply
} = require('./messageHandlers');
const {
    handleJoinRoom,
    handleLeaveRoom,
    handleCreateChannel,
    handleDeleteChannel,
    handleUpdateChannel
} = require('./roomHandlers');
const messageScheduler = require('../services/messageScheduler');

let io;

function initializeSocket(server) {
    io = socketIo(server, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:3000',
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    // Start the message scheduler
    messageScheduler.start();

    // Authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                throw new Error('Authentication error');
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded;
            next();
        } catch (error) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.user.username}`);

        // Room events
        socket.on('joinRoom', (data) => handleJoinRoom(socket, data));
        socket.on('leaveRoom', (data) => handleLeaveRoom(socket, data));
        socket.on('createChannel', (data) => handleCreateChannel(socket, data));
        socket.on('deleteChannel', (data) => handleDeleteChannel(socket, data));
        socket.on('updateChannel', (data) => handleUpdateChannel(socket, data));

        // Message events
        socket.on('message', (data) => handleMessage(socket, data));
        socket.on('reaction', (data) => handleReaction(socket, data));
        socket.on('scheduledMessage', (data) => handleScheduledMessage(socket, data));
        socket.on('reply', (data) => handleReply(socket, data));

        // Typing indicator
        socket.on('typing', (data) => {
            const { roomId, isTyping } = data;
            socket.to(roomId).emit('typing', {
                userId: socket.user._id,
                username: socket.user.username,
                isTyping
            });
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.user.username}`);
        });
    });

    return io;
}

function getIo() {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
}

module.exports = {
    initializeSocket,
    getIo,
    io: getIo
}; 