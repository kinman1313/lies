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
            desktop: {
                type: Boolean,
                default: true
            },
            email: {
                type: Boolean,
                default: true
            }
        },
        messagePreferences: {
            fontSize: {
                type: Number,
                default: 14
            },
            bubbleColor: {
                type: String,
                default: '#007AFF'
            },
            showTimestamps: {
                type: Boolean,
                default: true
            }
        }
    },
    lastSeen: {
        type: Date
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date
}, {
    timestamps: true
});

// Indexes
userSchema.index({ username: 'text', email: 'text' });
userSchema.index({ status: 1 });
userSchema.index({ isVerified: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Methods
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateAuthToken = function () {
    return jwt.sign(
        { _id: this._id, username: this.username },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};

userSchema.methods.generateVerificationToken = function () {
    this.verificationToken = jwt.sign(
        { _id: this._id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
    return this.save();
};

userSchema.methods.generatePasswordResetToken = function () {
    this.resetPasswordToken = jwt.sign(
        { _id: this._id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
    this.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    return this.save();
};

userSchema.methods.updateProfile = async function (profileData) {
    const allowedUpdates = ['username', 'bio', 'avatar'];
    Object.keys(profileData).forEach(update => {
        if (allowedUpdates.includes(update)) {
            this[update] = profileData[update];
        }
    });
    return this.save();
};

userSchema.methods.updatePreferences = async function (preferences) {
    this.preferences = { ...this.preferences, ...preferences };
    return this.save();
};

userSchema.methods.updateStatus = async function (status) {
    this.status = status;
    this.lastSeen = new Date();
    return this.save();
};

// Statics
userSchema.statics.findByCredentials = async function (email, password) {
    const user = await this.findOne({ email });
    if (!user) {
        throw new Error('Invalid login credentials');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw new Error('Invalid login credentials');
    }

    return user;
};

userSchema.statics.search = function (query) {
    return this.find(
        { $text: { $search: query } },
        { score: { $meta: 'textScore' } }
    )
        .select('-password')
        .sort({ score: { $meta: 'textScore' } });
};

userSchema.statics.findOnlineUsers = function () {
    return this.find({ status: 'online' })
        .select('-password')
        .sort({ username: 1 });
};

// Remove sensitive information when converting to JSON
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    delete user.verificationToken;
    delete user.resetPasswordToken;
    delete user.resetPasswordExpires;
    return user;
};

const User = mongoose.model('User', userSchema);
module.exports = User; 