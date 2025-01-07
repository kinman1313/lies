const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Message = require('../models/Message');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

// Get all messages
router.get('/', auth, async (req, res) => {
    try {
        const messages = await Message.find()
            .sort({ timestamp: -1 })
            .limit(100)
            .populate('userId', 'username avatar');
        res.json(messages);
    } catch (error) {
        logger.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Get messages by channel
router.get('/channel/:channelId', auth, async (req, res) => {
    try {
        const messages = await Message.find({ channelId: req.params.channelId })
            .sort({ timestamp: -1 })
            .limit(50)
            .populate('userId', 'username avatar');
        res.json(messages);
    } catch (error) {
        logger.error('Error fetching channel messages:', error);
        res.status(500).json({ error: 'Failed to fetch channel messages' });
    }
});

// Get pinned messages
router.get('/pinned', auth, async (req, res) => {
    try {
        const pinnedMessages = await Message.find({ isPinned: true })
            .sort({ timestamp: -1 })
            .populate('userId', 'username avatar');
        res.json(pinnedMessages);
    } catch (error) {
        logger.error('Error fetching pinned messages:', error);
        res.status(500).json({ error: 'Failed to fetch pinned messages' });
    }
});

// Create new message with validation
router.post('/',
    auth,
    [
        body('content').trim().notEmpty().withMessage('Message content cannot be empty'),
        body('type').isIn(['text', 'file', 'voice', 'gif']).withMessage('Invalid message type'),
        body('channelId').optional().isMongoId().withMessage('Invalid channel ID')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const message = new Message({
                content: req.body.content,
                type: req.body.type,
                userId: req.user._id,
                channelId: req.body.channelId,
                metadata: req.body.metadata || {}
            });

            const savedMessage = await message.save();
            await savedMessage.populate('userId', 'username avatar');
            res.status(201).json(savedMessage);
        } catch (error) {
            logger.error('Error creating message:', error);
            res.status(500).json({ error: 'Failed to create message' });
        }
    }
);

// Update message
router.patch('/:id',
    auth,
    [
        body('content').optional().trim().notEmpty().withMessage('Message content cannot be empty'),
        body('isPinned').optional().isBoolean().withMessage('isPinned must be a boolean')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const message = await Message.findById(req.params.id);
            if (!message) {
                return res.status(404).json({ error: 'Message not found' });
            }

            if (message.userId.toString() !== req.user._id.toString()) {
                return res.status(403).json({ error: 'Not authorized to update this message' });
            }

            const updatedMessage = await Message.findByIdAndUpdate(
                req.params.id,
                { $set: req.body },
                { new: true }
            ).populate('userId', 'username avatar');

            res.json(updatedMessage);
        } catch (error) {
            logger.error('Error updating message:', error);
            res.status(500).json({ error: 'Failed to update message' });
        }
    }
);

// Delete message
router.delete('/:id', auth, async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        if (message.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized to delete this message' });
        }

        await message.remove();
        res.json({ message: 'Message deleted successfully' });
    } catch (error) {
        logger.error('Error deleting message:', error);
        res.status(500).json({ error: 'Failed to delete message' });
    }
});

// Add reaction to message
router.post('/:id/reactions',
    auth,
    [
        body('emoji').trim().notEmpty().withMessage('Emoji cannot be empty')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const message = await Message.findById(req.params.id);
            if (!message) {
                return res.status(404).json({ error: 'Message not found' });
            }

            const reaction = {
                emoji: req.body.emoji,
                userId: req.user._id,
                username: req.user.username
            };

            message.reactions.push(reaction);
            await message.save();
            res.json(message);
        } catch (error) {
            logger.error('Error adding reaction:', error);
            res.status(500).json({ error: 'Failed to add reaction' });
        }
    }
);

// Remove reaction from message
router.delete('/:id/reactions/:reactionId', auth, async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        const reactionIndex = message.reactions.findIndex(
            r => r._id.toString() === req.params.reactionId &&
                r.userId.toString() === req.user._id.toString()
        );

        if (reactionIndex === -1) {
            return res.status(404).json({ error: 'Reaction not found' });
        }

        message.reactions.splice(reactionIndex, 1);
        await message.save();
        res.json(message);
    } catch (error) {
        logger.error('Error removing reaction:', error);
        res.status(500).json({ error: 'Failed to remove reaction' });
    }
});

module.exports = router; 