const Message = require('../models/Message');
const Room = require('../models/Room');
const User = require('../models/User');

const handleMessage = async (io, socket, data) => {
    try {
        const { type, content, metadata, roomId } = data;

        // Validate message type
        if (!['text', 'gif', 'voice', 'file'].includes(type)) {
            throw new Error('Invalid message type');
        }

        // Create message document
        const message = new Message({
            type,
            content,
            metadata,
            roomId,
            username: socket.username,
            userId: socket.userId
        });

        await message.save();

        // Emit message to room
        io.to(roomId).emit('message', {
            ...message.toObject(),
            createdAt: message.createdAt,
            username: socket.username
        });

        // Handle specific message types
        switch (type) {
            case 'voice':
                io.to(roomId).emit('voiceMessage', {
                    messageId: message._id,
                    duration: metadata?.duration || 0
                });
                break;
            case 'gif':
                io.to(roomId).emit('gifMessage', {
                    messageId: message._id,
                    dimensions: {
                        width: metadata?.width,
                        height: metadata?.height
                    }
                });
                break;
            case 'file':
                io.to(roomId).emit('fileMessage', {
                    messageId: message._id,
                    fileName: metadata?.fileName,
                    fileSize: metadata?.fileSize,
                    fileType: metadata?.fileType
                });
                break;
        }

        // Update unread counts for users in the room
        const room = await Room.findById(roomId).populate('members', '_id');
        const onlineUsers = new Set(Object.keys(io.sockets.adapter.rooms.get(roomId) || {}));

        for (const member of room.members) {
            if (!onlineUsers.has(member._id.toString()) && member._id.toString() !== socket.userId) {
                await User.findByIdAndUpdate(member._id, {
                    $inc: { [`unreadCounts.${roomId}`]: 1 }
                });
            }
        }

    } catch (error) {
        console.error('Error handling message:', error);
        socket.emit('error', { message: 'Failed to send message' });
    }
};

const handleTyping = (io, socket, data) => {
    const { roomId, isTyping } = data;
    socket.to(roomId).emit('typing', {
        userId: socket.userId,
        username: socket.username,
        isTyping
    });
};

const handlePin = async (io, socket, data) => {
    try {
        const { messageId } = data;
        const message = await Message.findById(messageId);

        if (!message) {
            throw new Error('Message not found');
        }

        await message.pin(socket.userId);
        io.to(message.roomId).emit('messagePinned', {
            messageId,
            pinnedBy: socket.userId,
            pinnedAt: message.pinnedAt
        });
    } catch (error) {
        console.error('Error pinning message:', error);
        socket.emit('error', { message: 'Failed to pin message' });
    }
};

const handleUnpin = async (io, socket, data) => {
    try {
        const { messageId } = data;
        const message = await Message.findById(messageId);

        if (!message) {
            throw new Error('Message not found');
        }

        await message.unpin();
        io.to(message.roomId).emit('messageUnpinned', { messageId });
    } catch (error) {
        console.error('Error unpinning message:', error);
        socket.emit('error', { message: 'Failed to unpin message' });
    }
};

const handleEdit = async (io, socket, data) => {
    try {
        const { messageId, content } = data;
        const message = await Message.findById(messageId);

        if (!message) {
            throw new Error('Message not found');
        }

        if (message.userId.toString() !== socket.userId) {
            throw new Error('Unauthorized to edit this message');
        }

        await message.edit(content, socket.userId);
        io.to(message.roomId).emit('messageEdited', {
            messageId,
            content,
            editedAt: message.updatedAt
        });
    } catch (error) {
        console.error('Error editing message:', error);
        socket.emit('error', { message: 'Failed to edit message' });
    }
};

const handleDelete = async (io, socket, data) => {
    try {
        const { messageId } = data;
        const message = await Message.findById(messageId);

        if (!message) {
            throw new Error('Message not found');
        }

        if (message.userId.toString() !== socket.userId) {
            throw new Error('Unauthorized to delete this message');
        }

        await message.softDelete(socket.userId);
        io.to(message.roomId).emit('messageDeleted', {
            messageId,
            deletedAt: message.deletedAt
        });
    } catch (error) {
        console.error('Error deleting message:', error);
        socket.emit('error', { message: 'Failed to delete message' });
    }
};

const handleMarkRead = async (io, socket, data) => {
    try {
        const { messageId } = data;
        const message = await Message.findById(messageId);

        if (!message) {
            throw new Error('Message not found');
        }

        await message.markAsRead(socket.userId);

        // Update user's unread count for the room
        await User.findByIdAndUpdate(socket.userId, {
            $inc: { [`unreadCounts.${message.roomId}`]: -1 }
        });

        socket.to(message.roomId).emit('messageRead', {
            messageId,
            userId: socket.userId,
            readAt: new Date()
        });
    } catch (error) {
        console.error('Error marking message as read:', error);
        socket.emit('error', { message: 'Failed to mark message as read' });
    }
};

module.exports = {
    handleMessage,
    handleTyping,
    handlePin,
    handleUnpin,
    handleEdit,
    handleDelete,
    handleMarkRead
}; 