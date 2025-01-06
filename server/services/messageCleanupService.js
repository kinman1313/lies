const Message = require('../models/Message');

class MessageCleanupService {
    constructor(io) {
        this.io = io;
        this.cleanupInterval = null;
    }

    start() {
        // Run cleanup every minute
        this.cleanupInterval = setInterval(async () => {
            try {
                const deletedCount = await Message.cleanupExpiredMessages();
                if (deletedCount > 0) {
                    console.log(`Cleaned up ${deletedCount} expired messages`);
                }
            } catch (error) {
                console.error('Error cleaning up expired messages:', error);
            }
        }, 60000); // 1 minute
    }

    stop() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }

    // Method to notify room about message expiration
    async notifyMessageExpiration(message) {
        if (this.io) {
            this.io.to(message.roomId).emit('messageExpired', {
                messageId: message._id,
                roomId: message.roomId
            });
        }
    }
}

module.exports = MessageCleanupService; 