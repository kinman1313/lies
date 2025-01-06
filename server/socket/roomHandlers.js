const Room = require('../models/Room');
const Message = require('../models/Message');
const User = require('../models/User');
const { sendInviteEmail } = require('../services/emailService');

const handleJoinRoom = async (io, socket, { roomId }) => {
    try {
        const room = await Room.findById(roomId)
            .populate('members.userId', 'username avatar')
            .populate({
                path: 'pinnedMessages',
                populate: {
                    path: 'userId',
                    select: 'username avatar'
                }
            });

        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }

        const member = room.members.find(m => m.userId._id.equals(socket.user._id));
        if (!member && room.isPrivate) {
            socket.emit('error', { message: 'Not authorized to join this room' });
            return;
        }

        socket.join(roomId);

        // Send room data
        socket.emit('roomData', {
            room,
            messages: await Message.findByRoom(roomId, 50)
        });

        // Notify other members
        socket.to(roomId).emit('userJoinedRoom', {
            roomId,
            user: {
                _id: socket.user._id,
                username: socket.user.username,
                avatar: socket.user.avatar
            }
        });
    } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
    }
};

const handleCreateRoom = async (io, socket, { name, isPrivate = false, description = '' }) => {
    try {
        const room = new Room({
            name,
            ownerId: socket.user._id,
            isPrivate,
            description,
            members: [{
                userId: socket.user._id,
                role: 'owner'
            }]
        });

        await room.save();

        // Join the room
        socket.join(room._id);

        // Notify all connected clients about the new room if it's public
        if (!isPrivate) {
            io.emit('roomCreated', { room });
        }

        socket.emit('roomJoined', { room });
    } catch (error) {
        console.error('Error creating room:', error);
        socket.emit('error', { message: 'Failed to create room' });
    }
};

const handleInviteToRoom = async (io, socket, { roomId, email, role = 'member' }) => {
    try {
        const room = await Room.findById(roomId);
        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }

        const member = room.members.find(m => m.userId.equals(socket.user._id));
        if (!member || !['owner', 'admin'].includes(member.role)) {
            socket.emit('error', { message: 'Not authorized to invite users' });
            return;
        }

        const token = await room.createInvite(email, socket.user._id, role);

        // Send invite email
        await sendInviteEmail(email, {
            inviter: socket.user.username,
            roomName: room.name,
            inviteLink: `${process.env.CLIENT_URL}/invite/${token}`
        });

        socket.emit('inviteSent', { email });
    } catch (error) {
        console.error('Error sending invite:', error);
        socket.emit('error', { message: 'Failed to send invite' });
    }
};

const handlePinMessage = async (io, socket, { roomId, messageId }) => {
    try {
        const room = await Room.findById(roomId);
        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }

        const member = room.members.find(m => m.userId.equals(socket.user._id));
        if (!member || !['owner', 'admin'].includes(member.role)) {
            socket.emit('error', { message: 'Not authorized to pin messages' });
            return;
        }

        const message = await Message.findById(messageId);
        if (!message) {
            socket.emit('error', { message: 'Message not found' });
            return;
        }

        await message.pin(socket.user._id);
        await room.pinMessage(messageId);

        io.to(roomId).emit('messagePinned', {
            messageId,
            pinnedBy: {
                _id: socket.user._id,
                username: socket.user.username
            }
        });
    } catch (error) {
        console.error('Error pinning message:', error);
        socket.emit('error', { message: 'Failed to pin message' });
    }
};

const handleUnpinMessage = async (io, socket, { roomId, messageId }) => {
    try {
        const room = await Room.findById(roomId);
        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }

        const member = room.members.find(m => m.userId.equals(socket.user._id));
        if (!member || !['owner', 'admin'].includes(member.role)) {
            socket.emit('error', { message: 'Not authorized to unpin messages' });
            return;
        }

        const message = await Message.findById(messageId);
        if (!message) {
            socket.emit('error', { message: 'Message not found' });
            return;
        }

        await message.unpin();
        await room.unpinMessage(messageId);

        io.to(roomId).emit('messageUnpinned', { messageId });
    } catch (error) {
        console.error('Error unpinning message:', error);
        socket.emit('error', { message: 'Failed to unpin message' });
    }
};

module.exports = {
    handleJoinRoom,
    handleCreateRoom,
    handleInviteToRoom,
    handlePinMessage,
    handleUnpinMessage
}; 