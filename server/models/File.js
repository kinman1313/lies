const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    mimetype: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    url: {
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
    messageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        required: true
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    },
    thumbnailUrl: {
        type: String
    },
    metadata: {
        width: Number,
        height: Number,
        duration: Number, // For audio/video
        pages: Number, // For PDFs
        preview: String // First few lines for text files
    },
    status: {
        type: String,
        enum: ['processing', 'ready', 'error'],
        default: 'ready'
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
});

// Indexes for better query performance
fileSchema.index({ userId: 1 });
fileSchema.index({ roomId: 1 });
fileSchema.index({ messageId: 1 });
fileSchema.index({ uploadedAt: -1 });
fileSchema.index({ mimetype: 1 });

// Virtual for file type category
fileSchema.virtual('category').get(function () {
    if (this.mimetype.startsWith('image/')) return 'image';
    if (this.mimetype.startsWith('video/')) return 'video';
    if (this.mimetype.startsWith('audio/')) return 'audio';
    if (this.mimetype === 'application/pdf') return 'pdf';
    if (this.mimetype.includes('word')) return 'document';
    if (this.mimetype === 'text/plain') return 'text';
    if (this.mimetype === 'application/zip') return 'archive';
    return 'other';
});

// Methods
fileSchema.methods.generateThumbnail = async function () {
    // TODO: Implement thumbnail generation based on file type
    // - Images: Resize to thumbnail
    // - Videos: Extract first frame
    // - PDFs: First page thumbnail
    // - Others: Generic icon
};

fileSchema.methods.softDelete = async function () {
    this.isDeleted = true;
    await this.save();
};

// Statics
fileSchema.statics.findByRoom = function (roomId) {
    return this.find({ roomId, isDeleted: false })
        .sort({ uploadedAt: -1 });
};

fileSchema.statics.findByUser = function (userId) {
    return this.find({ userId, isDeleted: false })
        .sort({ uploadedAt: -1 });
};

fileSchema.statics.findByType = function (type) {
    const mimetypePattern = new RegExp(`^${type}/`);
    return this.find({
        mimetype: mimetypePattern,
        isDeleted: false
    }).sort({ uploadedAt: -1 });
};

const File = mongoose.model('File', fileSchema);

module.exports = File; 