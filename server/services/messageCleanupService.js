const Message = require('../models/Message');
const schedule = require('node-schedule');
const { deleteFromCloud } = require('./cloudStorage');

class MessageCleanupService {
    constructor() {
        this.cleanupJobs = new Map();
        this.initializeExpiringMessages();
    }

    async initializeExpiringMessages() {
        try {
            const expiringMessages = await Message.find({
                expiresAt: { $gt: new Date() }
            });

            expiringMessages.forEach(message => {
                this.scheduleMessageDeletion(message._id, message.expiresAt);
            });
        } catch (error) {
            console.error('Error initializing expiring messages:', error);
        }
    }

    async scheduleMessageDeletion(messageId, expirationMinutes) {
        try {
            const message = await Message.findById(messageId);
            if (!message) {
                throw new Error('Message not found');
            }

            // Calculate expiration time
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + expirationMinutes);

            // Update message with expiration time
            message.expiresAt = expiresAt;
            await message.save();

            // Schedule the cleanup job
            const job = schedule.scheduleJob(expiresAt, async () => {
                try {
                    const messageToDelete = await Message.findById(messageId);
                    if (!messageToDelete) return;

                    // Delete any associated files
                    if (messageToDelete.fileUrl) {
                        await deleteFromCloud(messageToDelete.fileUrl);
                    }

                    // Delete the message
                    await messageToDelete.delete();

                    // Emit deletion event to room
                    const io = require('../server').io;
                    io.to(messageToDelete.roomId.toString()).emit('message:deleted', {
                        messageId: messageToDelete._id
                    });

                    // Clean up the job
                    this.cleanupJobs.delete(messageId.toString());
                } catch (error) {
                    console.error('Error deleting expired message:', error);
                }
            });

            this.cleanupJobs.set(messageId.toString(), job);

        } catch (error) {
            console.error('Error scheduling message deletion:', error);
            throw new Error('Failed to schedule message deletion');
        }
    }

    async cancelMessageDeletion(messageId) {
        try {
            const message = await Message.findById(messageId);
            if (!message || !message.expiresAt) {
                return false;
            }

            // Cancel the cleanup job
            const job = this.cleanupJobs.get(messageId.toString());
            if (job) {
                job.cancel();
                this.cleanupJobs.delete(messageId.toString());
            }

            // Remove expiration
            message.expiresAt = null;
            await message.save();

            return true;
        } catch (error) {
            console.error('Error cancelling message deletion:', error);
            throw new Error('Failed to cancel message deletion');
        }
    }

    async updateMessageExpiration(messageId, newExpirationMinutes) {
        try {
            const message = await Message.findById(messageId);
            if (!message) {
                throw new Error('Message not found');
            }

            // Cancel existing cleanup job
            const job = this.cleanupJobs.get(messageId.toString());
            if (job) {
                job.cancel();
                this.cleanupJobs.delete(messageId.toString());
            }

            // Schedule new deletion if expiration is set
            if (newExpirationMinutes > 0) {
                await this.scheduleMessageDeletion(messageId, newExpirationMinutes);
            } else {
                message.expiresAt = null;
                await message.save();
            }

            return message;
        } catch (error) {
            console.error('Error updating message expiration:', error);
            throw new Error('Failed to update message expiration');
        }
    }
}

// Create a singleton instance
const messageCleanupService = new MessageCleanupService();

module.exports = messageCleanupService; 