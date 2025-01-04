const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Invalid email');
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        trim: true
    },
    preferences: {
        theme: {
            type: String,
            enum: ['dark', 'light'],
            default: 'dark'
        },
        messageColor: {
            type: String,
            default: '#7C4DFF'
        },
        bubbleStyle: {
            type: String,
            enum: ['modern', 'classic', 'minimal'],
            default: 'modern'
        },
        soundEnabled: {
            type: Boolean,
            default: true
        },
        notificationSound: {
            type: String,
            enum: ['default', 'subtle', 'none'],
            default: 'default'
        },
        messageSound: {
            type: String,
            enum: ['default', 'subtle', 'none'],
            default: 'default'
        },
        animations: {
            type: Boolean,
            default: true
        }
    },
    lastActiveRoom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room'
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    const user = this;
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }
    next();
});

// Login method
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error('Unable to login');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error('Unable to login');
    }

    return user;
};

const User = mongoose.model('User', userSchema);
module.exports = User; 