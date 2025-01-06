const User = require('../models/User');
const Room = require('../models/Room');

const handleJoinLobby = async (io, socket) => {
    try {
        // Add user to lobby room
        socket.join('lobby');

        // Get online users
        const onlineUsers = await User.find({
            _id: { $in: Array.from(io.sockets.sockets.keys()) }
        }).select('username profile status');

        // Emit online users to the lobby
        io.to('lobby').emit('onlineUsers', onlineUsers);
    } catch (error) {
        console.error('Error joining lobby:', error);
        socket.emit('error', { message: 'Failed to join lobby' });
    }
};

const handleLeaveLobby = (socket) => {
    socket.leave('lobby');
};

const handleCreatePrivateRoom = async (io, socket, data) => {
    try {
        const { targetUserId } = data;

        // Check if a private room already exists between these users
        const existingRoom = await Room.findOne({
            type: 'private',
            members: {
                $all: [socket.userId, targetUserId],
                $size: 2
            }
        });

        if (existingRoom) {
            socket.emit('roomCreated', {
                success: true,
                roomId: existingRoom._id
            });
            return;
        }

        // Create new private room
        const newRoom = new Room({
            name: 'Private Chat',
            type: 'private',
            members: [socket.userId, targetUserId],
            ownerId: socket.userId
        });

        await newRoom.save();

        // Notify both users
        io.to(socket.userId).to(targetUserId).emit('roomCreated', {
            success: true,
            roomId: newRoom._id
        });

    } catch (error) {
        console.error('Error creating private room:', error);
        socket.emit('error', { message: 'Failed to create private room' });
    }
};

module.exports = {
    handleJoinLobby,
    handleLeaveLobby,
    handleCreatePrivateRoom
}; 