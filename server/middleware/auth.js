const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            throw new Error();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded._id).select('-password');

        if (!user) {
            throw new Error();
        }

        // Update last seen
        user.lastSeen = new Date();
        await user.save();

        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        logger.error('Authentication error:', error);
        res.status(401).json({ error: 'Please authenticate' });
    }
};

module.exports = auth; 