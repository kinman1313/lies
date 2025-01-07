const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const userService = require('../services/userService');
const logger = require('../utils/logger');

// Validation middleware
const validateRegistration = [
    body('username').trim().isLength({ min: 3 }).escape(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    validate
];

const validateLogin = [
    body('email').isEmail().normalizeEmail(),
    body('password').exists(),
    validate
];

const validatePasswordReset = [
    body('password').isLength({ min: 6 }),
    validate
];

// Register new user
router.post('/register', validateRegistration, async (req, res) => {
    try {
        const { user, token } = await userService.register(req.body);
        res.status(201).json({ user, token });
    } catch (error) {
        logger.error('Registration error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Login user
router.post('/login', validateLogin, async (req, res) => {
    try {
        const { email, password } = req.body;
        const { user, token } = await userService.login(email, password);
        res.json({ user, token });
    } catch (error) {
        logger.error('Login error:', error);
        res.status(401).json({ error: error.message });
    }
});

// Request password reset
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        await userService.requestPasswordReset(email);
        res.json({ message: 'Password reset email sent' });
    } catch (error) {
        logger.error('Password reset request error:', error);
        // Don't reveal if email exists
        res.json({ message: 'If the email exists, a password reset link will be sent' });
    }
});

// Reset password with token
router.post('/reset-password/:token', validatePasswordReset, async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;
        await userService.resetPassword(token, password);
        res.json({ message: 'Password has been reset' });
    } catch (error) {
        logger.error('Password reset error:', error);
        res.status(400).json({ error: error.message });
    }
});

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
router.patch('/profile', auth, async (req, res) => {
    try {
        const user = await userService.updateProfile(req.user._id, req.body);
        res.json(user);
    } catch (error) {
        logger.error('Error updating profile:', error);
        res.status(400).json({ error: error.message });
    }
});

// Change password
router.post('/change-password', auth, validatePasswordReset, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        await userService.changePassword(req.user._id, currentPassword, newPassword);
        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        logger.error('Password change error:', error);
        res.status(400).json({ error: error.message });
    }
});

module.exports = router; 