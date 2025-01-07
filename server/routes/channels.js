const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Channel = require('../models/Channel');
const Message = require('../models/Message');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

// Get all channels
router.get('/', auth, async (req, res) => {
    try {
        const channels = await Channel.find()
            .populate('createdBy', 'username avatar')
            .populate('members', 'username avatar')
            .sort({ createdAt: -1 });
        res.json(channels);
    } catch (error) {
        logger.error('Error fetching channels:', error);
        res.status(500).json({ error: 'Failed to fetch channels' });
    }
});

// Get channel by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const channel = await Channel.findById(req.params.id)
            .populate('createdBy', 'username avatar')
            .populate('members', 'username avatar');

        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }

        res.json(channel);
    } catch (error) {
        logger.error('Error fetching channel:', error);
        res.status(500).json({ error: 'Failed to fetch channel' });
    }
});

// Create new channel
router.post('/',
    auth,
    [
        body('name').trim().notEmpty().withMessage('Channel name cannot be empty')
            .isLength({ min: 3, max: 50 }).withMessage('Channel name must be between 3 and 50 characters'),
        body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
        body('isPrivate').optional().isBoolean().withMessage('isPrivate must be a boolean'),
        body('members').optional().isArray().withMessage('Members must be an array')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const channel = new Channel({
                name: req.body.name,
                description: req.body.description,
                isPrivate: req.body.isPrivate || false,
                createdBy: req.user._id,
                members: [req.user._id, ...(req.body.members || [])]
            });

            const savedChannel = await channel.save();
            await savedChannel
                .populate('createdBy', 'username avatar')
                .populate('members', 'username avatar');

            res.status(201).json(savedChannel);
        } catch (error) {
            logger.error('Error creating channel:', error);
            res.status(500).json({ error: 'Failed to create channel' });
        }
    }
);

// Update channel
router.patch('/:id',
    auth,
    [
        body('name').optional().trim().notEmpty().withMessage('Channel name cannot be empty')
            .isLength({ min: 3, max: 50 }).withMessage('Channel name must be between 3 and 50 characters'),
        body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
        body('isPrivate').optional().isBoolean().withMessage('isPrivate must be a boolean')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const channel = await Channel.findById(req.params.id);
            if (!channel) {
                return res.status(404).json({ error: 'Channel not found' });
            }

            if (channel.createdBy.toString() !== req.user._id.toString()) {
                return res.status(403).json({ error: 'Not authorized to update this channel' });
            }

            const updatedChannel = await Channel.findByIdAndUpdate(
                req.params.id,
                { $set: req.body },
                { new: true }
            )
                .populate('createdBy', 'username avatar')
                .populate('members', 'username avatar');

            res.json(updatedChannel);
        } catch (error) {
            logger.error('Error updating channel:', error);
            res.status(500).json({ error: 'Failed to update channel' });
        }
    }
);

// Delete channel
router.delete('/:id', auth, async (req, res) => {
    try {
        const channel = await Channel.findById(req.params.id);
        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }

        if (channel.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized to delete this channel' });
        }

        // Delete all messages in the channel
        await Message.deleteMany({ channelId: req.params.id });
        await channel.remove();

        res.json({ message: 'Channel deleted successfully' });
    } catch (error) {
        logger.error('Error deleting channel:', error);
        res.status(500).json({ error: 'Failed to delete channel' });
    }
});

// Add member to channel
router.post('/:id/members',
    auth,
    [
        body('userId').isMongoId().withMessage('Invalid user ID')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const channel = await Channel.findById(req.params.id);
            if (!channel) {
                return res.status(404).json({ error: 'Channel not found' });
            }

            if (channel.members.includes(req.body.userId)) {
                return res.status(400).json({ error: 'User is already a member' });
            }

            channel.members.push(req.body.userId);
            await channel.save();

            const updatedChannel = await Channel.findById(req.params.id)
                .populate('createdBy', 'username avatar')
                .populate('members', 'username avatar');

            res.json(updatedChannel);
        } catch (error) {
            logger.error('Error adding member:', error);
            res.status(500).json({ error: 'Failed to add member' });
        }
    }
);

// Remove member from channel
router.delete('/:id/members/:userId', auth, async (req, res) => {
    try {
        const channel = await Channel.findById(req.params.id);
        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }

        if (channel.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized to remove members' });
        }

        const memberIndex = channel.members.indexOf(req.params.userId);
        if (memberIndex === -1) {
            return res.status(404).json({ error: 'Member not found' });
        }

        channel.members.splice(memberIndex, 1);
        await channel.save();

        const updatedChannel = await Channel.findById(req.params.id)
            .populate('createdBy', 'username avatar')
            .populate('members', 'username avatar');

        res.json(updatedChannel);
    } catch (error) {
        logger.error('Error removing member:', error);
        res.status(500).json({ error: 'Failed to remove member' });
    }
});

module.exports = router; 