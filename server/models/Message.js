const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true,
        index: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        required: true,
        enum: ['text', 'image', 'file', 'voice', 'video', 'system']
    },
    encryptedContent: {
        type: Map,
        of: {
            type: {
                type: String,
                required: true
            },
            body: {
                type: String,
                required: true
            },
            registrationId: {
                type: Number,
                required: true
            }
        },
        required: true
    },
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: new Map()
    },
    readBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date
    },
    editedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Indexes for better query performance
messageSchema.index({ roomId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, createdAt: -1 });
messageSchema.index({ roomId: 1, isDeleted: 1 });

// Methods
messageSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.__v;
    return obj;
};

messageSchema.methods.markAsRead = async function (userId) {
    if (!this.readBy.includes(userId)) {
        this.readBy.push(userId);
        await this.save();
    }
    return this;
};

messageSchema.methods.softDelete = async function () {
    this.isDeleted = true;
    this.deletedAt = new Date();
    await this.save();
    return this;
};

// Statics
messageSchema.statics.getUnreadCount = async function (roomId, userId) {
    return this.countDocuments({
        roomId,
        senderId: { $ne: userId },
        readBy: { $ne: userId },
        isDeleted: false
    });
};

messageSchema.statics.getMessagesByRoom = async function (roomId, options = {}) {
    const {
        limit = 50,
        before,
        after,
        includeDeleted = false
    } = options;

    const query = { roomId };

    if (!includeDeleted) {
        query.isDeleted = false;
    }

    if (before) {
        query.createdAt = { $lt: before };
    } else if (after) {
        query.createdAt = { $gt: after };
    }

    return this.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('senderId', 'username avatar')
        .lean();
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message; 