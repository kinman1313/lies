const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema({
    emoji: String,
    users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
});

const fileAttachmentSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true
    },
    filename: {
        type: String,
        required: true
    },
    size: Number,
    type: String,
    metadata: {
        width: Number,
        height: Number,
        duration: Number,
        thumbnail: String
    }
});

const messageSchema = new mongoose.Schema({
    text: {
        type: String,
        required: function () {
            return !this.attachments || this.attachments.length === 0;
        },
        trim: true
    },
    username: {
        type: String,
        required: true
    },
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    },
    system: {
        type: Boolean,
        default: false
    },
    gif: {
        url: String,
        width: Number,
        height: Number
    },
    type: {
        type: String,
        enum: ['text', 'gif', 'file'],
        default: 'text'
    },
    attachments: [fileAttachmentSchema],
    reactions: [reactionSchema],
    editHistory: [{
        text: String,
        editedAt: Date
    }],
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    mentions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isEdited: {
        type: Boolean,
        default: false
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    pinnedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    pinnedAt: Date,
    deletedAt: Date,
    metadata: {
        clientId: String,
        readBy: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            readAt: {
                type: Date,
                default: Date.now
            }
        }]
    }
}, {
    timestamps: true
});

// Add indexes for faster message searches
messageSchema.index({ room: 1, createdAt: -1 });
messageSchema.index({ mentions: 1 });
messageSchema.index({ 'metadata.clientId': 1 });
messageSchema.index({ isPinned: 1 });
messageSchema.index({ text: 'text' });

const Message = mongoose.model('Message', messageSchema);
module.exports = Message; 