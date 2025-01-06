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

    const startRecording = () => {
        // Implementation for starting recording
    };

    const stopRecording = () => {
        // Implementation for stopping recording
    };

    const handleFileSelect = (e) => {
        // Implementation for handling file selection
    };

    const handleScheduleMessage = () => {
        // Implementation for handling schedule message
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
                    {/* Add date/time picker here */}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setScheduleDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleScheduleMessage} variant="contained">Schedule</Button>
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