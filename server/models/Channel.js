const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 50
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    isPrivate: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    pinnedMessages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    }],
    settings: {
        notifications: {
            type: Boolean,
            default: true
        },
        messageExpiry: {
            type: Number,
            default: 0 // 0 means no expiry
        },
        allowReactions: {
            type: Boolean,
            default: true
        },
        allowReplies: {
            type: Boolean,
            default: true
        },
        allowVoiceMessages: {
            type: Boolean,
            default: true
        },
        allowFileUploads: {
            type: Boolean,
            default: true
        }
    }
}, {
    timestamps: true
});

// Indexes
channelSchema.index({ name: 'text', description: 'text' });
channelSchema.index({ createdBy: 1 });
channelSchema.index({ members: 1 });
channelSchema.index({ isPrivate: 1 });

// Virtual for member count
channelSchema.virtual('memberCount').get(function () {
    return this.members.length;
});

// Pre-save middleware
channelSchema.pre('save', async function (next) {
    // Ensure creator is a member
    if (!this.members.includes(this.createdBy)) {
        this.members.push(this.createdBy);
    }
    next();
});

// Methods
channelSchema.methods.addMember = async function (userId) {
    if (!this.members.includes(userId)) {
        this.members.push(userId);
        return this.save();
    }
    throw new Error('User is already a member');
};

channelSchema.methods.removeMember = async function (userId) {
    if (userId.toString() === this.createdBy.toString()) {
        throw new Error('Cannot remove channel creator');
    }

    const memberIndex = this.members.indexOf(userId);
    if (memberIndex === -1) {
        throw new Error('User is not a member');
    }

    this.members.splice(memberIndex, 1);
    return this.save();
};

channelSchema.methods.pinMessage = async function (messageId) {
    if (!this.pinnedMessages.includes(messageId)) {
        this.pinnedMessages.push(messageId);
        return this.save();
    }
    throw new Error('Message is already pinned');
};

channelSchema.methods.unpinMessage = async function (messageId) {
    const messageIndex = this.pinnedMessages.indexOf(messageId);
    if (messageIndex === -1) {
        throw new Error('Message is not pinned');
    }

    this.pinnedMessages.splice(messageIndex, 1);
    return this.save();
};

channelSchema.methods.updateSettings = async function (settings) {
    this.settings = { ...this.settings, ...settings };
    return this.save();
};

// Statics
channelSchema.statics.findByMember = function (userId) {
    return this.find({ members: userId })
        .populate('createdBy', 'username avatar')
        .populate('members', 'username avatar')
        .sort({ updatedAt: -1 });
};

channelSchema.statics.findPublic = function () {
    return this.find({ isPrivate: false })
        .populate('createdBy', 'username avatar')
        .populate('members', 'username avatar')
        .sort({ createdAt: -1 });
};

channelSchema.statics.search = function (query) {
    return this.find(
        { $text: { $search: query } },
        { score: { $meta: 'textScore' } }
    )
        .sort({ score: { $meta: 'textScore' } })
        .populate('createdBy', 'username avatar')
        .populate('members', 'username avatar');
};

const Channel = mongoose.model('Channel', channelSchema);
module.exports = Channel; 