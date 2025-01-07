const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const { handleMessage, handleReaction } = require('./socket/messageHandlers');
const { handleJoin, handleDisconnect, handleTyping } = require('./socket/userHandlers');
const fileUpload = require('express-fileupload');
require('dotenv').config();

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

// File upload middleware
app.use(fileUpload({
    createParentPath: true,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB max file size
    },
    abortOnLimit: true
}));

app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Import routes
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Socket.IO CORS configuration
const io = socketIO(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST", "PUT", "PATCH"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true
    }
});

// Socket middleware for authentication
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication error'));
    }
    // Verify token and attach user to socket
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        next();
    } catch (err) {
        next(new Error('Authentication error'));
    }
});

io.on('connection', (socket) => {
    console.log('New client connected:', socket.user.username);

    // Join room
    socket.on('join', (data) => handleJoin(io, socket, data));

    // Handle messages
    socket.on('message', (data) => handleMessage(io, socket, data));

    // Handle reactions
    socket.on('reaction', (data) => handleReaction(io, socket, data));

    // Handle typing indicators
    socket.on('typing', (data) => handleTyping(io, socket, data, true));
    socket.on('stopTyping', (data) => handleTyping(io, socket, data, false));

    // Handle disconnection
    socket.on('disconnect', () => handleDisconnect(io, socket));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 