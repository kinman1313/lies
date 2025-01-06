const mongoose = require('mongoose');
const crypto = require('crypto');

const roomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
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
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastActivity: {
        type: Date,
        default: Date.now
    },
    isPrivate: {
        type: Boolean,
        default: false
    },
    description: {
        type: String,
        trim: true
    },
    avatar: {
        type: String
    },
    settings: {
        allowInvites: {
            type: Boolean,
            default: true
        },
        memberLimit: {
            type: Number,
            default: 100
        },
        messageRetention: {
            type: Number,
            default: 30 // days
        },
        allowReactions: {
            type: Boolean,
            default: true
        },
        allowPinning: {
            type: Boolean,
            default: true
        },
        allowVoiceMessages: {
            type: Boolean,
            default: true
        },
        allowFileSharing: {
            type: Boolean,
            default: true
        }
    }
});

// Indexes
roomSchema.index({ name: 'text', description: 'text' });
roomSchema.index({ 'members.userId': 1 });
roomSchema.index({ 'invites.email': 1 });
roomSchema.index({ lastActivity: -1 });
roomSchema.index({ isPrivate: 1 });

// Methods
roomSchema.methods.addMember = async function (userId, role = 'member') {
    if (!this.members.find(m => m.userId.equals(userId))) {
        this.members.push({
            userId,
            role,
            joinedAt: new Date()
        });
        this.lastActivity = new Date();
        await this.save();
    }
};

roomSchema.methods.removeMember = async function (userId) {
    this.members = this.members.filter(m => !m.userId.equals(userId));
    this.lastActivity = new Date();
    await this.save();
};

roomSchema.methods.createInvite = async function (email, invitedBy, role = 'member') {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    this.invites.push({
        email,
        token,
        invitedBy,
        role,
        expiresAt
    });

    await this.save();
    return token;
};

roomSchema.methods.validateInvite = async function (token) {
    const invite = this.invites.find(inv => inv.token === token);
    if (!invite) return null;

    if (invite.expiresAt < new Date()) {
        this.invites = this.invites.filter(inv => inv.token !== token);
        await this.save();
        return null;
    }

    return invite;
};

roomSchema.methods.removeInvite = async function (token) {
    this.invites = this.invites.filter(inv => inv.token !== token);
    await this.save();
};

roomSchema.methods.pinMessage = async function (messageId) {
    if (!this.pinnedMessages.includes(messageId)) {
        this.pinnedMessages.push(messageId);
        await this.save();
    }
};

roomSchema.methods.unpinMessage = async function (messageId) {
    this.pinnedMessages = this.pinnedMessages.filter(id => !id.equals(messageId));
    await this.save();
};

roomSchema.methods.updateRole = async function (userId, newRole) {
    const member = this.members.find(m => m.userId.equals(userId));
    if (member) {
        member.role = newRole;
        await this.save();
    }
};

// Statics
roomSchema.statics.findByMember = function (userId) {
    return this.find({ 'members.userId': userId })
        .sort({ lastActivity: -1 })
        .populate('members.userId', 'username avatar')
        .populate('pinnedMessages');
};

roomSchema.statics.findByInviteEmail = function (email) {
    return this.find({
        'invites.email': email,
        'invites.expiresAt': { $gt: new Date() }
    });
};

roomSchema.statics.findPublicRooms = function () {
    return this.find({ isPrivate: false })
        .sort({ lastActivity: -1 })
        .select('-invites');
};

const Room = mongoose.model('Room', roomSchema);

module.exports = Room; 