require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const MessageCleanupService = require('./services/messageCleanupService');

// Import routes
const userRoutes = require('./routes/users');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.CLIENT_URL || "https://lies-client.onrender.com",
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Initialize cleanup service
const messageCleanupService = new MessageCleanupService(io);
messageCleanupService.start();

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || "https://lies-client.onrender.com",
    credentials: true
}));
app.use(express.json());

// Mount routes
app.use('/api/auth', userRoutes); // Mount auth routes
app.use('/api/users', userRoutes); // Mount user routes for backward compatibility

// Socket connection handling
io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chat', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4
})
    .then(() => {
        console.log('Connected to MongoDB');
        // Only start server after DB connection is established
        const PORT = process.env.PORT || 8080;
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Cleaning up...');
    messageCleanupService.stop();
    server.close(() => {
        mongoose.connection.close(false, () => {
            console.log('Server closed. Database instance disconnected');
            process.exit(0);
        });
    });
}); 