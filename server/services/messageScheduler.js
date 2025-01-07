const Message = require('../models/Message');
const schedule = require('node-schedule');

class MessageScheduler {
    constructor() {
        this.scheduledJobs = new Map();
        this.initializeScheduledMessages();
    }

    async initializeScheduledMessages() {
        try {
            const scheduledMessages = await Message.find({
                scheduledFor: { $gt: new Date() },
                status: 'scheduled'
            });

            scheduledMessages.forEach(message => {
                this.scheduleMessage(message);
            });
        } catch (error) {
            console.error('Error initializing scheduled messages:', error);
        }
    }

    async scheduleMessage(messageData, scheduledTime) {
        try {
            // Create a scheduled message record
            const message = new Message({
                ...messageData,
                status: 'scheduled',
                scheduledFor: scheduledTime
            });
            await message.save();

            // Schedule the job
            const job = schedule.scheduleJob(scheduledTime, async () => {
                try {
                    message.status = 'sent';
                    message.sentAt = new Date();
                    await message.save();

                    // Emit the message to the room
                    const io = require('../server').io;
                    io.to(message.roomId.toString()).emit('message:new', {
                        ...message.toJSON(),
                        timestamp: new Date(),
                        status: 'sent'
                    });

                    // Clean up the job
                    this.scheduledJobs.delete(message._id.toString());
                } catch (error) {
                    console.error('Error sending scheduled message:', error);
                    message.status = 'failed';
                    await message.save();
                }
            });

            this.scheduledJobs.set(message._id.toString(), job);
            return message;

        } catch (error) {
            console.error('Error scheduling message:', error);
            throw new Error('Failed to schedule message');
        }
    }

    async cancelScheduledMessage(messageId) {
        try {
            const message = await Message.findById(messageId);
            if (!message || message.status !== 'scheduled') {
                return false;
            }

            // Cancel the scheduled job
            const job = this.scheduledJobs.get(messageId.toString());
            if (job) {
                job.cancel();
                this.scheduledJobs.delete(messageId.toString());
            }

            // Update message status
            message.status = 'cancelled';
            await message.save();

            return true;
        } catch (error) {
            console.error('Error cancelling scheduled message:', error);
            throw new Error('Failed to cancel scheduled message');
        }
    }

    async rescheduleMessage(messageId, newScheduledTime) {
        try {
            const message = await Message.findById(messageId);
            if (!message || message.status !== 'scheduled') {
                throw new Error('Message not found or not scheduled');
            }

            // Cancel existing job
            const job = this.scheduledJobs.get(messageId.toString());
            if (job) {
                job.cancel();
                this.scheduledJobs.delete(messageId.toString());
            }

            // Update message
            message.scheduledFor = newScheduledTime;
            await message.save();

            // Schedule new job
            return await this.scheduleMessage(message, newScheduledTime);
        } catch (error) {
            console.error('Error rescheduling message:', error);
            throw new Error('Failed to reschedule message');
        }
    }
}

// Create a singleton instance
const messageScheduler = new MessageScheduler();

module.exports = messageScheduler; 