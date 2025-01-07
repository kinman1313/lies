const winston = require('winston');
const path = require('path');

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: logFormat,
    defaultMeta: { service: 'chat-service' },
    transports: [
        // Write all logs with level 'error' and below to error.log
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // Write all logs with level 'info' and below to combined.log
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ]
});

// If we're not in production, log to the console with a simpler format
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

// Create log directory if it doesn't exist
const fs = require('fs');
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// Add request logging middleware
logger.requestMiddleware = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info('HTTP Request', {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('user-agent')
        });
    });
    next();
};

// Add error logging middleware
logger.errorMiddleware = (err, req, res, next) => {
    logger.error('Unhandled Error', {
        error: err.message,
        stack: err.stack,
        method: req.method,
        url: req.url,
        ip: req.ip
    });
    next(err);
};

// Add custom logging methods
logger.logSocketConnection = (socketId, userId) => {
    logger.info('Socket Connected', {
        socketId,
        userId,
        timestamp: new Date().toISOString()
    });
};

logger.logSocketDisconnection = (socketId, userId) => {
    logger.info('Socket Disconnected', {
        socketId,
        userId,
        timestamp: new Date().toISOString()
    });
};

logger.logMessageSent = (messageId, userId, channelId) => {
    logger.info('Message Sent', {
        messageId,
        userId,
        channelId,
        timestamp: new Date().toISOString()
    });
};

logger.logChannelActivity = (channelId, activity, userId) => {
    logger.info('Channel Activity', {
        channelId,
        activity,
        userId,
        timestamp: new Date().toISOString()
    });
};

logger.logUserActivity = (userId, activity) => {
    logger.info('User Activity', {
        userId,
        activity,
        timestamp: new Date().toISOString()
    });
};

logger.logFileOperation = (operation, fileInfo) => {
    logger.info('File Operation', {
        operation,
        ...fileInfo,
        timestamp: new Date().toISOString()
    });
};

// Export logger instance
module.exports = logger; 