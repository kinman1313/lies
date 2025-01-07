const Channel = require('../models/Channel');
const Message = require('../models/Message');
const User = require('../models/User');
const logger = require('../utils/logger');

class ChannelService {
    // Create a new channel
    async createChannel(data) {
        try {
            const channel = new Channel({
                name: data.name,
                description: data.description,
                isPrivate: data.isPrivate,
                createdBy: data.userId,
                members: [data.userId, ...(data.members || [])]
            });

            const savedChannel = await channel.save();
            await savedChannel
                .populate('createdBy', 'username avatar')
                .populate('members', 'username avatar');

            logger.info(`Channel created: ${savedChannel._id}`);
            return savedChannel;
        } catch (error) {
            logger.error('Error creating channel:', error);
            throw error;
        }
    }

    // Get all channels for a user
    async getUserChannels(userId) {
        try {
            const channels = await Channel.findByMember(userId);
            logger.info(`Retrieved channels for user: ${userId}`);
            return channels;
        } catch (error) {
            logger.error('Error fetching user channels:', error);
            throw error;
        }
    }

    // Get public channels
    async getPublicChannels() {
        try {
            const channels = await Channel.findPublic();
            logger.info('Retrieved public channels');
            return channels;
        } catch (error) {
            logger.error('Error fetching public channels:', error);
            throw error;
        }
    }

    // Get channel by ID
    async getChannelById(channelId, userId) {
        try {
            const channel = await Channel.findById(channelId)
                .populate('createdBy', 'username avatar')
                .populate('members', 'username avatar');

            if (!channel) {
                throw new Error('Channel not found');
            }

            if (channel.isPrivate && !channel.members.some(m => m._id.toString() === userId)) {
                throw new Error('Not authorized to view this channel');
            }

            logger.info(`Retrieved channel: ${channelId}`);
            return channel;
        } catch (error) {
            logger.error('Error fetching channel:', error);
            throw error;
        }
    }

    // Update channel
    async updateChannel(channelId, userId, updates) {
        try {
            const channel = await Channel.findOne({
                _id: channelId,
                createdBy: userId
            });

            if (!channel) {
                throw new Error('Channel not found or unauthorized');
            }

            Object.assign(channel, updates);
            const updatedChannel = await channel.save();
            await updatedChannel
                .populate('createdBy', 'username avatar')
                .populate('members', 'username avatar');

            logger.info(`Channel updated: ${channelId}`);
            return updatedChannel;
        } catch (error) {
            logger.error('Error updating channel:', error);
            throw error;
        }
    }

    // Delete channel
    async deleteChannel(channelId, userId) {
        try {
            const channel = await Channel.findOne({
                _id: channelId,
                createdBy: userId
            });

            if (!channel) {
                throw new Error('Channel not found or unauthorized');
            }

            // Delete all messages in the channel
            await Message.deleteMany({ channelId });
            await channel.remove();

            logger.info(`Channel deleted: ${channelId}`);
            return true;
        } catch (error) {
            logger.error('Error deleting channel:', error);
            throw error;
        }
    }

    // Add member to channel
    async addMember(channelId, userId, memberId) {
        try {
            const [channel, member] = await Promise.all([
                Channel.findById(channelId),
                User.findById(memberId)
            ]);

            if (!channel || !member) {
                throw new Error('Channel or user not found');
            }

            if (!channel.members.includes(userId)) {
                throw new Error('Not authorized to add members to this channel');
            }

            await channel.addMember(memberId);
            await channel.populate('members', 'username avatar');

            logger.info(`Member ${memberId} added to channel ${channelId}`);
            return channel;
        } catch (error) {
            logger.error('Error adding member to channel:', error);
            throw error;
        }
    }

    // Remove member from channel
    async removeMember(channelId, userId, memberId) {
        try {
            const channel = await Channel.findById(channelId);
            if (!channel) {
                throw new Error('Channel not found');
            }

            if (channel.createdBy.toString() !== userId) {
                throw new Error('Not authorized to remove members from this channel');
            }

            await channel.removeMember(memberId);
            await channel.populate('members', 'username avatar');

            logger.info(`Member ${memberId} removed from channel ${channelId}`);
            return channel;
        } catch (error) {
            logger.error('Error removing member from channel:', error);
            throw error;
        }
    }

    // Update channel settings
    async updateSettings(channelId, userId, settings) {
        try {
            const channel = await Channel.findOne({
                _id: channelId,
                createdBy: userId
            });

            if (!channel) {
                throw new Error('Channel not found or unauthorized');
            }

            await channel.updateSettings(settings);
            logger.info(`Settings updated for channel: ${channelId}`);
            return channel;
        } catch (error) {
            logger.error('Error updating channel settings:', error);
            throw error;
        }
    }

    // Search channels
    async searchChannels(query, userId) {
        try {
            const channels = await Channel.search(query);

            // Filter private channels that the user is not a member of
            const accessibleChannels = channels.filter(channel =>
                !channel.isPrivate || channel.members.some(m => m._id.toString() === userId)
            );

            logger.info(`Search performed for channels with query: ${query}`);
            return accessibleChannels;
        } catch (error) {
            logger.error('Error searching channels:', error);
            throw error;
        }
    }

    // Get channel statistics
    async getChannelStats(channelId, userId) {
        try {
            const channel = await Channel.findById(channelId);
            if (!channel) {
                throw new Error('Channel not found');
            }

            if (!channel.members.includes(userId)) {
                throw new Error('Not authorized to view channel statistics');
            }

            const messageCount = await Message.countDocuments({ channelId });
            const memberCount = channel.members.length;
            const pinnedCount = channel.pinnedMessages.length;

            const stats = {
                messageCount,
                memberCount,
                pinnedCount,
                createdAt: channel.createdAt,
                lastActivity: channel.updatedAt
            };

            logger.info(`Retrieved statistics for channel: ${channelId}`);
            return stats;
        } catch (error) {
            logger.error('Error fetching channel statistics:', error);
            throw error;
        }
    }
}

module.exports = new ChannelService(); 