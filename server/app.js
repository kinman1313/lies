const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const MessageCleanupService = require('./services/messageCleanupService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Initialize cleanup service
const messageCleanupService = new MessageCleanupService(io);
messageCleanupService.start();

// Middleware
app.use(cors());
app.use(express.json());

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
    useUnifiedTopology: true
})
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

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

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 