const User = require('../models/User');
const Room = require('../models/Room');

async function handleJoin(io, socket, data) {
    try {
        const { roomId } = data;
        const userId = socket.user._id;

        // Join the room's socket channel
        socket.join(roomId);

        // Get room details and update online users
        const room = await Room.findById(roomId);
        if (!room) {
            throw new Error('Room not found');
        }

        // Add user to room members if not already a member
        if (!room.members.some(m => m.userId.equals(userId))) {
            room.members.push({
                userId,
                joinedAt: new Date(),
                role: 'member'
            });
            await room.save();
        }

        // Get online users in the room
        const onlineUsers = await Promise.all(
            Array.from(await io.in(roomId).allSockets()).map(async (socketId) => {
                const socket = io.sockets.sockets.get(socketId);
                return {
                    _id: socket.user._id,
                    username: socket.user.username,
                    avatar: socket.user.avatar
                };
            })
        );

        // Notify room about new user
        io.to(roomId).emit('room:userJoined', {
            user: {
                _id: socket.user._id,
                username: socket.user.username,
                avatar: socket.user.avatar
            },
            onlineUsers
        });

    } catch (error) {
        console.error('Error handling join:', error);
        socket.emit('room:error', { error: error.message });
    }
}

async function handleDisconnect(io, socket) {
    try {
        const rooms = Array.from(socket.rooms).filter(room => room !== socket.id);

        // Notify each room about user disconnection
        for (const roomId of rooms) {
            const onlineUsers = await Promise.all(
                Array.from(await io.in(roomId).allSockets())
                    .filter(id => id !== socket.id)
                    .map(async (socketId) => {
                        const socket = io.sockets.sockets.get(socketId);
                        return {
                            _id: socket.user._id,
                            username: socket.user.username,
                            avatar: socket.user.avatar
                        };
                    })
            );

            io.to(roomId).emit('room:userLeft', {
                userId: socket.user._id,
                onlineUsers
            });
        }

    } catch (error) {
        console.error('Error handling disconnect:', error);
    }
}

async function handleTyping(io, socket, data, isTyping) {
    try {
        const { roomId } = data;

        io.to(roomId).emit('room:typing', {
            userId: socket.user._id,
            username: socket.user.username,
            isTyping
        });

    } catch (error) {
        console.error('Error handling typing indicator:', error);
        socket.emit('room:error', { error: error.message });
    }
}

module.exports = {
    handleJoin,
    handleDisconnect,
    handleTyping
}; 