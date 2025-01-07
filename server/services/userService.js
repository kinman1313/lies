const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const fileService = require('./fileService');

class UserService {
    // Register a new user
    async register(userData) {
        try {
            const { email, username, password } = userData;

            // Check if user already exists
            const existingUser = await User.findOne({
                $or: [{ email }, { username }]
            });

            if (existingUser) {
                throw new Error('Email or username already exists');
            }

            const user = new User({
                email,
                username,
                password
            });

            const savedUser = await user.save();
            const token = savedUser.generateAuthToken();

            logger.info(`User registered: ${savedUser._id}`);
            return { user: savedUser, token };
        } catch (error) {
            logger.error('Error registering user:', error);
            throw error;
        }
    }

    // Login user
    async login(email, password) {
        try {
            const user = await User.findByCredentials(email, password);
            const token = user.generateAuthToken();

            logger.info(`User logged in: ${user._id}`);
            return { user, token };
        } catch (error) {
            logger.error('Error logging in user:', error);
            throw error;
        }
    }

    // Get user profile
    async getProfile(userId) {
        try {
            const user = await User.findById(userId).select('-password');
            if (!user) {
                throw new Error('User not found');
            }

            logger.info(`Retrieved profile for user: ${userId}`);
            return user;
        } catch (error) {
            logger.error('Error fetching user profile:', error);
            throw error;
        }
    }

    // Update user profile
    async updateProfile(userId, updates) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Handle avatar upload if included
            if (updates.avatar && updates.avatar.startsWith('data:')) {
                const avatarInfo = await fileService.saveFile({
                    fieldname: 'avatar',
                    buffer: Buffer.from(updates.avatar.split(',')[1], 'base64'),
                    originalname: `${userId}-avatar.png`
                });
                updates.avatar = avatarInfo.fileUrl;
            }

            await user.updateProfile(updates);
            logger.info(`Profile updated for user: ${userId}`);
            return user;
        } catch (error) {
            logger.error('Error updating user profile:', error);
            throw error;
        }
    }

    // Update user preferences
    async updatePreferences(userId, preferences) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            await user.updatePreferences(preferences);
            logger.info(`Preferences updated for user: ${userId}`);
            return user;
        } catch (error) {
            logger.error('Error updating user preferences:', error);
            throw error;
        }
    }

    // Update user status
    async updateStatus(userId, status) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            await user.updateStatus(status);
            logger.info(`Status updated for user: ${userId}`);
            return user;
        } catch (error) {
            logger.error('Error updating user status:', error);
            throw error;
        }
    }

    // Change password
    async changePassword(userId, currentPassword, newPassword) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            const isMatch = await user.comparePassword(currentPassword);
            if (!isMatch) {
                throw new Error('Current password is incorrect');
            }

            user.password = newPassword;
            await user.save();

            logger.info(`Password changed for user: ${userId}`);
            return true;
        } catch (error) {
            logger.error('Error changing password:', error);
            throw error;
        }
    }

    // Request password reset
    async requestPasswordReset(email) {
        try {
            const user = await User.findOne({ email });
            if (!user) {
                throw new Error('User not found');
            }

            await user.generatePasswordResetToken();
            // TODO: Send reset token via email

            logger.info(`Password reset requested for user: ${user._id}`);
            return true;
        } catch (error) {
            logger.error('Error requesting password reset:', error);
            throw error;
        }
    }

    // Reset password
    async resetPassword(token, newPassword) {
        try {
            const user = await User.findOne({
                resetPasswordToken: token,
                resetPasswordExpires: { $gt: Date.now() }
            });

            if (!user) {
                throw new Error('Invalid or expired reset token');
            }

            user.password = newPassword;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();

            logger.info(`Password reset completed for user: ${user._id}`);
            return true;
        } catch (error) {
            logger.error('Error resetting password:', error);
            throw error;
        }
    }

    // Verify email
    async verifyEmail(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded._id);

            if (!user) {
                throw new Error('User not found');
            }

            user.isVerified = true;
            user.verificationToken = undefined;
            await user.save();

            logger.info(`Email verified for user: ${user._id}`);
            return true;
        } catch (error) {
            logger.error('Error verifying email:', error);
            throw error;
        }
    }

    // Search users
    async searchUsers(query, currentUserId) {
        try {
            const users = await User.search(query);
            const filteredUsers = users.filter(user =>
                user._id.toString() !== currentUserId
            );

            logger.info(`Search performed for users with query: ${query}`);
            return filteredUsers;
        } catch (error) {
            logger.error('Error searching users:', error);
            throw error;
        }
    }

    // Get online users
    async getOnlineUsers() {
        try {
            const users = await User.findOnlineUsers();
            logger.info('Retrieved online users');
            return users;
        } catch (error) {
            logger.error('Error fetching online users:', error);
            throw error;
        }
    }
}

module.exports = new UserService(); 