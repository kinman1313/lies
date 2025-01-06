const { handleMessage, handleTyping, handleReaction } = require('./messageHandlers');
const { handleJoinRoom, handleLeaveRoom, handleGetRoomData } = require('./roomHandlers');
const { handleJoinLobby, handleLeaveLobby, handleCreatePrivateRoom, handleLobbyMessage } = require('./lobbyHandlers');

const initializeSocket = (io) => {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.userId);

        // Lobby handlers
        socket.on('joinLobby', () => handleJoinLobby(io, socket));
        socket.on('leaveLobby', () => handleLeaveLobby(socket));
        socket.on('sendLobbyMessage', (data) => handleLobbyMessage(io, socket, data));
        socket.on('createPrivateRoom', (data) => handleCreatePrivateRoom(io, socket, data));

        // Room handlers
        socket.on('joinRoom', (data) => handleJoinRoom(io, socket, data));
        socket.on('leaveRoom', (data) => handleLeaveRoom(io, socket, data));
        socket.on('getRoomData', (data, callback) => handleGetRoomData(socket, data, callback));

        // Message handlers
        socket.on('sendMessage', (data) => handleMessage(io, socket, data));
        socket.on('typing', (data) => handleTyping(io, socket, data));
        socket.on('messageReaction', (data) => handleReaction(io, socket, data));

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.userId);
            // Notify lobby about user disconnection
            io.to('lobby').emit('userDisconnected', socket.userId);
        });
    });
};

module.exports = initializeSocket; 