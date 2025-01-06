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
    editHistory: [{
        content: String,
        editedAt: {
            type: Date,
            default: Date.now
        },
        editedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    isEdited: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date
    },
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    fileUrl: {
        type: String
    },
    fileName: {
        type: String
    },
    fileSize: {
        type: Number
    },
    fileType: {
        type: String
    },
    readBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }],
    // New fields for disappearing messages
    expiresAt: {
        type: Date
    },
    expirationMinutes: {
        type: Number
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

    // Set expiration date if expirationMinutes is set
    if (this.expirationMinutes && !this.expiresAt) {
        this.expiresAt = new Date(Date.now() + this.expirationMinutes * 60000);
    }

    next();
});

// Indexes for better query performance
messageSchema.index({ roomId: 1, createdAt: -1 });
messageSchema.index({ roomId: 1, isPinned: 1 });
messageSchema.index({ userId: 1 });
messageSchema.index({ 'reactions.users': 1 });
messageSchema.index({ 'readBy.user': 1 });
messageSchema.index({ isDeleted: 1 });
messageSchema.index({ expiresAt: 1 }); // New index for querying expired messages

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

messageSchema.methods.edit = async function (newContent, userId) {
    // Store the current content in edit history
    this.editHistory.push({
        content: this.content,
        editedAt: new Date(),
        editedBy: userId
    });
    this.content = newContent;
    this.isEdited = true;
    await this.save();
};

messageSchema.methods.softDelete = async function (userId) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = userId;
    await this.save();
};

messageSchema.methods.markAsRead = async function (userId) {
    const existingRead = this.readBy.find(read => read.user.toString() === userId.toString());
    if (!existingRead) {
        this.readBy.push({
            user: userId,
            readAt: new Date()
        });
        await this.save();
    }
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

// New method to set message expiration
messageSchema.methods.setExpiration = async function (minutes) {
    this.expirationMinutes = minutes;
    this.expiresAt = new Date(Date.now() + minutes * 60000);
    await this.save();
};

// New static method to clean up expired messages
messageSchema.statics.cleanupExpiredMessages = async function () {
    const now = new Date();
    const expiredMessages = await this.find({
        expiresAt: { $lte: now },
        isDeleted: false
    });

    for (const message of expiredMessages) {
        await message.softDelete('system');
    }

    return expiredMessages.length;
};

// Statics
messageSchema.statics.findPinnedByRoom = function (roomId) {
    return this.find({ roomId, isPinned: true })
        .sort({ pinnedAt: -1 })
        .populate('pinnedBy', 'username avatar');
};

messageSchema.statics.findByRoom = function (roomId, limit = 50, before) {
    const query = {
        roomId,
        $or: [
            { expiresAt: { $gt: new Date() } },
            { expiresAt: null }
        ]
    };
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