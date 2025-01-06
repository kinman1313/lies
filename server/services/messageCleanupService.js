const Message = require('../models/Message');
const { io } = require('../socket');

class MessageCleanupService {
    constructor() {
        this.cleanupInterval = null;
    }

    start() {
        // Run cleanup every minute
        this.cleanupInterval = setInterval(async () => {
            try {
                const expiredMessages = await Message.cleanupExpiredMessages();

                // Notify rooms about expired messages
                for (const message of expiredMessages) {
                    io.to(message.roomId.toString()).emit('message', {
                        type: 'expired',
                        messageId: message._id
                    });
                }
            } catch (error) {
                console.error('Error in message cleanup:', error);
            }
        }, 60000); // 1 minute
    }

    stop() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }

    // Method to manually trigger cleanup
    async runCleanup() {
        try {
            const expiredMessages = await Message.cleanupExpiredMessages();

            // Notify rooms about expired messages
            for (const message of expiredMessages) {
                io.to(message.roomId.toString()).emit('message', {
                    type: 'expired',
                    messageId: message._id
                });
            }

            return expiredMessages;
        } catch (error) {
            console.error('Error in manual message cleanup:', error);
            throw error;
        }
    }
}

module.exports = new MessageCleanupService(); 