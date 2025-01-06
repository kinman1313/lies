const mongoose = require('mongoose');
const crypto = require('crypto');

// Schema for storing user keys
const keySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    registrationId: {
        type: Number,
        required: true
    },
    identityKey: {
        type: String,
        required: true
    },
    signedPreKey: {
        keyId: Number,
        publicKey: String,
        signature: String
    },
    oneTimePreKeys: [{
        keyId: Number,
        publicKey: String,
        used: {
            type: Boolean,
            default: false
        }
    }]
}, {
    timestamps: true
});

// Indexes
keySchema.index({ userId: 1 });
keySchema.index({ 'oneTimePreKeys.used': 1 });

const KeyStore = mongoose.model('KeyStore', keySchema);

class KeyManagementService {
    static async storeInitialKeys(userId, keys) {
        try {
            const {
                registrationId,
                identityKey,
                signedPreKey,
                oneTimePreKeys
            } = keys;

            await KeyStore.findOneAndUpdate(
                { userId },
                {
                    registrationId,
                    identityKey,
                    signedPreKey,
                    oneTimePreKeys
                },
                { upsert: true, new: true }
            );

            return true;
        } catch (error) {
            console.error('Error storing initial keys:', error);
            throw error;
        }
    }

    static async getPreKeyBundle(senderId, recipientId) {
        try {
            const recipientKeys = await KeyStore.findOne({ userId: recipientId });
            if (!recipientKeys) {
                throw new Error('Recipient keys not found');
            }

            // Find an unused one-time pre-key
            const unusedPreKey = recipientKeys.oneTimePreKeys.find(key => !key.used);
            if (!unusedPreKey) {
                throw new Error('No unused pre-keys available');
            }

            // Mark the pre-key as used
            unusedPreKey.used = true;
            await recipientKeys.save();

            return {
                registrationId: recipientKeys.registrationId,
                identityKey: recipientKeys.identityKey,
                signedPreKey: recipientKeys.signedPreKey,
                oneTimePreKey: {
                    keyId: unusedPreKey.keyId,
                    publicKey: unusedPreKey.publicKey
                }
            };
        } catch (error) {
            console.error('Error getting pre-key bundle:', error);
            throw error;
        }
    }

    static async updateSignedPreKey(userId, signedPreKey) {
        try {
            await KeyStore.findOneAndUpdate(
                { userId },
                { signedPreKey },
                { new: true }
            );

            return true;
        } catch (error) {
            console.error('Error updating signed pre-key:', error);
            throw error;
        }
    }

    static async addOneTimePreKeys(userId, newPreKeys) {
        try {
            const userKeys = await KeyStore.findOne({ userId });
            if (!userKeys) {
                throw new Error('User keys not found');
            }

            // Add new pre-keys
            userKeys.oneTimePreKeys.push(...newPreKeys);
            await userKeys.save();

            return true;
        } catch (error) {
            console.error('Error adding one-time pre-keys:', error);
            throw error;
        }
    }

    static async checkKeyStatus(userId) {
        try {
            const userKeys = await KeyStore.findOne({ userId });
            if (!userKeys) {
                return {
                    hasKeys: false,
                    unusedPreKeyCount: 0
                };
            }

            const unusedPreKeyCount = userKeys.oneTimePreKeys.filter(key => !key.used).length;

            return {
                hasKeys: true,
                unusedPreKeyCount,
                needsMorePreKeys: unusedPreKeyCount < 10, // Threshold for generating new pre-keys
                lastUpdate: userKeys.updatedAt
            };
        } catch (error) {
            console.error('Error checking key status:', error);
            throw error;
        }
    }

    static async deleteUserKeys(userId) {
        try {
            await KeyStore.deleteOne({ userId });
            return true;
        } catch (error) {
            console.error('Error deleting user keys:', error);
            throw error;
        }
    }

    // Helper method to generate random pre-keys
    static generatePreKeys(startId, count) {
        const preKeys = [];
        for (let i = 0; i < count; i++) {
            const keyId = startId + i;
            const keyPair = crypto.generateKeyPairSync('rsa', {
                modulusLength: 2048,
                publicKeyEncoding: {
                    type: 'spki',
                    format: 'pem'
                },
                privateKeyEncoding: {
                    type: 'pkcs8',
                    format: 'pem'
                }
            });

            preKeys.push({
                keyId,
                publicKey: keyPair.publicKey,
                privateKey: keyPair.privateKey
            });
        }
        return preKeys;
    }
}

module.exports = KeyManagementService; 