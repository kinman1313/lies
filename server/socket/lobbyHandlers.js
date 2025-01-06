const User = require('../models/User');
const Room = require('../models/Room');
const Message = require('../models/Message');

const handleJoinLobby = async (io, socket) => {
    try {
        // Add user to lobby room
        socket.join('lobby');

        // Get online users
        const onlineUsers = await User.find({
            _id: { $in: Array.from(io.sockets.sockets.keys()) }
        }).select('username profile status');

        // Get recent lobby messages
        const recentMessages = await Message.find({ roomType: 'lobby' })
            .sort('-createdAt')
            .limit(50)
            .populate('userId', 'username profile');

        // Send initial data to the user
        socket.emit('lobbyData', {
            users: onlineUsers,
            messages: recentMessages.reverse()
        });

        // Notify others about new user
        io.to('lobby').emit('onlineUsers', onlineUsers);
    } catch (error) {
        console.error('Error joining lobby:', error);
        socket.emit('error', { message: 'Failed to join lobby' });
    }
};

const handleLeaveLobby = (socket) => {
    socket.leave('lobby');
};

const handleLobbyMessage = async (io, socket, data) => {
    try {
        const { content, type = 'text' } = data;

        // Create and save message
        const message = new Message({
            content,
            type,
            userId: socket.userId,
            roomType: 'lobby',
            metadata: data.metadata || {}
        });

        await message.save();

        // Populate user data
        await message.populate('userId', 'username profile');

        // Broadcast message to lobby
        io.to('lobby').emit('lobbyMessage', {
            ...message.toObject(),
            username: socket.username,
            avatar: socket.user?.profile?.avatar?.url
        });

    } catch (error) {
        console.error('Error sending lobby message:', error);
        socket.emit('error', { message: 'Failed to send message' });
    }
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
            // Get recent messages
            const messages = await Message.find({ roomId: existingRoom._id })
                .sort('-createdAt')
                .limit(50)
                .populate('userId', 'username profile');

            socket.emit('roomCreated', {
                success: true,
                roomId: existingRoom._id,
                messages: messages.reverse()
            });
            return;
        }

        // Get target user data
        const targetUser = await User.findById(targetUserId).select('username profile');
        if (!targetUser) {
            throw new Error('Target user not found');
        }

        // Create new private room
        const newRoom = new Room({
            name: `${socket.username} & ${targetUser.username}`,
            type: 'private',
            members: [socket.userId, targetUserId],
            ownerId: socket.userId
        });

        await newRoom.save();

        // Notify both users
        const roomData = {
            success: true,
            roomId: newRoom._id,
            name: newRoom.name,
            type: 'private',
            members: [
                { id: socket.userId, username: socket.username },
                { id: targetUser._id, username: targetUser.username }
            ],
            messages: []
        };

        io.to(socket.userId).to(targetUserId).emit('roomCreated', roomData);

    } catch (error) {
        console.error('Error creating private room:', error);
        socket.emit('error', { message: 'Failed to create private room' });
    }
};

module.exports = {
    handleJoinLobby,
    handleLeaveLobby,
    handleLobbyMessage,
    handleCreatePrivateRoom
}; 