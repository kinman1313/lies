const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const { handleUpdateAvatar } = require('./socket/userHandlers');
const jwt = require('jsonwebtoken');
const messageScheduler = require('./services/messageScheduler');
require('dotenv').config();

// Start the message scheduler
messageScheduler.start();

// Get upload path from environment or default to local uploads directory
const UPLOAD_PATH = process.env.UPLOAD_PATH || path.join(__dirname, 'uploads');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Ensure upload directory exists
        if (!fs.existsSync(UPLOAD_PATH)) {
            fs.mkdirSync(UPLOAD_PATH, { recursive: true });
        }
        cb(null, UPLOAD_PATH);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    }
});

// Ensure uploads directory exists
const fs = require('fs');
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch((error) => console.error('MongoDB connection error:', error));

const app = express();
const server = http.createServer(app);

// Configure CORS
const allowedOrigins = [
    'http://localhost:3000',
    'https://lies-client.onrender.com',
    'https://lies-client.onrender.com/'
];

// CORS middleware configuration
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
}));

// Socket.IO CORS configuration
const io = socketIO(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST", "PUT", "PATCH"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
});

// Middleware to authenticate socket connections
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication token missing'));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        next();
    } catch (err) {
        next(new Error('Authentication failed'));
    }
});

app.use(express.json());

// Import routes
const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Store connected users with their socket IDs
const users = new Map();

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('join', (username) => {
        console.log('User joined:', username);
        socket.username = username;
        users.set(socket.id, username);
        io.emit('userJoined', { username, users: Array.from(users.values()) });
    });

    socket.on('message', (message) => {
        console.log('Message received:', message);
        const username = users.get(socket.id);
        if (!username) {
            console.error('No username found for socket:', socket.id);
            return;
        }

        let messageData;

        // Handle different message types
        if (typeof message === 'string') {
            // Simple text message
            messageData = {
                type: 'text',
                content: message,
                username,
                timestamp: new Date().toISOString(),
                reactions: []
            };
        } else {
            // Complex message object (file, voice, gif, etc.)
            messageData = {
                ...message,
                username,
                timestamp: new Date().toISOString(),
                reactions: []
            };
        }

        console.log('Emitting message data:', messageData);
        io.emit('message', messageData);
    });

    // Handle scheduled messages
    socket.on('scheduleMessage', async (message) => {
        const username = users.get(socket.id);
        if (!username) {
            console.error('No username found for socket:', socket.id);
            return;
        }

        try {
            const scheduledMessage = await messageScheduler.scheduleMessage({
                ...message,
                username,
                userId: socket.user._id
            }, new Date(message.metadata.scheduledFor));

            socket.emit('messageScheduled', {
                success: true,
                message: 'Message scheduled successfully',
                scheduledMessage
            });
        } catch (error) {
            console.error('Error scheduling message:', error);
            socket.emit('messageScheduled', {
                success: false,
                error: 'Failed to schedule message'
            });
        }
    });

    // Handle message disappearing settings
    socket.on('setMessageExpiry', async (data) => {
        const { messageId, expiryTime } = data;
        try {
            const message = await Message.findById(messageId);
            if (message) {
                message.expiresAt = new Date(Date.now() + expiryTime);
                await message.save();
                io.emit('messageUpdated', message);
            }
        } catch (error) {
            console.error('Error setting message expiry:', error);
        }
    });

    socket.on('typing', ({ username }) => {
        socket.broadcast.emit('typing', { username });
    });

    socket.on('stopTyping', ({ username }) => {
        socket.broadcast.emit('stopTyping', { username });
    });

    socket.on('disconnect', () => {
        const username = users.get(socket.id);
        if (username) {
            console.log('Client disconnected:', username);
            users.delete(socket.id);
            io.emit('userLeft', { username, users: Array.from(users.values()) });
        }
    });

    // Handle errors
    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Generate the correct URL for the uploaded file
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${path.basename(req.file.path)}`;

        console.log('File uploaded successfully:', {
            path: req.file.path,
            url: fileUrl
        });

        res.json({
            fileUrl,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            fileType: req.file.mimetype
        });
    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ error: 'File upload failed' });
    }
});

// Serve uploaded files with caching headers
app.use('/uploads', express.static(UPLOAD_PATH, {
    maxAge: '1d',
    setHeaders: function (res, path) {
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
}));

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 