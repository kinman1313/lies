const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    topic: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isPrivate: {
        type: Boolean,
        default: false
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    customization: {
        backgroundColor: {
            type: String,
            default: '#132F4C'
        },
        textColor: {
            type: String,
            default: '#FFFFFF'
        },
        bubbleStyle: {
            type: String,
            enum: ['modern', 'classic', 'minimal'],
            default: 'modern'
        }
    }
}, {
    timestamps: true
});

// Index for searching rooms
roomSchema.index({ name: 'text', topic: 'text', description: 'text' });

const Room = mongoose.model('Room', roomSchema);
module.exports = Room; 