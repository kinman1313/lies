const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema({
    emoji: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    username: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const messageSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['text', 'file', 'voice', 'gif'],
        default: 'text'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    channelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Channel'
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    reactions: [reactionSchema],
    metadata: {
        fileUrl: String,
        fileName: String,
        fileSize: Number,
        fileType: String,
        duration: Number,
        thumbnailUrl: String,
        scheduledFor: Date,
        expiresAt: Date
    },
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    }
}, {
    timestamps: true
});

// Indexes
messageSchema.index({ channelId: 1, createdAt: -1 });
messageSchema.index({ userId: 1, createdAt: -1 });
messageSchema.index({ isPinned: 1 });
messageSchema.index({ 'metadata.scheduledFor': 1 });
messageSchema.index({ 'metadata.expiresAt': 1 });

// Virtual for checking if message is expired
messageSchema.virtual('isExpired').get(function () {
    if (!this.metadata.expiresAt) return false;
    return new Date() >= this.metadata.expiresAt;
});

// Virtual for checking if message is scheduled
messageSchema.virtual('isScheduled').get(function () {
    if (!this.metadata.scheduledFor) return false;
    return new Date() < this.metadata.scheduledFor;
});

// Pre-save middleware
messageSchema.pre('save', async function (next) {
    // If this is a file message, ensure fileUrl exists
    if (this.type === 'file' && !this.metadata.fileUrl) {
        throw new Error('File URL is required for file messages');
    }

    // If this is a voice message, ensure duration exists
    if (this.type === 'voice' && !this.metadata.duration) {
        throw new Error('Duration is required for voice messages');
    }

    next();
});

// Methods
messageSchema.methods.addReaction = async function (userId, emoji, username) {
    const existingReaction = this.reactions.find(
        r => r.userId.toString() === userId.toString() && r.emoji === emoji
    );

    if (existingReaction) {
        throw new Error('Reaction already exists');
    }

    this.reactions.push({ userId, emoji, username });
    return this.save();
};

messageSchema.methods.removeReaction = async function (userId, emoji) {
    const reactionIndex = this.reactions.findIndex(
        r => r.userId.toString() === userId.toString() && r.emoji === emoji
    );

    if (reactionIndex === -1) {
        throw new Error('Reaction not found');
    }

    this.reactions.splice(reactionIndex, 1);
    return this.save();
};

messageSchema.methods.pin = async function () {
    this.isPinned = true;
    return this.save();
};

messageSchema.methods.unpin = async function () {
    this.isPinned = false;
    return this.save();
};

messageSchema.methods.schedule = async function (scheduledFor) {
    this.metadata.scheduledFor = scheduledFor;
    return this.save();
};

messageSchema.methods.setExpiry = async function (expiryTime) {
    this.metadata.expiresAt = new Date(Date.now() + expiryTime);
    return this.save();
};

// Statics
messageSchema.statics.findByChannel = function (channelId) {
    return this.find({ channelId })
        .sort({ createdAt: -1 })
        .populate('userId', 'username avatar')
        .populate('replyTo');
};

messageSchema.statics.findPinned = function () {
    return this.find({ isPinned: true })
        .sort({ createdAt: -1 })
        .populate('userId', 'username avatar');
};

messageSchema.statics.findScheduled = function () {
    return this.find({
        'metadata.scheduledFor': { $exists: true, $gt: new Date() }
    })
        .sort({ 'metadata.scheduledFor': 1 })
        .populate('userId', 'username avatar');
};

messageSchema.statics.findExpired = function () {
    return this.find({
        'metadata.expiresAt': { $exists: true, $lte: new Date() }
    });
};

const Message = mongoose.model('Message', messageSchema);
module.exports = Message; 