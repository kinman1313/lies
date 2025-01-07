const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Create rate limiters for different routes
const createRateLimiter = (options) => {
    return rateLimit({
        windowMs: options.windowMs || 15 * 60 * 1000, // Default: 15 minutes
        max: options.max || 100, // Default: 100 requests per windowMs
        message: options.message || 'Too many requests, please try again later',
        handler: (req, res) => {
            logger.warn('Rate limit exceeded:', {
                ip: req.ip,
                path: req.path,
                limit: options.max,
                windowMs: options.windowMs
            });

            res.status(429).json({
                error: options.message || 'Too many requests, please try again later'
            });
        },
        keyGenerator: (req) => {
            // Use IP address and user ID (if authenticated) as key
            return req.user ? `${req.ip}-${req.user._id}` : req.ip;
        },
        skip: (req) => {
            // Skip rate limiting for whitelisted IPs or admin users
            return (
                (process.env.WHITELIST_IPS || '').split(',').includes(req.ip) ||
                (req.user && req.user.isAdmin)
            );
        }
    });
};

// Rate limiter for authentication routes
const authLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    message: 'Too many login attempts, please try again later'
});

// Rate limiter for API routes
const apiLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // 100 requests per 15 minutes
});

// Rate limiter for file uploads
const uploadLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 uploads per hour
    message: 'Upload limit exceeded, please try again later'
});

// Rate limiter for message sending
const messageLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 messages per minute
    message: 'Message limit exceeded, please slow down'
});

// Rate limiter for search operations
const searchLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 searches per minute
    message: 'Search limit exceeded, please try again later'
});

module.exports = {
    authLimiter,
    apiLimiter,
    uploadLimiter,
    messageLimiter,
    searchLimiter,
    createRateLimiter
}; 