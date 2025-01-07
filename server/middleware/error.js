const logger = require('../utils/logger');

// Error handling middleware
const errorHandler = (err, req, res, next) => {
    logger.error('Error:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });

    // Handle validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            details: Object.values(err.errors).map(error => ({
                field: error.path,
                message: error.message
            }))
        });
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Invalid token'
        });
    }

    // Handle token expiration
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'Token expired'
        });
    }

    // Handle file upload errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            error: 'File too large'
        });
    }

    // Handle duplicate key errors
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(400).json({
            error: `${field} already exists`
        });
    }

    // Handle cast errors (invalid ObjectId)
    if (err.name === 'CastError') {
        return res.status(400).json({
            error: 'Invalid ID format'
        });
    }

    // Handle multer errors
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
            error: 'Unexpected file upload'
        });
    }

    // Handle socket.io errors
    if (err.type === 'TransportError') {
        return res.status(500).json({
            error: 'Connection error'
        });
    }

    // Default error
    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'An error occurred'
        : err.message || 'Internal Server Error';

    res.status(statusCode).json({
        error: message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
};

// Not found middleware
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
};

// Rate limit error handler
const rateLimitHandler = (req, res) => {
    logger.warn('Rate limit exceeded:', {
        ip: req.ip,
        path: req.path
    });

    res.status(429).json({
        error: 'Too many requests, please try again later'
    });
};

module.exports = {
    errorHandler,
    notFound,
    rateLimitHandler
}; 