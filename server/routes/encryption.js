const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const KeyManagementService = require('../services/KeyManagementService');

// Store initial keys for a user
router.post('/keys', authenticate, async (req, res) => {
    try {
        const { registrationId, identityKey, signedPreKey, preKeys } = req.body;

        await KeyManagementService.storeInitialKeys(req.user.id, {
            registrationId,
            identityKey,
            signedPreKey,
            preKeys
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error storing keys:', error);
        res.status(500).json({ error: 'Failed to store keys' });
    }
});

// Get pre-key bundle for establishing a session
router.get('/prekey-bundle/:recipientId', authenticate, async (req, res) => {
    try {
        const bundle = await KeyManagementService.getPreKeyBundle(
            req.user.id,
            req.params.recipientId
        );

        res.json({ success: true, bundle });
    } catch (error) {
        console.error('Error getting pre-key bundle:', error);
        res.status(500).json({ error: 'Failed to get pre-key bundle' });
    }
});

// Update signed pre-key (key rotation)
router.put('/signed-prekey', authenticate, async (req, res) => {
    try {
        const { keyId, publicKey, signature } = req.body;

        await KeyManagementService.updateSignedPreKey(req.user.id, {
            keyId,
            publicKey,
            signature
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating signed pre-key:', error);
        res.status(500).json({ error: 'Failed to update signed pre-key' });
    }
});

// Add new pre-keys
router.post('/prekeys', authenticate, async (req, res) => {
    try {
        const { preKeys } = req.body;

        await KeyManagementService.addNewPreKeys(req.user.id, preKeys);

        res.json({ success: true });
    } catch (error) {
        console.error('Error adding pre-keys:', error);
        res.status(500).json({ error: 'Failed to add pre-keys' });
    }
});

// Check key status
router.get('/key-status', authenticate, async (req, res) => {
    try {
        const status = await KeyManagementService.checkKeyStatus(req.user.id);
        res.json({ success: true, status });
    } catch (error) {
        console.error('Error checking key status:', error);
        res.status(500).json({ error: 'Failed to check key status' });
    }
});

// Delete user's keys (for account deletion)
router.delete('/keys', authenticate, async (req, res) => {
    try {
        await KeyManagementService.deleteUserKeys(req.user.id);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting keys:', error);
        res.status(500).json({ error: 'Failed to delete keys' });
    }
});

module.exports = router; 