const Message = require('../models/Message');
const Room = require('../models/Room');

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
                // Notify room about voice message
                io.to(roomId).emit('voiceMessage', {
                    messageId: message._id,
                    duration: metadata?.duration || 0
                });
                break;
            case 'gif':
                // Notify room about GIF message
                io.to(roomId).emit('gifMessage', {
                    messageId: message._id,
                    dimensions: {
                        width: metadata?.width,
                        height: metadata?.height
                    }
                });
                break;
        }
    } catch (error) {
        console.error('Error handling message:', error);
        socket.emit('error', { message: 'Failed to send message' });
    }
};

const handleTyping = (io, socket, data) => {
    const { roomId, isTyping } = data;
    socket.to(roomId).emit('typing', {
        username: socket.username,
        isTyping
    });
};

const handleReaction = async (io, socket, data) => {
    try {
        const { messageId, emoji, action } = data;
        const message = await Message.findById(messageId);

        if (!message) {
            throw new Error('Message not found');
        }

        if (action === 'add') {
            await message.addReaction(emoji, socket.userId);
        } else {
            await message.removeReaction(emoji, socket.userId);
        }

        io.to(message.roomId).emit('messageReaction', {
            messageId,
            emoji,
            action,
            userId: socket.userId,
            username: socket.username
        });
    } catch (error) {
        console.error('Error handling reaction:', error);
        socket.emit('error', { message: 'Failed to update reaction' });
    }
};

module.exports = {
    handleMessage,
    handleTyping,
    handleReaction
}; 