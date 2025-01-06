const {
    handleCreateRoom,
    handleJoinRoom,
    handleLeaveRoom,
    handleDeleteRoom,
    handleInviteMember,
    handleAcceptInvite,
    handleGetRooms
} = require('./roomHandlers');

const {
    handleSendMessage,
    handleTyping,
    handleReadMessage
} = require('./messageHandlers');

const { verifyToken } = require('../utils/auth');

module.exports = (io) => {
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error'));
            }

            const user = await verifyToken(token);
            socket.user = user;
            next();
        } catch (error) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        console.log('User connected:', socket.user.name);

        // Room events
        socket.on('createRoom', async (data, callback) => {
            const result = await handleCreateRoom(io, socket, data);
            callback(result);
        });

        socket.on('joinRoom', async (data, callback) => {
            const result = await handleJoinRoom(io, socket, data);
            callback(result);
        });

        socket.on('leaveRoom', async (data, callback) => {
            const result = await handleLeaveRoom(io, socket, data);
            callback(result);
        });

        socket.on('deleteRoom', async (data, callback) => {
            const result = await handleDeleteRoom(io, socket, data);
            callback(result);
        });

        socket.on('inviteMember', async (data, callback) => {
            const result = await handleInviteMember(io, socket, data);
            callback(result);
        });

        socket.on('acceptInvite', async (data, callback) => {
            const result = await handleAcceptInvite(io, socket, data);
            callback(result);
        });

        socket.on('getRooms', async (callback) => {
            const result = await handleGetRooms(socket);
            callback(result);
        });

        // Message events
        socket.on('sendMessage', async (data, callback) => {
            const result = await handleSendMessage(io, socket, data);
            callback(result);
        });

        socket.on('typing', async (data) => {
            await handleTyping(io, socket, data);
        });

        socket.on('readMessage', async (data, callback) => {
            const result = await handleReadMessage(io, socket, data);
            callback(result);
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.user.name);
        });
    });
}; 