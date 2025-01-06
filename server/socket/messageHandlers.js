const Message = require('../models/Message');
const Room = require('../models/Room');
const messageScheduler = require('../services/messageScheduler');

async function handleMessage(socket, data) {
    try {
        const { content, type, roomId, metadata = {}, replyTo, scheduledFor } = data;
        const userId = socket.user._id;

        // Check if user has permission to send messages in this room/channel
        const room = await Room.findById(roomId);
        if (!room) {
            throw new Error('Room not found');
        }

        const member = room.members.find(m => m.userId.equals(userId));
        if (!member) {
            throw new Error('Not a member of this room');
        }

        // If this is a scheduled message
        if (scheduledFor) {
            const scheduledMessage = await messageScheduler.scheduleMessage({
                content,
                type,
                roomId,
                metadata,
                replyTo,
                userId,
                username: socket.user.username
            }, new Date(scheduledFor));

            socket.emit('message', {
                type: 'scheduled',
                message: scheduledMessage
            });
            return;
        }

        // Create and save the message
        const message = new Message({
            content,
            type,
            roomId,
            metadata,
            replyTo,
            userId,
            username: socket.user.username
        });

        await message.save();

        // If this is a reply, update the original message's reply chain
        if (replyTo) {
            const originalMessage = await Message.findById(replyTo);
            if (originalMessage) {
                await originalMessage.addReply(message._id);
            }
        }

        // Emit the message to all users in the room
        socket.to(roomId).emit('message', {
            type: 'new',
            message
        });

        // Acknowledge the message
        socket.emit('message', {
            type: 'sent',
            message
        });

    } catch (error) {
        console.error('Error handling message:', error);
        socket.emit('error', {
            type: 'message',
            message: error.message
        });
    }
}

async function handleReaction(socket, data) {
    try {
        const { messageId, emoji, remove } = data;
        const userId = socket.user._id;

        const message = await Message.findById(messageId);
        if (!message) {
            throw new Error('Message not found');
        }

        if (remove) {
            await message.removeReaction(emoji, userId);
        } else {
            await message.addReaction(emoji, userId);
        }

        // Emit the updated reactions to all users in the room
        socket.to(message.roomId).emit('message', {
            type: 'reaction',
            messageId: message._id,
            reactions: message.reactions
        });

        // Acknowledge the reaction update
        socket.emit('message', {
            type: 'reaction',
            messageId: message._id,
            reactions: message.reactions
        });

    } catch (error) {
        console.error('Error handling reaction:', error);
        socket.emit('error', {
            type: 'reaction',
            message: error.message
        });
    }
}

async function handleScheduledMessage(socket, data) {
    try {
        const { messageId, action, scheduledFor } = data;
        const userId = socket.user._id;

        if (action === 'cancel') {
            const cancelled = await messageScheduler.cancelScheduledMessage(messageId);
            if (cancelled) {
                socket.emit('message', {
                    type: 'schedule_cancelled',
                    messageId
                });
            }
        } else if (action === 'reschedule') {
            const message = await Message.findById(messageId);
            if (message && message.userId.equals(userId)) {
                await message.schedule(new Date(scheduledFor));
                socket.emit('message', {
                    type: 'rescheduled',
                    message
                });
            }
        }
    } catch (error) {
        console.error('Error handling scheduled message:', error);
        socket.emit('error', {
            type: 'scheduled_message',
            message: error.message
        });
    }
}

async function handleReply(socket, data) {
    try {
        const { messageId } = data;
        const message = await Message.findById(messageId)
            .populate('replyTo')
            .populate('replyChain');

        if (!message) {
            throw new Error('Message not found');
        }

        socket.emit('message', {
            type: 'reply_chain',
            message
        });

    } catch (error) {
        console.error('Error handling reply:', error);
        socket.emit('error', {
            type: 'reply',
            message: error.message
        });
    }
}

module.exports = {
    handleMessage,
    handleReaction,
    handleScheduledMessage,
    handleReply
}; 