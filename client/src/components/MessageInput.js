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
    const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
    const [scheduledTime, setScheduledTime] = useState(null);

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
            onSendMessage({
                type: 'text',
                content: message.trim(),
                metadata: {
                    scheduledFor: scheduledTime.toISOString()
                }
            });
            setMessage('');
            setScheduleDialogOpen(false);
            setScheduledTime(null);
        }
    };

    return (
        <Box sx={{ position: 'sticky', bottom: 0, bgcolor: 'background.paper', p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                            borderRadius: 3,
                            backgroundColor: 'action.hover'
                        }
                    }}
                />

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Send GIF">
                        <IconButton onClick={() => setGifDialogOpen(true)} color="primary">
                            <GifIcon />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Voice Message">
                        <IconButton
                            onClick={isRecording ? stopRecording : startRecording}
                            color={isRecording ? "error" : "primary"}
                        >
                            {isRecording ? <StopIcon /> : <MicIcon />}
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Schedule Message">
                        <IconButton onClick={() => setScheduleDialogOpen(true)} color="primary">
                            <AccessTimeIcon />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Attach File">
                        <IconButton onClick={() => fileInputRef.current?.click()} color="primary">
                            <AttachFileIcon />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Send">
                        <IconButton
                            onClick={handleSendMessage}
                            color="primary"
                            disabled={isUploading || (!message.trim() && !selectedFile)}
                        >
                            {isUploading ? <CircularProgress size={24} /> : <SendIcon />}
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileSelect}
            />

            {/* GIF Dialog */}
            <Dialog
                open={gifDialogOpen}
                onClose={() => setGifDialogOpen(false)}
                maxWidth="md"
                fullWidth
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

            {/* Recording Timer */}
            <AnimatePresence>
                {isRecording && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                    >
                        <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                            Recording: {recordingTime}s
                        </Typography>
                    </motion.div>
                )}
            </AnimatePresence>
        </Box>
    );
};

export default MessageInput;