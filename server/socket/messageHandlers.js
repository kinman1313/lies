const Message = require('../models/Message');
const Room = require('../models/Room');
const User = require('../models/User');
const KeyManagementService = require('../services/KeyManagementService');

const handleSendMessage = async (io, socket, data) => {
    try {
        const { roomId, message, type } = data;

        // Verify room membership
        const room = await Room.findById(roomId);
        if (!room || !room.members.includes(socket.user._id)) {
            return { success: false, error: 'Not authorized' };
        }

        // For group messages, encrypt for each member
        const encryptedMessages = {};
        for (const memberId of room.members) {
            if (memberId.toString() !== socket.user._id.toString()) {
                // Get recipient's pre-key bundle
                const bundle = await KeyManagementService.getPreKeyBundle(
                    socket.user._id,
                    memberId
                );

                // Store encrypted message
                encryptedMessages[memberId.toString()] = {
                    type: message.type,
                    body: message.body,
                    registrationId: message.registrationId
                };
            }
        }

        // Create message document
        const newMessage = new Message({
            roomId,
            senderId: socket.user._id,
            type,
            encryptedContent: encryptedMessages,
            timestamp: new Date()
        });

        await newMessage.save();

        // Update room's last activity
        room.lastActivity = new Date();
        await room.save();

        // Notify room members
        room.members.forEach(memberId => {
            if (memberId.toString() !== socket.user._id.toString()) {
                const memberMessage = {
                    id: newMessage._id,
                    roomId,
                    senderId: socket.user._id,
                    type,
                    encryptedContent: encryptedMessages[memberId.toString()],
                    timestamp: newMessage.timestamp
                };

                io.to(`user:${memberId}`).emit('newMessage', memberMessage);
            }
        });

        return { success: true, messageId: newMessage._id };
    } catch (error) {
        console.error('Error sending message:', error);
        return { success: false, error: error.message };
    }
};

const handleTyping = async (io, socket, data) => {
    try {
        const { roomId } = data;

        // Verify room membership
        const room = await Room.findById(roomId);
        if (!room || !room.members.includes(socket.user._id)) {
            return;
        }

        // Notify other room members
        socket.to(roomId).emit('typing', {
            roomId,
            userId: socket.user._id,
            username: socket.user.username
        });
    } catch (error) {
        console.error('Error handling typing:', error);
    }
};

const handleReadMessage = async (io, socket, data) => {
    try {
        const { messageId } = data;

        const message = await Message.findById(messageId);
        if (!message) {
            return { success: false, error: 'Message not found' };
        }

        // Verify room membership
        const room = await Room.findById(message.roomId);
        if (!room || !room.members.includes(socket.user._id)) {
            return { success: false, error: 'Not authorized' };
        }

        // Mark message as read for this user
        if (!message.readBy.includes(socket.user._id)) {
            message.readBy.push(socket.user._id);
            await message.save();

            // Notify sender
            io.to(`user:${message.senderId}`).emit('messageRead', {
                messageId,
                userId: socket.user._id,
                timestamp: new Date()
            });
        }

        return { success: true };
    } catch (error) {
        console.error('Error marking message as read:', error);
        return { success: false, error: error.message };
    }
};

const handleDeleteMessage = async (io, socket, data) => {
    try {
        const { messageId } = data;

        const message = await Message.findById(messageId);
        if (!message) {
            return { success: false, error: 'Message not found' };
        }

        // Only sender can delete their message
        if (message.senderId.toString() !== socket.user._id.toString()) {
            return { success: false, error: 'Not authorized' };
        }

        // Soft delete the message
        message.isDeleted = true;
        message.deletedAt = new Date();
        await message.save();

        // Notify room members
        io.to(message.roomId.toString()).emit('messageDeleted', {
            messageId,
            roomId: message.roomId
        });

        return { success: true };
    } catch (error) {
        console.error('Error deleting message:', error);
        return { success: false, error: error.message };
    }
};

const handleEditMessage = async (io, socket, data) => {
    try {
        const { messageId, newContent } = data;

        const message = await Message.findById(messageId);
        if (!message) {
            return { success: false, error: 'Message not found' };
        }

        // Only sender can edit their message
        if (message.senderId.toString() !== socket.user._id.toString()) {
            return { success: false, error: 'Not authorized' };
        }

        // Re-encrypt message for all recipients
        const room = await Room.findById(message.roomId);
        const encryptedMessages = {};

        for (const memberId of room.members) {
            if (memberId.toString() !== socket.user._id.toString()) {
                // Get recipient's pre-key bundle
                const bundle = await KeyManagementService.getPreKeyBundle(
                    socket.user._id,
                    memberId
                );

                // Store encrypted message
                encryptedMessages[memberId.toString()] = {
                    type: newContent.type,
                    body: newContent.body,
                    registrationId: newContent.registrationId
                };
            }
        }

        // Update message
        message.encryptedContent = encryptedMessages;
        message.editedAt = new Date();
        await message.save();

        // Notify room members
        room.members.forEach(memberId => {
            if (memberId.toString() !== socket.user._id.toString()) {
                const memberMessage = {
                    id: message._id,
                    roomId: message.roomId,
                    senderId: socket.user._id,
                    type: message.type,
                    encryptedContent: encryptedMessages[memberId.toString()],
                    timestamp: message.timestamp,
                    editedAt: message.editedAt
                };

                io.to(`user:${memberId}`).emit('messageEdited', memberMessage);
            }
        });

        return { success: true };
    } catch (error) {
        console.error('Error editing message:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    handleSendMessage,
    handleTyping,
    handleReadMessage,
    handleDeleteMessage,
    handleEditMessage
}; 