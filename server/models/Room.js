const mongoose = require('mongoose');
const crypto = require('crypto');

const roomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    type: {
        type: String,
        enum: ['public', 'private', 'direct'],
        default: 'public'
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['owner', 'admin', 'member'],
            default: 'member'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        },
        lastRead: {
            type: Date,
            default: Date.now
        }
    }],
    channels: [{
        name: {
            type: String,
            required: true,
            trim: true
        },
        description: String,
        type: {
            type: String,
            enum: ['text', 'voice', 'announcement'],
            default: 'text'
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        permissions: {
            canSendMessages: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }],
            canManageMessages: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }]
        }
    }],
    invites: [{
        email: String,
        token: String,
        invitedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        expiresAt: Date,
        role: {
            type: String,
            enum: ['admin', 'member'],
            default: 'member'
        }
    }],
    pinnedMessages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    }],
    settings: {
        allowReactions: {
            type: Boolean,
            default: true
        },
        allowReplies: {
            type: Boolean,
            default: true
        },
        allowPins: {
            type: Boolean,
            default: true
        },
        allowFileUploads: {
            type: Boolean,
            default: true
        },
        allowVoiceMessages: {
            type: Boolean,
            default: true
        },
        allowGifs: {
            type: Boolean,
            default: true
        },
        requireApprovalForJoin: {
            type: Boolean,
            default: false
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Pre-save middleware
roomSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

// Method to create a new channel
roomSchema.methods.createChannel = async function (channelData, userId) {
    this.channels.push({
        ...channelData,
        createdBy: userId,
        createdAt: new Date()
    });
    return this.save();
};

// Method to delete a channel
roomSchema.methods.deleteChannel = async function (channelId) {
    this.channels = this.channels.filter(channel => !channel._id.equals(channelId));
    return this.save();
};

// Method to update channel settings
roomSchema.methods.updateChannel = async function (channelId, updates) {
    const channel = this.channels.id(channelId);
    if (channel) {
        Object.assign(channel, updates);
        return this.save();
    }
    throw new Error('Channel not found');
};

// Method to add a member
roomSchema.methods.addMember = async function (userId, role = 'member') {
    if (!this.members.find(member => member.userId.equals(userId))) {
        this.members.push({
            userId,
            role,
            joinedAt: new Date()
        });
        return this.save();
    }
};

// Method to remove a member
roomSchema.methods.removeMember = async function (userId) {
    this.members = this.members.filter(member => !member.userId.equals(userId));
    return this.save();
};

// Method to update member role
roomSchema.methods.updateMemberRole = async function (userId, newRole) {
    const member = this.members.find(member => member.userId.equals(userId));
    if (member) {
        member.role = newRole;
        return this.save();
    }
    throw new Error('Member not found');
};

// Method to create an invite
roomSchema.methods.createInvite = async function (email, invitedBy, role = 'member') {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    this.invites.push({
        email,
        token,
        invitedBy,
        expiresAt,
        role
    });

    return this.save();
};

// Method to validate an invite
roomSchema.methods.validateInvite = async function (token) {
    const invite = this.invites.find(inv => inv.token === token && inv.expiresAt > new Date());
    return invite || null;
};

const Room = mongoose.model('Room', roomSchema);

module.exports = Room; 