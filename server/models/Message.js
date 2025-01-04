const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema({
    emoji: String,
    users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
});

const messageSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
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
        enum: ['text', 'gif'],
        default: 'text'
    },
    // New fields for enhanced features
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
    deletedAt: Date
}, {
    timestamps: true
});

// Add index for faster message searches
messageSchema.index({ room: 1, createdAt: -1 });
messageSchema.index({ mentions: 1 });

const Message = mongoose.model('Message', messageSchema);
module.exports = Message; 