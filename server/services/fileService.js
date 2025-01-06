const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const { promisify } = require('util');
const mkdir = promisify(fs.mkdir);

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads');
        try {
            await mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: function (req, file, cb) {
        const uniqueFilename = `${uuidv4()}-${file.originalname}`;
        cb(null, uniqueFilename);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: function (req, file, cb) {
        // Add file type validation here
        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'audio/mpeg',
            'audio/wav',
            'audio/ogg',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

async function uploadFile(file) {
    return new Promise((resolve, reject) => {
        const uploadSingle = upload.single('file');

        uploadSingle({ file }, {}, function (err) {
            if (err) {
                return reject(err);
            }

            const fileUrl = `/uploads/${file.filename}`;
            resolve({
                url: fileUrl,
                filename: file.filename
            });
        });
    });
}

async function deleteFile(filename) {
    const filePath = path.join(__dirname, '../uploads', filename);
    try {
        await fs.promises.unlink(filePath);
        return true;
    } catch (error) {
        console.error('Error deleting file:', error);
        return false;
    }
}

module.exports = {
    upload,
    uploadFile,
    deleteFile
}; 