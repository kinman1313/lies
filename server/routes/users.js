const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const { validate, userValidation, createValidationMiddleware } = require('../middleware/validation');
const { uploadLimiter } = require('../middleware/rateLimiter');
const userService = require('../services/userService');
const fileService = require('../services/fileService');
const logger = require('../utils/logger');

// Register new user
router.post('/register',
    createValidationMiddleware(userValidation.register),
    async (req, res) => {
        try {
            const { user, token } = await userService.register(req.body);
            res.status(201).json({ user, token });
        } catch (error) {
            logger.error('Registration error:', error);
            res.status(400).json({ error: error.message });
        }
    }
);

// Login user
router.post('/login',
    createValidationMiddleware(userValidation.login),
    async (req, res) => {
        try {
            const { email, password } = req.body;
            const { user, token } = await userService.login(email, password);
            res.json({ user, token });
        } catch (error) {
            logger.error('Login error:', error);
            res.status(401).json({ error: error.message });
        }
    }
);

// Get user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await userService.getProfile(req.user._id);
        res.json(user);
    } catch (error) {
        logger.error('Error fetching profile:', error);
        res.status(400).json({ error: error.message });
    }
});

// Update user profile
router.patch('/profile',
    auth,
    uploadLimiter,
    fileService.uploadMiddleware.single('avatar'),
    [
        body('username').optional().trim().isLength({ min: 3, max: 30 }),
        body('bio').optional().trim().isLength({ max: 200 })
    ],
    validate,
    async (req, res) => {
        try {
            const updates = { ...req.body };

            if (req.file) {
                const fileInfo = await fileService.saveFile(req.file);
                updates.avatar = fileInfo.fileUrl;
            }

            const user = await userService.updateProfile(req.user._id, updates);
            res.json(user);
        } catch (error) {
            logger.error('Error updating profile:', error);
            res.status(400).json({ error: error.message });
        }
    }
);

// Update user preferences
router.patch('/preferences',
    auth,
    [
        body('theme').optional().isIn(['light', 'dark']),
        body('notifications').optional().isObject(),
        body('messagePreferences').optional().isObject()
    ],
    validate,
    async (req, res) => {
        try {
            const user = await userService.updatePreferences(req.user._id, req.body);
            res.json(user);
        } catch (error) {
            logger.error('Error updating preferences:', error);
            res.status(400).json({ error: error.message });
        }
    }
);

// Change password
router.patch('/password',
    auth,
    [
        body('currentPassword').notEmpty(),
        body('newPassword')
            .isLength({ min: 6 })
            .matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])/)
            .withMessage('Password must be at least 6 characters long and contain uppercase, lowercase, and numbers')
    ],
    validate,
    async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body;
            await userService.changePassword(req.user._id, currentPassword, newPassword);
            res.json({ message: 'Password updated successfully' });
        } catch (error) {
            logger.error('Error changing password:', error);
            res.status(400).json({ error: error.message });
        }
    }
);

// Request password reset
router.post('/password/reset-request',
    [
        body('email').isEmail()
    ],
    validate,
    async (req, res) => {
        try {
            await userService.requestPasswordReset(req.body.email);
            res.json({ message: 'Password reset email sent' });
        } catch (error) {
            logger.error('Error requesting password reset:', error);
            res.status(400).json({ error: error.message });
        }
    }
);

// Reset password
router.post('/password/reset',
    [
        body('token').notEmpty(),
        body('newPassword')
            .isLength({ min: 6 })
            .matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])/)
    ],
    validate,
    async (req, res) => {
        try {
            const { token, newPassword } = req.body;
            await userService.resetPassword(token, newPassword);
            res.json({ message: 'Password reset successful' });
        } catch (error) {
            logger.error('Error resetting password:', error);
            res.status(400).json({ error: error.message });
        }
    }
);

// Verify email
router.get('/verify-email/:token', async (req, res) => {
    try {
        await userService.verifyEmail(req.params.token);
        res.json({ message: 'Email verified successfully' });
    } catch (error) {
        logger.error('Error verifying email:', error);
        res.status(400).json({ error: error.message });
    }
});

// Search users
router.get('/search',
    auth,
    async (req, res) => {
        try {
            const users = await userService.searchUsers(req.query.q, req.user._id);
            res.json(users);
        } catch (error) {
            logger.error('Error searching users:', error);
            res.status(400).json({ error: error.message });
        }
    }
);

// Get online users
router.get('/online',
    auth,
    async (req, res) => {
        try {
            const users = await userService.getOnlineUsers();
            res.json(users);
        } catch (error) {
            logger.error('Error fetching online users:', error);
            res.status(400).json({ error: error.message });
        }
    }
);

module.exports = router; 