require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const http = require('http');
const fileUpload = require('express-fileupload');
const { v4: uuidv4 } = require('uuid');

// Import middleware
const { errorHandler, notFound, rateLimitHandler } = require('./middleware/error');
const { authLimiter, apiLimiter } = require('./middleware/rateLimiter');
const logger = require('./utils/logger');

// Import routes
const messageRoutes = require('./routes/messages');
const channelRoutes = require('./routes/channels');
const userRoutes = require('./routes/users');

// Create Express app
const app = express();
const server = http.createServer(app);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => {
        logger.info('Connected to MongoDB');
    })
    .catch((error) => {
        logger.error('MongoDB connection error:', error);
        process.exit(1);
    });

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(logger.requestMiddleware);

// File upload middleware
app.use(fileUpload({
    createParentPath: true,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
    useTempFiles: true,
    tempFileDir: '/tmp/',
    debug: process.env.NODE_ENV === 'development'
}));

// File upload endpoint
app.post('/api/upload', async (req, res) => {
    try {
        if (!req.files || !req.files.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const file = req.files.file;
        const fileName = `${uuidv4()}-${file.name}`;
        const uploadPath = path.join(__dirname, 'uploads', fileName);

        await file.mv(uploadPath);

        res.json({
            fileUrl: `/uploads/${fileName}`,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.mimetype
        });
    } catch (error) {
        logger.error('File upload error:', error);
        res.status(500).json({ error: 'File upload failed' });
    }
});

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// Routes
app.use('/api/messages', messageRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Socket.IO setup
const io = require('socket.io')(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Socket authentication middleware
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication error'));
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        next();
    } catch (err) {
        next(new Error('Authentication error'));
    }
});

// Socket event handlers
const messageHandlers = require('./socket/messageHandlers');
const userHandlers = require('./socket/userHandlers');

io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.user?.username}`);

    // Message events
    socket.on('message', (data) => messageHandlers.handleMessage(io, socket, data));
    socket.on('reaction', (data) => messageHandlers.handleReaction(io, socket, data));
    socket.on('scheduleMessage', (data) => messageHandlers.handleScheduledMessage(io, socket, data));

    // User events
    socket.on('join', (data) => userHandlers.handleJoin(io, socket, data));
    socket.on('typing', (data) => userHandlers.handleTyping(io, socket, data, true));
    socket.on('stopTyping', (data) => userHandlers.handleTyping(io, socket, data, false));
    socket.on('disconnect', () => userHandlers.handleDisconnect(io, socket));
});

// Error handling
app.use(notFound);
app.use(errorHandler);
app.use(rateLimitHandler);

// Graceful shutdown
const gracefulShutdown = () => {
    logger.info('Received shutdown signal');
    server.close(() => {
        logger.info('Server closed');
        mongoose.connection.close(false, () => {
            logger.info('MongoDB connection closed');
            process.exit(0);
        });
    });

    setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Unhandled rejections and exceptions
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    gracefulShutdown();
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
}); 