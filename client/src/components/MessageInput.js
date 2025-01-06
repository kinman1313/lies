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
    Stop as StopIcon,
    AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import GifPicker from './GifPicker';

const MessageInput = ({ onSendMessage, onTyping, typingUsers }) => {
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
        console.log('Selected GIF:', gif); // Debug log
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
            backgroundColor: 'background.default',
            borderTop: 1,
            borderColor: 'divider',
            p: 2
        }}>
            {/* Typing indicator */}
            {typingUsers?.length > 0 && (
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ pl: 2, pb: 1, display: 'block' }}
                >
                    {`[object Object] and ${typingUsers.length - 1} others are typing...`}
                </Typography>
            )}

            {/* Message input area */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                backgroundColor: 'background.paper',
                borderRadius: 2,
                p: 1
            }}>
                {/* GIF button */}
                <IconButton
                    onClick={() => setGifDialogOpen(true)}
                    size="medium"
                    sx={{ color: 'text.secondary' }}
                >
                    <GifIcon />
                </IconButton>

                {/* Voice message button */}
                <IconButton
                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                    color={isRecording ? 'error' : 'default'}
                    size="medium"
                    sx={{ color: 'text.secondary' }}
                >
                    <MicIcon />
                </IconButton>

                {/* Timer button */}
                <IconButton
                    size="medium"
                    sx={{ color: 'text.secondary' }}
                >
                    <AccessTimeIcon />
                </IconButton>

                {/* Message input */}
                <TextField
                    fullWidth
                    multiline
                    maxRows={4}
                    value={message}
                    onChange={handleMessageChange}
                    onKeyPress={handleKeyPress}
                    placeholder={isRecording ? 'Recording...' : 'Type a message...'}
                    disabled={isRecording}
                    variant="standard"
                    InputProps={{
                        disableUnderline: true,
                        sx: {
                            p: 1,
                            '&.Mui-focused': {
                                backgroundColor: 'transparent'
                            }
                        }
                    }}
                />

                {/* Send button */}
                <IconButton
                    onClick={handleSendMessage}
                    color="primary"
                    disabled={isUploading || (!message.trim() && !selectedFile)}
                    size="medium"
                >
                    {isUploading ? <CircularProgress size={24} /> : <SendIcon />}
                </IconButton>
            </Box>

            {/* GIF Dialog */}
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