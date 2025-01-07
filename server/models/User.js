const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    avatar: {
        type: String,
        default: '/default-avatar.png'
    },
    status: {
        type: String,
        enum: ['online', 'offline', 'away', 'busy'],
        default: 'offline'
    },
    bio: {
        type: String,
        trim: true,
        maxlength: 200
    },
    preferences: {
        theme: {
            type: String,
            enum: ['light', 'dark'],
            default: 'light'
        },
        notifications: {
            sound: {
                type: Boolean,
                default: true
            },
            email: {
                type: Boolean,
                default: true
            }
        }
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    const user = this;
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 10);
    }
    next();
});

// Generate auth token
userSchema.methods.generateAuthToken = function () {
    const user = this;
    const token = jwt.sign(
        { _id: user._id.toString(), username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
    return token;
};

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function () {
    const user = this;
    const resetToken = jwt.sign(
        { _id: user._id.toString(), action: 'reset_password' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    return resetToken;
};

// Find user by credentials
userSchema.statics.findByCredentials = async function (email, password) {
    const User = this;
    const user = await User.findOne({ email });

    if (!user) {
        throw new Error('Invalid login credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error('Invalid login credentials');
    }

    return user;
};

// Remove sensitive info when converting to JSON
userSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();

    delete userObject.password;
    delete userObject.resetPasswordToken;
    delete userObject.resetPasswordExpires;

    return userObject;
};

const User = mongoose.model('User', userSchema);

module.exports = User; 