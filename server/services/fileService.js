const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const logger = require('../utils/logger');

// Configure upload directories
const UPLOAD_DIR = path.join(__dirname, '../uploads');
const VOICE_DIR = path.join(UPLOAD_DIR, 'voice');
const FILE_DIR = path.join(UPLOAD_DIR, 'files');
const AVATAR_DIR = path.join(UPLOAD_DIR, 'avatars');

// Ensure upload directories exist
fs.ensureDirSync(VOICE_DIR);
fs.ensureDirSync(FILE_DIR);
fs.ensureDirSync(AVATAR_DIR);

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadPath = FILE_DIR;
        if (file.fieldname === 'voice') {
            uploadPath = VOICE_DIR;
        } else if (file.fieldname === 'avatar') {
            uploadPath = AVATAR_DIR;
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueId = uuidv4();
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueId}${ext}`);
    }
});

// Configure file filter
const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'voice') {
        // Accept only audio files for voice messages
        if (file.mimetype.startsWith('audio/')) {
            cb(null, true);
        } else {
            cb(new Error('Only audio files are allowed for voice messages'));
        }
    } else if (file.fieldname === 'avatar') {
        // Accept only image files for avatars
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed for avatars'));
        }
    } else {
        // For general files, accept common file types
        const allowedTypes = [
            'image/',
            'audio/',
            'video/',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain'
        ];

        if (allowedTypes.some(type => file.mimetype.startsWith(type))) {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed'));
        }
    }
};

// Configure multer upload
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

// File service methods
const fileService = {
    // Upload middleware configurations
    uploadMiddleware: {
        single: (fieldName) => upload.single(fieldName),
        array: (fieldName, maxCount) => upload.array(fieldName, maxCount),
        fields: (fields) => upload.fields(fields)
    },

    // Save file and return file info
    async saveFile(file) {
        try {
            const fileInfo = {
                fileName: file.originalname,
                fileUrl: `/uploads/${path.basename(file.path)}`,
                fileSize: file.size,
                fileType: file.mimetype
            };

            logger.info(`File saved successfully: ${fileInfo.fileName}`);
            return fileInfo;
        } catch (error) {
            logger.error('Error saving file:', error);
            throw error;
        }
    },

    // Delete file
    async deleteFile(filePath) {
        try {
            const fullPath = path.join(__dirname, '../', filePath);
            await fs.remove(fullPath);
            logger.info(`File deleted successfully: ${filePath}`);
        } catch (error) {
            logger.error('Error deleting file:', error);
            throw error;
        }
    },

    // Get file info
    async getFileInfo(filePath) {
        try {
            const fullPath = path.join(__dirname, '../', filePath);
            const stats = await fs.stat(fullPath);
            return {
                size: stats.size,
                createdAt: stats.birthtime,
                modifiedAt: stats.mtime
            };
        } catch (error) {
            logger.error('Error getting file info:', error);
            throw error;
        }
    },

    // Clean up expired files
    async cleanupExpiredFiles() {
        try {
            const now = Date.now();
            const directories = [VOICE_DIR, FILE_DIR];

            for (const dir of directories) {
                const files = await fs.readdir(dir);
                for (const file of files) {
                    const filePath = path.join(dir, file);
                    const stats = await fs.stat(filePath);
                    const fileAge = now - stats.birthtimeMs;

                    // Delete files older than 30 days
                    if (fileAge > 30 * 24 * 60 * 60 * 1000) {
                        await fs.remove(filePath);
                        logger.info(`Deleted expired file: ${file}`);
                    }
                }
            }
        } catch (error) {
            logger.error('Error cleaning up expired files:', error);
            throw error;
        }
    },

    // Get file stream
    getFileStream(filePath) {
        try {
            const fullPath = path.join(__dirname, '../', filePath);
            return fs.createReadStream(fullPath);
        } catch (error) {
            logger.error('Error creating file stream:', error);
            throw error;
        }
    }
};

module.exports = fileService; 