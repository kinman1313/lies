const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');

// Login route
router.post('/login', async (req, res) => {
    try {
        console.log('Login attempt:', {
            email: req.body.email
        });

        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            console.log('Missing login fields:', {
                hasEmail: !!email,
                hasPassword: !!password
            });
            return res.status(400).json({
                message: 'Email and password are required'
            });
        }

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) {
            console.log('User not found:', { email });
            return res.status(400).json({
                message: 'Invalid email or password'
            });
        }

        // Check password
        const validPassword = await user.checkPassword(password);

        if (!validPassword) {
            console.log('Invalid password for user:', { email });
            return res.status(400).json({
                message: 'Invalid email or password'
            });
        }

        // Generate auth token
        const token = await user.generateAuthToken();

        console.log('Login successful:', {
            userId: user._id,
            email: user.email
        });

        // Send response without password
        const { password: _, ...userWithoutPassword } = user.toObject();
        res.json({
            token,
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Login error:', {
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({
            message: 'Error logging in',
            details: error.message
        });
    }
});

// Register route
router.post('/register', async (req, res) => {
    try {
        console.log('Registration attempt:', {
            email: req.body.email,
            username: req.body.username
        });

        const { username, email, password } = req.body;

        // Validate input
        if (!username || !email || !password) {
            console.log('Missing registration fields:', {
                hasUsername: !!username,
                hasEmail: !!email,
                hasPassword: !!password
            });
            return res.status(400).json({
                message: 'All fields are required'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            console.log('User already exists:', {
                existingEmail: existingUser.email === email,
                existingUsername: existingUser.username === username
            });
            return res.status(400).json({
                message: existingUser.email === email
                    ? 'Email already registered'
                    : 'Username already taken'
            });
        }

        // Create new user
        const user = new User({
            username,
            email,
            password // Password will be hashed by the pre-save hook
        });

        // Save user
        await user.save();
        console.log('User registered successfully:', {
            userId: user._id,
            email: user.email
        });

        // Generate auth token
        const token = await user.generateAuthToken();

        // Send response without password
        const { password: _, ...userWithoutPassword } = user.toObject();
        res.status(201).json({
            token,
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Registration error:', {
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({
            message: 'Error registering user',
            details: error.message
        });
    }
});

// Generate password reset token
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // Token valid for 1 hour

        // Save reset token to user
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetTokenExpiry;
        await user.save();

        // Create email transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Send reset email
        const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Password Reset Request',
            html: `
                <h1>Password Reset Request</h1>
                <p>You requested a password reset. Click the link below to reset your password:</p>
                <a href="${resetUrl}">${resetUrl}</a>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: 'Password reset email sent' });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ message: 'Error sending reset email' });
    }
});

// Reset password with token
router.post('/reset-password/:token', async (req, res) => {
    try {
        console.log('Reset password attempt with token');
        const { token } = req.params;
        const { newPassword } = req.body;

        // Find user with valid reset token
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            console.log('Invalid or expired reset token');
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        console.log('Found user for password reset:', {
            userId: user._id,
            email: user.email
        });

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update user password and clear reset token
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        // Save user with new password
        await user.save();
        console.log('Password reset successful for user:', {
            userId: user._id,
            email: user.email
        });

        // Generate new auth token
        const authToken = await user.generateAuthToken();

        res.json({
            message: 'Password successfully reset',
            token: authToken
        });
    } catch (error) {
        console.error('Password reset error:', {
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({
            message: 'Error resetting password',
            details: error.message
        });
    }
});

module.exports = router; 