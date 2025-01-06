import React, { useState, useRef, useCallback } from 'react';
import {
    Box,
    IconButton,
    Typography,
    LinearProgress,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemSecondaryAction,
    Dialog,
    DialogTitle,
    DialogContent,
    Button,
    Tooltip,
    Alert
} from '@mui/material';
import {
    AttachFile as AttachFileIcon,
    Image as ImageIcon,
    Description as DocumentIcon,
    Movie as VideoIcon,
    AudioFile as AudioIcon,
    Close as CloseIcon,
    CloudUpload as CloudUploadIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = {
    'image/*': 'Images',
    'application/pdf': 'PDF Documents',
    'application/msword': 'Word Documents',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Documents',
    'text/plain': 'Text Files',
    'application/zip': 'ZIP Archives',
    'video/mp4': 'MP4 Videos',
    'audio/mpeg': 'MP3 Audio'
};

const getFileIcon = (type) => {
    if (type.startsWith('image/')) return <ImageIcon />;
    if (type.startsWith('video/')) return <VideoIcon />;
    if (type.startsWith('audio/')) return <AudioIcon />;
    return <DocumentIcon />;
};

const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const FileUpload = ({ onUpload, roomId }) => {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState({});
    const [error, setError] = useState(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewFile, setPreviewFile] = useState(null);
    const fileInputRef = useRef();

    const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
        // Handle rejected files
        if (rejectedFiles.length > 0) {
            const errors = rejectedFiles.map(file => {
                if (file.size > MAX_FILE_SIZE) {
                    return `${file.name} is too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}`;
                }
                return `${file.name} is not an allowed file type`;
            });
            setError(errors.join('\n'));
            return;
        }

        setFiles(prevFiles => [...prevFiles, ...acceptedFiles]);
        setError(null);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: ALLOWED_TYPES,
        maxSize: MAX_FILE_SIZE,
        multiple: true
    });

    const handleRemoveFile = (index) => {
        setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    };

    const handlePreview = (file) => {
        if (file.type.startsWith('image/')) {
            setPreviewFile(file);
            setPreviewOpen(true);
        }
    };

    const handleUpload = async () => {
        if (files.length === 0) return;

        setUploading(true);
        setProgress({});

        try {
            const uploadPromises = files.map(async (file, index) => {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('roomId', roomId);

                const xhr = new XMLHttpRequest();

                // Track progress for individual files
                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        setProgress(prev => ({
                            ...prev,
                            [index]: Math.round((event.loaded * 100) / event.total)
                        }));
                    }
                };

                return new Promise((resolve, reject) => {
                    xhr.open('POST', '/api/upload');
                    xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('token')}`);

                    xhr.onload = () => {
                        if (xhr.status === 200) {
                            resolve(JSON.parse(xhr.response));
                        } else {
                            reject(new Error(xhr.statusText));
                        }
                    };

                    xhr.onerror = () => reject(new Error('Network Error'));
                    xhr.send(formData);
                });
            });

            const results = await Promise.all(uploadPromises);
            onUpload(results);
            setFiles([]);
            setProgress({});
        } catch (err) {
            setError('Failed to upload files. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <>
            <Box>
                {/* Drag & Drop Zone */}
                <Paper
                    {...getRootProps()}
                    variant="outlined"
                    sx={{
                        p: 2,
                        textAlign: 'center',
                        backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
                        border: '2px dashed',
                        borderColor: isDragActive ? 'primary.main' : 'divider',
                        cursor: 'pointer'
                    }}
                >
                    <input {...getInputProps()} />
                    <CloudUploadIcon sx={{ fontSize: 48, color: 'action.active', mb: 1 }} />
                    <Typography>
                        {isDragActive
                            ? 'Drop files here...'
                            : 'Drag & drop files here, or click to select files'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                        Maximum file size: {formatFileSize(MAX_FILE_SIZE)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                        Allowed types: {Object.values(ALLOWED_TYPES).join(', ')}
                    </Typography>
                </Paper>

                {error && (
                    <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {/* File List */}
                <AnimatePresence>
                    {files.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                        >
                            <Paper variant="outlined" sx={{ mt: 2 }}>
                                <List>
                                    {files.map((file, index) => (
                                        <ListItem
                                            key={index}
                                            button={file.type.startsWith('image/')}
                                            onClick={() => file.type.startsWith('image/') && handlePreview(file)}
                                        >
                                            <ListItemIcon>
                                                {getFileIcon(file.type)}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={file.name}
                                                secondary={formatFileSize(file.size)}
                                            />
                                            {progress[index] !== undefined && (
                                                <Box sx={{ width: '100px', mr: 2 }}>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={progress[index]}
                                                    />
                                                </Box>
                                            )}
                                            <ListItemSecondaryAction>
                                                <IconButton
                                                    edge="end"
                                                    onClick={() => handleRemoveFile(index)}
                                                    disabled={uploading}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                    ))}
                                </List>

                                <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button
                                        variant="contained"
                                        startIcon={<CloudUploadIcon />}
                                        onClick={handleUpload}
                                        disabled={uploading}
                                    >
                                        Upload {files.length} file{files.length !== 1 ? 's' : ''}
                                    </Button>
                                </Box>
                            </Paper>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Box>

            {/* Preview Dialog */}
            <Dialog
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Preview: {previewFile?.name}
                    <IconButton
                        onClick={() => setPreviewOpen(false)}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    {previewFile && (
                        <Box
                            component="img"
                            src={URL.createObjectURL(previewFile)}
                            alt="Preview"
                            sx={{
                                width: '100%',
                                height: 'auto',
                                maxHeight: '70vh',
                                objectFit: 'contain'
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};

export default FileUpload; 