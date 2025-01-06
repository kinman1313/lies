const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['text', 'gif', 'voice', 'file'],
        default: 'text'
    },
    content: {
        type: String,
        required: true
    },
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: () => ({})
    },
    username: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    pinnedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    pinnedAt: {
        type: Date
    },
    reactions: [{
        emoji: String,
        users: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }]
    }],
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
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

messageSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Indexes for better query performance
messageSchema.index({ roomId: 1, createdAt: -1 });
messageSchema.index({ roomId: 1, isPinned: 1 });
messageSchema.index({ userId: 1 });
messageSchema.index({ 'reactions.users': 1 });

// Methods
messageSchema.methods.pin = async function (userId) {
    this.isPinned = true;
    this.pinnedBy = userId;
    this.pinnedAt = new Date();
    await this.save();
};

messageSchema.methods.unpin = async function () {
    this.isPinned = false;
    this.pinnedBy = null;
    this.pinnedAt = null;
    await this.save();
};

messageSchema.methods.addReaction = async function (emoji, userId) {
    let reaction = this.reactions.find(r => r.emoji === emoji);
    if (!reaction) {
        reaction = { emoji, users: [] };
        this.reactions.push(reaction);
    }
    if (!reaction.users.includes(userId)) {
        reaction.users.push(userId);
        await this.save();
    }
};

messageSchema.methods.removeReaction = async function (emoji, userId) {
    const reaction = this.reactions.find(r => r.emoji === emoji);
    if (reaction) {
        reaction.users = reaction.users.filter(id => !id.equals(userId));
        if (reaction.users.length === 0) {
            this.reactions = this.reactions.filter(r => r.emoji !== emoji);
        }
        await this.save();
    }
};

// Statics
messageSchema.statics.findPinnedByRoom = function (roomId) {
    return this.find({ roomId, isPinned: true })
        .sort({ pinnedAt: -1 })
        .populate('pinnedBy', 'username avatar');
};

messageSchema.statics.findByRoom = function (roomId, limit = 50, before) {
    const query = { roomId };
    if (before) {
        query.createdAt = { $lt: before };
    }
    return this.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('userId', 'username avatar')
        .populate('replyTo');
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message; 