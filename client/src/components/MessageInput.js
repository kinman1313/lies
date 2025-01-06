import React, { useState, useRef } from 'react';
import {
    Box,
    TextField,
    IconButton,
    Tooltip,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography
} from '@mui/material';
import {
    Send as SendIcon,
    Mic as MicIcon,
    GifBox as GifIcon,
    AttachFile as AttachFileIcon,
    Stop as StopIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import GifPicker from './GifPicker';

const MessageInput = ({ onSendMessage, onTyping }) => {
    const { user } = useAuth();
    const [message, setMessage] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [gifDialogOpen, setGifDialogOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef();
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recordingTimerRef = useRef(null);

    const handleMessageChange = (e) => {
        setMessage(e.target.value);
        onTyping && onTyping(true);
    };

    const handleSendMessage = async () => {
        if (message.trim() || selectedFile) {
            try {
                if (selectedFile) {
                    setIsUploading(true);
                    const formData = new FormData();
                    formData.append('file', selectedFile);

                    const response = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData
                    });

                    if (!response.ok) throw new Error('Upload failed');

                    const { fileUrl, fileName, fileSize, fileType } = await response.json();

                    onSendMessage({
                        type: 'file',
                        content: fileUrl,
                        metadata: {
                            fileName,
                            fileSize,
                            fileType
                        }
                    });

                    setSelectedFile(null);
                } else {
                    console.log('Sending text message:', message.trim()); // Debug log
                    onSendMessage({
                        type: 'text',
                        content: message.trim()
                    });
                }

                setMessage('');
                onTyping && onTyping(false);
            } catch (error) {
                console.error('Error sending message:', error);
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            console.log('Enter key pressed, sending message'); // Debug log
            handleSendMessage();
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                alert('File size must be less than 10MB');
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleGifSelect = (gif) => {
        onSendMessage({
            type: 'gif',
            content: gif.url,
            metadata: {
                width: gif.width,
                height: gif.height,
                title: gif.title
            }
        });
        setGifDialogOpen(false);
    };

    const handleStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                audioChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                const formData = new FormData();
                formData.append('file', audioBlob, 'voice-message.wav');

                try {
                    setIsUploading(true);
                    const response = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData
                    });

                    if (!response.ok) throw new Error('Upload failed');

                    const { fileUrl } = await response.json();

                    onSendMessage({
                        type: 'voice',
                        content: fileUrl,
                        metadata: {
                            duration: recordingTime
                        }
                    });
                } catch (error) {
                    console.error('Error uploading voice message:', error);
                } finally {
                    setIsUploading(false);
                }

                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            recordingTimerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (error) {
            console.error('Error starting recording:', error);
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(recordingTimerRef.current);
            setRecordingTime(0);
        }
    };

    const formatRecordingTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Box sx={{
            position: 'sticky',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'background.paper',
            borderTop: 1,
            borderColor: 'divider',
            zIndex: 1000
        }}>
            {selectedFile && (
                <Box sx={{
                    p: 1,
                    backgroundColor: 'action.hover',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mx: 2,
                    mt: 1
                }}>
                    <Typography variant="body2" noWrap>
                        {selectedFile.name}
                    </Typography>
                    <IconButton size="small" onClick={() => setSelectedFile(null)}>
                        <StopIcon fontSize="small" />
                    </IconButton>
                </Box>
            )}

            <Box sx={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 1,
                p: 2,
                pt: selectedFile ? 1 : 2
            }}>
                <TextField
                    fullWidth
                    multiline
                    maxRows={4}
                    value={message}
                    onChange={handleMessageChange}
                    onKeyPress={handleKeyPress}
                    placeholder={isRecording ? 'Recording...' : 'Type a message...'}
                    disabled={isRecording}
                    InputProps={{
                        endAdornment: isRecording && (
                            <Typography variant="caption" color="primary" sx={{ mr: 1 }}>
                                {formatRecordingTime(recordingTime)}
                            </Typography>
                        ),
                        sx: {
                            alignItems: 'center',
                            p: 1
                        }
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 2
                        }
                    }}
                />

                <AnimatePresence>
                    {!isRecording && (
                        <>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    style={{ display: 'none' }}
                                    accept="image/*,video/*,audio/*,application/pdf"
                                />
                                <Tooltip title="Attach File">
                                    <IconButton
                                        onClick={() => fileInputRef.current.click()}
                                        disabled={isUploading}
                                        size="medium"
                                    >
                                        <AttachFileIcon />
                                    </IconButton>
                                </Tooltip>
                            </motion.div>

                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                            >
                                <Tooltip title="Send GIF">
                                    <IconButton
                                        onClick={() => setGifDialogOpen(true)}
                                        disabled={isUploading}
                                        size="medium"
                                    >
                                        <GifIcon />
                                    </IconButton>
                                </Tooltip>
                            </motion.div>
                        </>
                    )}

                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                    >
                        <Tooltip title={isRecording ? 'Stop Recording' : 'Record Voice Message'}>
                            <IconButton
                                onClick={isRecording ? handleStopRecording : handleStartRecording}
                                color={isRecording ? 'error' : 'default'}
                                disabled={isUploading}
                                size="medium"
                            >
                                {isRecording ? <StopIcon /> : <MicIcon />}
                            </IconButton>
                        </Tooltip>
                    </motion.div>

                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                    >
                        <Tooltip title="Send Message">
                            <IconButton
                                onClick={handleSendMessage}
                                color="primary"
                                disabled={isUploading || (!message.trim() && !selectedFile)}
                                size="medium"
                            >
                                {isUploading ? <CircularProgress size={24} /> : <SendIcon />}
                            </IconButton>
                        </Tooltip>
                    </motion.div>
                </AnimatePresence>
            </Box>

            <Dialog
                open={gifDialogOpen}
                onClose={() => setGifDialogOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        height: '80vh',
                        maxHeight: '600px'
                    }
                }}
            >
                <DialogTitle>Select a GIF</DialogTitle>
                <DialogContent dividers>
                    <GifPicker onSelect={handleGifSelect} onClose={() => setGifDialogOpen(false)} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setGifDialogOpen(false)}>Cancel</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default MessageInput;