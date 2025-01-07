const Message = require('../models/Message');
const Room = require('../models/Room');
const { uploadToCloud } = require('../services/cloudStorage');
const messageScheduler = require('../services/messageScheduler');
const messageCleanupService = require('../services/messageCleanupService');

async function handleMessage(io, socket, data) {
    try {
        const { content, type, roomId, metadata = {}, replyTo, scheduledFor, expirationMinutes, file } = data;
        const userId = socket.user._id;

        // Validate room membership
        const room = await Room.findById(roomId);
        if (!room) {
            throw new Error('Room not found');
        }

        const member = room.members.find(m => m.userId.equals(userId));
        if (!member) {
            throw new Error('Not a member of this room');
        }

        // Handle file upload if present
        let fileData = {};
        if (file) {
            const uploadResult = await uploadToCloud(file);
            fileData = {
                fileUrl: uploadResult.url,
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type
            };
        }

        // Create message data
        const messageData = {
            content,
            type,
            roomId,
            metadata,
            replyTo,
            userId,
            username: socket.user.username,
            ...fileData
        };

        // Handle scheduled messages
        if (scheduledFor) {
            const scheduledMessage = await messageScheduler.scheduleMessage(messageData, new Date(scheduledFor));
            socket.emit('message:scheduled', scheduledMessage);
            return;
        }

        // Create and save the message
        const message = new Message(messageData);
        await message.save();

        // Set message expiration if specified
        if (expirationMinutes) {
            messageCleanupService.scheduleMessageDeletion(message._id, expirationMinutes);
        }

        // Update reply chain if this is a reply
        if (replyTo) {
            const originalMessage = await Message.findById(replyTo);
            if (originalMessage) {
                originalMessage.replies = originalMessage.replies || [];
                originalMessage.replies.push(message._id);
                await originalMessage.save();
            }
        }

        // Emit the message to all users in the room
        io.to(roomId.toString()).emit('message:new', {
            ...message.toJSON(),
            timestamp: new Date(),
            status: 'sent'
        });

        // Send acknowledgment to sender
        socket.emit('message:sent', { messageId: message._id });

    } catch (error) {
        console.error('Error handling message:', error);
        socket.emit('message:error', { error: error.message });
    }
}

async function handleReaction(io, socket, data) {
    try {
        const { messageId, emoji, action } = data;
        const userId = socket.user._id;

        const message = await Message.findById(messageId);
        if (!message) {
            throw new Error('Message not found');
        }

        if (action === 'add') {
            // Add reaction if not already present
            if (!message.reactions.some(r => r.userId.equals(userId) && r.emoji === emoji)) {
                message.reactions.push({ userId, emoji });
            }
        } else {
            // Remove reaction
            message.reactions = message.reactions.filter(
                r => !(r.userId.equals(userId) && r.emoji === emoji)
            );
        }

        await message.save();

        // Broadcast reaction update to room
        io.to(message.roomId.toString()).emit('message:reaction', {
            messageId,
            reactions: message.reactions
        });

    } catch (error) {
        console.error('Error handling reaction:', error);
        socket.emit('message:error', { error: error.message });
    }
}

module.exports = {
    handleMessage,
    handleReaction
}; 