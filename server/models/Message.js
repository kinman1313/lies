const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['text', 'gif', 'voice', 'file', 'reply'],
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
        count: {
            type: Number,
            default: 1
        },
        users: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }]
    }],
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    replyChain: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    }],
    replyCount: {
        type: Number,
        default: 0
    },
    scheduledFor: {
        type: Date
    },
    isScheduled: {
        type: Boolean,
        default: false
    },
    editHistory: [{
        content: String,
        editedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        editedAt: {
            type: Date,
            default: Date.now
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
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Pre-save middleware to update timestamps
messageSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

// Method to add a reaction
messageSchema.methods.addReaction = async function (emoji, userId) {
    const reaction = this.reactions.find(r => r.emoji === emoji);
    if (reaction) {
        if (!reaction.users.includes(userId)) {
            reaction.users.push(userId);
            reaction.count = reaction.users.length;
        }
    } else {
        this.reactions.push({
            emoji,
            users: [userId],
            count: 1
        });
    }
    return this.save();
};

// Method to remove a reaction
messageSchema.methods.removeReaction = async function (emoji, userId) {
    const reaction = this.reactions.find(r => r.emoji === emoji);
    if (reaction) {
        reaction.users = reaction.users.filter(id => !id.equals(userId));
        reaction.count = reaction.users.length;
        if (reaction.users.length === 0) {
            this.reactions = this.reactions.filter(r => r.emoji !== emoji);
        }
    }
    return this.save();
};

// Method to add a reply
messageSchema.methods.addReply = async function (replyMessageId) {
    if (!this.replyChain.includes(replyMessageId)) {
        this.replyChain.push(replyMessageId);
        this.replyCount = this.replyChain.length;
    }
    return this.save();
};

// Method to schedule a message
messageSchema.methods.schedule = async function (scheduledDate) {
    this.scheduledFor = scheduledDate;
    this.isScheduled = true;
    return this.save();
};

// Method to cancel scheduling
messageSchema.methods.cancelSchedule = async function () {
    this.scheduledFor = null;
    this.isScheduled = false;
    return this.save();
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message; 