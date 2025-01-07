const Message = require('../models/Message');
const Channel = require('../models/Channel');
const logger = require('../utils/logger');

class MessageService {
    // Create a new message
    async createMessage(data) {
        try {
            const message = new Message({
                content: data.content,
                type: data.type,
                userId: data.userId,
                channelId: data.channelId,
                metadata: data.metadata || {}
            });

            if (data.replyTo) {
                message.replyTo = data.replyTo;
            }

            const savedMessage = await message.save();
            await savedMessage.populate('userId', 'username avatar');

            if (message.replyTo) {
                await savedMessage.populate('replyTo');
            }

            logger.info(`Message created: ${savedMessage._id}`);
            return savedMessage;
        } catch (error) {
            logger.error('Error creating message:', error);
            throw error;
        }
    }

    // Get messages for a channel
    async getChannelMessages(channelId, options = {}) {
        try {
            const {
                limit = 50,
                before = Date.now(),
                type = null
            } = options;

            let query = {
                channelId,
                createdAt: { $lt: new Date(before) }
            };

            if (type) {
                query.type = type;
            }

            const messages = await Message.find(query)
                .sort({ createdAt: -1 })
                .limit(limit)
                .populate('userId', 'username avatar')
                .populate('replyTo');

            return messages;
        } catch (error) {
            logger.error('Error fetching channel messages:', error);
            throw error;
        }
    }

    // Update a message
    async updateMessage(messageId, userId, updates) {
        try {
            const message = await Message.findOne({
                _id: messageId,
                userId
            });

            if (!message) {
                throw new Error('Message not found or unauthorized');
            }

            Object.assign(message, updates);
            const updatedMessage = await message.save();
            await updatedMessage.populate('userId', 'username avatar');

            logger.info(`Message updated: ${messageId}`);
            return updatedMessage;
        } catch (error) {
            logger.error('Error updating message:', error);
            throw error;
        }
    }

    // Delete a message
    async deleteMessage(messageId, userId) {
        try {
            const message = await Message.findOne({
                _id: messageId,
                userId
            });

            if (!message) {
                throw new Error('Message not found or unauthorized');
            }

            await message.remove();
            logger.info(`Message deleted: ${messageId}`);
            return true;
        } catch (error) {
            logger.error('Error deleting message:', error);
            throw error;
        }
    }

    // Pin a message
    async pinMessage(messageId, channelId, userId) {
        try {
            const [message, channel] = await Promise.all([
                Message.findById(messageId),
                Channel.findById(channelId)
            ]);

            if (!message || !channel) {
                throw new Error('Message or channel not found');
            }

            if (!channel.members.includes(userId)) {
                throw new Error('Not authorized to pin messages in this channel');
            }

            await message.pin();
            await channel.pinMessage(messageId);

            logger.info(`Message pinned: ${messageId}`);
            return message;
        } catch (error) {
            logger.error('Error pinning message:', error);
            throw error;
        }
    }

    // Unpin a message
    async unpinMessage(messageId, channelId, userId) {
        try {
            const [message, channel] = await Promise.all([
                Message.findById(messageId),
                Channel.findById(channelId)
            ]);

            if (!message || !channel) {
                throw new Error('Message or channel not found');
            }

            if (!channel.members.includes(userId)) {
                throw new Error('Not authorized to unpin messages in this channel');
            }

            await message.unpin();
            await channel.unpinMessage(messageId);

            logger.info(`Message unpinned: ${messageId}`);
            return message;
        } catch (error) {
            logger.error('Error unpinning message:', error);
            throw error;
        }
    }

    // Add reaction to a message
    async addReaction(messageId, userId, emoji, username) {
        try {
            const message = await Message.findById(messageId);
            if (!message) {
                throw new Error('Message not found');
            }

            await message.addReaction(userId, emoji, username);
            logger.info(`Reaction added to message: ${messageId}`);
            return message;
        } catch (error) {
            logger.error('Error adding reaction:', error);
            throw error;
        }
    }

    // Remove reaction from a message
    async removeReaction(messageId, userId, emoji) {
        try {
            const message = await Message.findById(messageId);
            if (!message) {
                throw new Error('Message not found');
            }

            await message.removeReaction(userId, emoji);
            logger.info(`Reaction removed from message: ${messageId}`);
            return message;
        } catch (error) {
            logger.error('Error removing reaction:', error);
            throw error;
        }
    }

    // Schedule a message
    async scheduleMessage(data) {
        try {
            const message = await this.createMessage({
                ...data,
                metadata: {
                    ...data.metadata,
                    scheduledFor: new Date(data.scheduledFor)
                }
            });

            logger.info(`Message scheduled: ${message._id}`);
            return message;
        } catch (error) {
            logger.error('Error scheduling message:', error);
            throw error;
        }
    }

    // Set message expiry
    async setMessageExpiry(messageId, userId, expiryTime) {
        try {
            const message = await Message.findOne({
                _id: messageId,
                userId
            });

            if (!message) {
                throw new Error('Message not found or unauthorized');
            }

            await message.setExpiry(expiryTime);
            logger.info(`Expiry set for message: ${messageId}`);
            return message;
        } catch (error) {
            logger.error('Error setting message expiry:', error);
            throw error;
        }
    }

    // Get scheduled messages
    async getScheduledMessages() {
        try {
            return await Message.findScheduled();
        } catch (error) {
            logger.error('Error fetching scheduled messages:', error);
            throw error;
        }
    }

    // Clean up expired messages
    async cleanupExpiredMessages() {
        try {
            const expiredMessages = await Message.findExpired();
            for (const message of expiredMessages) {
                await message.remove();
                logger.info(`Expired message removed: ${message._id}`);
            }
            return expiredMessages.length;
        } catch (error) {
            logger.error('Error cleaning up expired messages:', error);
            throw error;
        }
    }
}

module.exports = new MessageService(); 