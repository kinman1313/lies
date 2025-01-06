const Message = require('../models/Message');
const { io } = require('../socket');

class MessageScheduler {
    constructor() {
        this.scheduledJobs = new Map();
        this.checkInterval = 60000; // Check every minute
        this.intervalId = null;
    }

    start() {
        // Start checking for scheduled messages
        this.intervalId = setInterval(() => this.checkScheduledMessages(), this.checkInterval);
        console.log('Message scheduler started');
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        console.log('Message scheduler stopped');
    }

    async checkScheduledMessages() {
        try {
            const now = new Date();
            const scheduledMessages = await Message.find({
                isScheduled: true,
                scheduledFor: { $lte: now },
                isDeleted: false
            }).populate('userId', 'username avatar');

            for (const message of scheduledMessages) {
                await this.sendScheduledMessage(message);
            }
        } catch (error) {
            console.error('Error checking scheduled messages:', error);
        }
    }

    async sendScheduledMessage(message) {
        try {
            // Mark message as no longer scheduled
            message.isScheduled = false;
            message.scheduledFor = null;
            await message.save();

            // Emit the message to the room
            io.to(message.roomId.toString()).emit('message', {
                type: 'new',
                message: message.toObject()
            });

            console.log(`Scheduled message sent: ${message._id}`);
        } catch (error) {
            console.error('Error sending scheduled message:', error);
        }
    }

    async scheduleMessage(messageData, scheduledFor) {
        try {
            const message = new Message({
                ...messageData,
                isScheduled: true,
                scheduledFor
            });
            await message.save();
            return message;
        } catch (error) {
            console.error('Error scheduling message:', error);
            throw error;
        }
    }

    async cancelScheduledMessage(messageId) {
        try {
            const message = await Message.findById(messageId);
            if (message && message.isScheduled) {
                await message.cancelSchedule();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error canceling scheduled message:', error);
            throw error;
        }
    }
}

module.exports = new MessageScheduler(); 