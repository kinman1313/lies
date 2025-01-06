const mongoose = require('mongoose');

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
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    invites: [{
        email: String,
        token: String,
        expiresAt: Date
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
        }
    }
});

// Indexes for better query performance
roomSchema.index({ name: 'text' });
roomSchema.index({ members: 1 });
roomSchema.index({ 'invites.email': 1 });
roomSchema.index({ lastActivity: -1 });

// Methods
roomSchema.methods.addMember = async function (userId) {
    if (!this.members.includes(userId)) {
        this.members.push(userId);
        this.lastActivity = new Date();
        await this.save();
    }
};

roomSchema.methods.removeMember = async function (userId) {
    this.members = this.members.filter(id => !id.equals(userId));
    this.lastActivity = new Date();
    await this.save();
};

roomSchema.methods.createInvite = async function (email) {
    const token = require('crypto').randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    this.invites.push({
        email,
        token,
        expiresAt
    });

    await this.save();
    return token;
};

roomSchema.methods.validateInvite = async function (token) {
    const invite = this.invites.find(inv => inv.token === token);
    if (!invite) return false;

    if (invite.expiresAt < new Date()) {
        this.invites = this.invites.filter(inv => inv.token !== token);
        await this.save();
        return false;
    }

    return true;
};

roomSchema.methods.removeInvite = async function (token) {
    this.invites = this.invites.filter(inv => inv.token !== token);
    await this.save();
};

// Statics
roomSchema.statics.findByMember = function (userId) {
    return this.find({ members: userId })
        .sort({ lastActivity: -1 });
};

roomSchema.statics.findByInviteEmail = function (email) {
    return this.find({
        'invites.email': email,
        'invites.expiresAt': { $gt: new Date() }
    });
};

const Room = mongoose.model('Room', roomSchema);

module.exports = Room; 