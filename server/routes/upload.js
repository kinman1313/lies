const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { verifyToken } = require('../utils/auth');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const userId = req.user.id;
        const uploadDir = path.join(__dirname, '../uploads', userId);

        // Create user-specific upload directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename with original extension
        const uniqueSuffix = crypto.randomBytes(16).toString('hex');
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter configuration
const fileFilter = (req, file, cb) => {
    // Allowed file types
    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/zip',
        'video/mp4',
        'audio/mpeg'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type'), false);
    }
};

// Configure multer with limits
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 5 // Maximum 5 files per upload
    }
});

// Authentication middleware
const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const user = await verifyToken(token);
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// File upload endpoint
router.post('/', authenticate, (req, res) => {
    upload.array('files', 5)(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    error: 'File size too large. Maximum size is 10MB'
                });
            }
            if (err.code === 'LIMIT_FILE_COUNT') {
                return res.status(400).json({
                    error: 'Too many files. Maximum is 5 files per upload'
                });
            }
            return res.status(400).json({ error: err.message });
        } else if (err) {
            return res.status(400).json({ error: err.message });
        }

        try {
            const files = req.files.map(file => ({
                filename: file.filename,
                originalName: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                url: `/uploads/${req.user.id}/${file.filename}`
            }));

            // Save file metadata to database if needed
            // await FileModel.insertMany(files);

            res.json({
                success: true,
                files: files
            });
        } catch (error) {
            console.error('Error processing upload:', error);
            res.status(500).json({ error: 'Failed to process upload' });
        }
    });
});

// File download/view endpoint
router.get('/:userId/:filename', authenticate, (req, res) => {
    const { userId, filename } = req.params;
    const filePath = path.join(__dirname, '../uploads', userId, filename);

    // Security check: Only allow users to access their own files
    if (req.user.id !== userId) {
        return res.status(403).json({ error: 'Access denied' });
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
    }

    res.sendFile(filePath);
});

// Delete file endpoint
router.delete('/:filename', authenticate, async (req, res) => {
    try {
        const filePath = path.join(__dirname, '../uploads', req.user.id, req.params.filename);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Delete file
        fs.unlinkSync(filePath);

        // Delete from database if needed
        // await FileModel.deleteOne({ filename: req.params.filename });

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

module.exports = router; 