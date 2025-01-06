import * as SignalProtocol from '@privacyresearch/libsignal-protocol-typescript';
import { Buffer } from 'buffer';

class EncryptionService {
    constructor() {
        this.signalProtocol = SignalProtocol;
        this.sessions = new Map();
        this.initialized = false;
    }

    async initialize(userId) {
        if (this.initialized) return;

        try {
            // Generate identity key pair
            const identityKeyPair = await this.signalProtocol.KeyHelper.generateIdentityKeyPair();

            // Generate registration ID
            const registrationId = await this.signalProtocol.KeyHelper.generateRegistrationId();

            // Generate signed pre key
            const signedPreKeyId = Math.floor(Math.random() * 1000000);
            const signedPreKey = await this.signalProtocol.KeyHelper.generateSignedPreKey(
                identityKeyPair,
                signedPreKeyId
            );

            // Generate one-time pre keys
            const preKeys = await this.signalProtocol.KeyHelper.generatePreKeys(0, 100);

            // Store keys locally
            this.store = new this.signalProtocol.SignalProtocolStore();
            await this.store.put('identityKey', identityKeyPair);
            await this.store.put('registrationId', registrationId);
            await this.store.storeSignedPreKey(signedPreKeyId, signedPreKey);

            for (const preKey of preKeys) {
                await this.store.storePreKey(preKey.keyId, preKey);
            }

            // Send keys to server
            const keyBundle = {
                registrationId,
                identityKey: Buffer.from(identityKeyPair.pubKey).toString('base64'),
                signedPreKey: {
                    keyId: signedPreKeyId,
                    publicKey: Buffer.from(signedPreKey.keyPair.pubKey).toString('base64'),
                    signature: Buffer.from(signedPreKey.signature).toString('base64')
                },
                oneTimePreKeys: preKeys.map(pk => ({
                    keyId: pk.keyId,
                    publicKey: Buffer.from(pk.keyPair.pubKey).toString('base64')
                }))
            };

            // Store the key bundle on the server
            const response = await fetch('/api/keys/store', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId,
                    keyBundle
                })
            });

            if (!response.ok) {
                throw new Error('Failed to store keys on server');
            }

            this.initialized = true;
            this.userId = userId;
        } catch (error) {
            console.error('Error initializing encryption service:', error);
            throw error;
        }
    }

    async establishSession(recipientId) {
        try {
            if (this.sessions.has(recipientId)) {
                return this.sessions.get(recipientId);
            }

            // Get recipient's pre-key bundle from server
            const response = await fetch(`/api/keys/bundle/${recipientId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to get recipient pre-key bundle');
            }

            const bundle = await response.json();

            // Create session builder
            const address = new this.signalProtocol.SignalProtocolAddress(recipientId, 1);
            const sessionBuilder = new this.signalProtocol.SessionBuilder(
                this.store,
                address
            );

            // Process pre-key bundle
            await sessionBuilder.processPreKeyBundle({
                registrationId: bundle.registrationId,
                identityKey: Buffer.from(bundle.identityKey, 'base64'),
                signedPreKey: {
                    keyId: bundle.signedPreKey.keyId,
                    publicKey: Buffer.from(bundle.signedPreKey.publicKey, 'base64'),
                    signature: Buffer.from(bundle.signedPreKey.signature, 'base64')
                },
                preKey: {
                    keyId: bundle.oneTimePreKey.keyId,
                    publicKey: Buffer.from(bundle.oneTimePreKey.publicKey, 'base64')
                }
            });

            // Create session cipher
            const sessionCipher = new this.signalProtocol.SessionCipher(
                this.store,
                address
            );

            this.sessions.set(recipientId, sessionCipher);
            return sessionCipher;
        } catch (error) {
            console.error('Error establishing session:', error);
            throw error;
        }
    }

    async encryptMessage(recipientId, message) {
        try {
            const sessionCipher = await this.establishSession(recipientId);
            const ciphertext = await sessionCipher.encrypt(
                Buffer.from(JSON.stringify(message))
            );

            return {
                type: ciphertext.type,
                body: Buffer.from(ciphertext.body).toString('base64'),
                registrationId: this.store.get('registrationId')
            };
        } catch (error) {
            console.error('Error encrypting message:', error);
            throw error;
        }
    }

    async decryptMessage(senderId, encryptedMessage) {
        try {
            const address = new this.signalProtocol.SignalProtocolAddress(senderId, 1);
            const sessionCipher = new this.signalProtocol.SessionCipher(
                this.store,
                address
            );

            const plaintext = await sessionCipher.decrypt({
                type: encryptedMessage.type,
                body: Buffer.from(encryptedMessage.body, 'base64')
            });

            return JSON.parse(plaintext.toString());
        } catch (error) {
            console.error('Error decrypting message:', error);
            throw error;
        }
    }

    async rotateSignedPreKey() {
        try {
            const identityKeyPair = await this.store.get('identityKey');
            const newSignedPreKeyId = Math.floor(Math.random() * 1000000);

            const newSignedPreKey = await this.signalProtocol.KeyHelper.generateSignedPreKey(
                identityKeyPair,
                newSignedPreKeyId
            );

            await this.store.storeSignedPreKey(newSignedPreKeyId, newSignedPreKey);

            // Update server with new signed pre-key
            const response = await fetch('/api/keys/signed-prekey', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    userId: this.userId,
                    signedPreKey: {
                        keyId: newSignedPreKeyId,
                        publicKey: Buffer.from(newSignedPreKey.keyPair.pubKey).toString('base64'),
                        signature: Buffer.from(newSignedPreKey.signature).toString('base64')
                    }
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update signed pre-key on server');
            }

            return true;
        } catch (error) {
            console.error('Error rotating signed pre-key:', error);
            throw error;
        }
    }

    async generateMorePreKeys() {
        try {
            const response = await fetch('/api/keys/status', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to get key status');
            }

            const status = await response.json();

            if (status.unusedPreKeyCount < 10) {
                const startId = Math.floor(Math.random() * 1000000);
                const newPreKeys = await this.signalProtocol.KeyHelper.generatePreKeys(startId, 100);

                // Store locally
                for (const preKey of newPreKeys) {
                    await this.store.storePreKey(preKey.keyId, preKey);
                }

                // Send to server
                const updateResponse = await fetch('/api/keys/prekeys', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        userId: this.userId,
                        preKeys: newPreKeys.map(pk => ({
                            keyId: pk.keyId,
                            publicKey: Buffer.from(pk.keyPair.pubKey).toString('base64')
                        }))
                    })
                });

                if (!updateResponse.ok) {
                    throw new Error('Failed to update pre-keys on server');
                }
            }

            return true;
        } catch (error) {
            console.error('Error generating more pre-keys:', error);
            throw error;
        }
    }

    async cleanup() {
        this.sessions.clear();
        this.initialized = false;
        this.userId = null;
    }
}

const encryptionService = new EncryptionService();
export default encryptionService; 