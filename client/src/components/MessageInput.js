import React, { useState, useRef, useEffect } from 'react';
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
import { useSocket } from '../contexts/SocketContext';
import GifPicker from './GifPicker';
import { config } from '../config';
import { useTheme } from '@mui/material/styles';

const MessageInput = ({ onSendMessage, onTyping, typingUsers }) => {
    const { user } = useAuth();
    const { socket } = useSocket();
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
    const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
    const [scheduledTime, setScheduledTime] = useState(null);
    const theme = useTheme();

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

                    const response = await fetch(`${config.API_URL}/api/upload`, {
                        method: 'POST',
                        body: formData,
                        credentials: 'include'
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
                    onSendMessage(message.trim());
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

    const handleGifSelect = (gifData) => {
        console.log('Selected GIF data:', gifData); // Debug log
        onSendMessage(gifData);
        setGifDialogOpen(false);
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const formData = new FormData();
                formData.append('file', audioBlob, 'voice-message.webm');

                try {
                    setIsUploading(true);
                    const response = await fetch(`${config.API_URL}/api/upload`, {
                        method: 'POST',
                        body: formData,
                        credentials: 'include'
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
            recordingTimerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (error) {
            console.error('Error starting recording:', error);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            clearInterval(recordingTimerRef.current);
            setIsRecording(false);
            setRecordingTime(0);
        }
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                setIsUploading(true);
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch(`${config.API_URL}/api/upload`, {
                    method: 'POST',
                    body: formData,
                    credentials: 'include'
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
            } catch (error) {
                console.error('Error uploading file:', error);
            } finally {
                setIsUploading(false);
                e.target.value = ''; // Reset file input
            }
        }
    };

    const handleScheduleMessage = () => {
        if (scheduledTime && message.trim()) {
            const scheduledMessage = {
                type: 'text',
                content: message.trim(),
                metadata: {
                    scheduledFor: scheduledTime.toISOString()
                }
            };

            // Send to server for scheduling
            socket.emit('scheduleMessage', scheduledMessage);

            // Clear the form
            setMessage('');
            setScheduleDialogOpen(false);
            setScheduledTime(null);
        }
    };

    return (
        <Box sx={{
            position: 'sticky',
            bottom: 0,
            bgcolor: 'background.paper',
            background: 'rgba(19, 47, 76, 0.95)',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            p: 2
        }}>
            {/* Action Buttons Row */}
            <Box sx={{
                display: 'flex',
                gap: 1,
                mb: 2,
                pl: 1
            }}>
                <Tooltip title="Send GIF">
                    <IconButton
                        onClick={() => setGifDialogOpen(true)}
                        sx={{
                            color: theme.palette.primary.main,
                            '&:hover': {
                                background: 'rgba(124, 77, 255, 0.08)',
                                transform: 'translateY(-1px)'
                            }
                        }}
                    >
                        <GifIcon />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Voice Message">
                    <IconButton
                        onClick={isRecording ? stopRecording : startRecording}
                        sx={{
                            color: isRecording ? '#ef5350' : theme.palette.primary.main,
                            '&:hover': {
                                background: isRecording ? 'rgba(239, 83, 80, 0.08)' : 'rgba(124, 77, 255, 0.08)',
                                transform: 'translateY(-1px)'
                            }
                        }}
                    >
                        {isRecording ? <StopIcon /> : <MicIcon />}
                    </IconButton>
                </Tooltip>

                <Tooltip title="Schedule Message">
                    <IconButton
                        onClick={() => setScheduleDialogOpen(true)}
                        sx={{
                            color: theme.palette.primary.main,
                            '&:hover': {
                                background: 'rgba(124, 77, 255, 0.08)',
                                transform: 'translateY(-1px)'
                            }
                        }}
                    >
                        <AccessTimeIcon />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Attach File">
                    <IconButton
                        onClick={() => fileInputRef.current?.click()}
                        sx={{
                            color: theme.palette.primary.main,
                            '&:hover': {
                                background: 'rgba(124, 77, 255, 0.08)',
                                transform: 'translateY(-1px)'
                            }
                        }}
                    >
                        <AttachFileIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Message Input Row */}
            <Box sx={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 1,
                position: 'relative'
            }}>
                <TextField
                    fullWidth
                    multiline
                    maxRows={4}
                    value={message}
                    onChange={handleMessageChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: '12px',
                            transition: 'all 0.2s ease-in-out',
                            '& fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.1)',
                            },
                            '&:hover fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.2)'
                            },
                            '&.Mui-focused': {
                                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                '& fieldset': {
                                    borderColor: theme.palette.primary.main,
                                    borderWidth: '2px'
                                }
                            }
                        }
                    }}
                />

                <Tooltip title="Send">
                    <IconButton
                        onClick={handleSendMessage}
                        disabled={isUploading || (!message.trim() && !selectedFile)}
                        sx={{
                            color: theme.palette.primary.main,
                            backgroundColor: 'rgba(124, 77, 255, 0.1)',
                            borderRadius: '12px',
                            p: 1,
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                                backgroundColor: 'rgba(124, 77, 255, 0.2)',
                                transform: 'translateY(-1px)'
                            },
                            '&:disabled': {
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                color: 'rgba(255, 255, 255, 0.3)'
                            }
                        }}
                    >
                        {isUploading ? (
                            <CircularProgress size={24} color="inherit" />
                        ) : (
                            <SendIcon />
                        )}
                    </IconButton>
                </Tooltip>
            </Box>

            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileSelect}
            />

            {/* Recording Timer */}
            <AnimatePresence>
                {isRecording && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                    >
                        <Typography
                            variant="caption"
                            sx={{
                                color: '#ef5350',
                                mt: 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                pl: 1
                            }}
                        >
                            <Box
                                component="span"
                                sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    backgroundColor: '#ef5350',
                                    animation: 'pulse 1s infinite'
                                }}
                            />
                            Recording: {recordingTime}s
                        </Typography>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* GIF Dialog */}
            <Dialog
                open={gifDialogOpen}
                onClose={() => setGifDialogOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        background: 'rgba(19, 47, 76, 0.95)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '16px'
                    }
                }}
            >
                <DialogTitle>Select a GIF</DialogTitle>
                <DialogContent>
                    <GifPicker onSelect={handleGifSelect} />
                </DialogContent>
            </Dialog>

            {/* Schedule Dialog */}
            <Dialog
                open={scheduleDialogOpen}
                onClose={() => setScheduleDialogOpen(false)}
                PaperProps={{
                    sx: {
                        background: 'rgba(19, 47, 76, 0.95)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '16px'
                    }
                }}
            >
                <DialogTitle>Schedule Message</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Select when to send this message:
                    </Typography>
                    <TextField
                        type="datetime-local"
                        fullWidth
                        value={scheduledTime?.toISOString().slice(0, 16) || ''}
                        onChange={(e) => setScheduledTime(new Date(e.target.value))}
                        sx={{ mt: 1 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setScheduleDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleScheduleMessage}
                        variant="contained"
                        disabled={!scheduledTime || !message.trim()}
                    >
                        Schedule
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default MessageInput;