const Room = require('../models/Room');
const User = require('../models/User');
const Message = require('../models/Message');
const { sendEmail } = require('../utils/email');

const handleCreateRoom = async (io, socket, data) => {
    try {
        const room = new Room({
            name: data.name,
            ownerId: data.ownerId,
            members: [data.ownerId]
        });

        await room.save();

        // Notify room creation
        socket.emit('roomCreated', { success: true, room });
        io.emit('roomListUpdate');

        return { success: true, room };
    } catch (error) {
        console.error('Error creating room:', error);
        return { success: false, error: error.message };
    }
};

const handleJoinRoom = async (io, socket, data) => {
    try {
        const room = await Room.findById(data.roomId);
        if (!room) {
            return { success: false, error: 'Room not found' };
        }

        socket.join(data.roomId);

        // Load room data
        const members = await User.find({ _id: { $in: room.members } })
            .select('name avatar');

        const messages = await Message.find({ roomId: data.roomId })
            .sort({ createdAt: -1 })
            .limit(50)
            .populate('sender', 'name avatar');

        return {
            success: true,
            room,
            members,
            messages: messages.reverse()
        };
    } catch (error) {
        console.error('Error joining room:', error);
        return { success: false, error: error.message };
    }
};

const handleLeaveRoom = async (io, socket, data) => {
    try {
        const room = await Room.findById(data.roomId);
        if (!room) {
            return { success: false, error: 'Room not found' };
        }

        await room.removeMember(socket.user._id);
        socket.leave(data.roomId);

        // Notify room members
        io.to(data.roomId).emit('memberUpdate', {
            members: await User.find({ _id: { $in: room.members } })
                .select('name avatar')
        });

        return { success: true };
    } catch (error) {
        console.error('Error leaving room:', error);
        return { success: false, error: error.message };
    }
};

const handleDeleteRoom = async (io, socket, data) => {
    try {
        const room = await Room.findById(data.roomId);
        if (!room) {
            return { success: false, error: 'Room not found' };
        }

        if (!room.ownerId.equals(socket.user._id)) {
            return { success: false, error: 'Not authorized' };
        }

        // Notify members before deletion
        io.to(data.roomId).emit('roomDeleted', { roomId: data.roomId });

        // Delete room and its messages
        await Message.deleteMany({ roomId: data.roomId });
        await room.delete();

        io.emit('roomListUpdate');

        return { success: true };
    } catch (error) {
        console.error('Error deleting room:', error);
        return { success: false, error: error.message };
    }
};

const handleInviteMember = async (io, socket, data) => {
    try {
        const room = await Room.findById(data.roomId);
        if (!room) {
            return { success: false, error: 'Room not found' };
        }

        if (!room.settings.allowInvites) {
            return { success: false, error: 'Invites are disabled for this room' };
        }

        const inviteToken = await room.createInvite(data.email);

        // Send invitation email
        const inviteUrl = `${process.env.CLIENT_URL}/invite/${inviteToken}`;
        await sendEmail({
            to: data.email,
            subject: `You've been invited to join ${room.name}`,
            html: `
                <h2>Chat Room Invitation</h2>
                <p>You've been invited to join the chat room "${room.name}".</p>
                <p>Click the link below to join:</p>
                <a href="${inviteUrl}">${inviteUrl}</a>
                <p>This invitation will expire in 7 days.</p>
            `
        });

        return { success: true };
    } catch (error) {
        console.error('Error sending invite:', error);
        return { success: false, error: error.message };
    }
};

const handleAcceptInvite = async (io, socket, data) => {
    try {
        const room = await Room.findOne({ 'invites.token': data.token });
        if (!room) {
            return { success: false, error: 'Invalid invite' };
        }

        const isValid = await room.validateInvite(data.token);
        if (!isValid) {
            return { success: false, error: 'Invite has expired' };
        }

        await room.addMember(socket.user._id);
        await room.removeInvite(data.token);

        // Notify room members
        io.to(room._id.toString()).emit('memberUpdate', {
            members: await User.find({ _id: { $in: room.members } })
                .select('name avatar')
        });

        return { success: true, room };
    } catch (error) {
        console.error('Error accepting invite:', error);
        return { success: false, error: error.message };
    }
};

const handleGetRooms = async (socket) => {
    try {
        const rooms = await Room.findByMember(socket.user._id)
            .select('name members lastActivity')
            .lean();

        // Add member count to each room
        const roomsWithCounts = rooms.map(room => ({
            ...room,
            memberCount: room.members.length,
            unreadCount: 0 // TODO: Implement unread count
        }));

        return { success: true, rooms: roomsWithCounts };
    } catch (error) {
        console.error('Error getting rooms:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    handleCreateRoom,
    handleJoinRoom,
    handleLeaveRoom,
    handleDeleteRoom,
    handleInviteMember,
    handleAcceptInvite,
    handleGetRooms
}; 