const User = require('../models/User');

const handleUpdateAvatar = async (io, socket, data) => {
    try {
        const { avatarData } = data;
        const user = await User.findOne({ username: socket.username });

        if (!user) {
            throw new Error('User not found');
        }

        // Update user's avatar
        user.profile = user.profile || {};
        user.profile.avatar = {
            url: avatarData,
            updatedAt: new Date()
        };

        await user.save();

        // Broadcast the avatar update to all connected clients
        io.emit('avatarUpdated', {
            username: socket.username,
            avatarUrl: avatarData
        });

    } catch (error) {
        console.error('Error updating avatar:', error);
        socket.emit('error', { message: 'Failed to update avatar' });
    }
};

module.exports = {
    handleUpdateAvatar
}; 