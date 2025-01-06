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

    const handleGifSelect = (gifData) => {
        console.log('Selected GIF data:', gifData); // Debug log
        onSendMessage(gifData);
        setGifDialogOpen(false);
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

                {/* Message input */}
                <TextField
                    fullWidth
                    multiline
                    maxRows={4}
                    value={message}
                    onChange={handleMessageChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    variant="standard"
                    InputProps={{
                        disableUnderline: true,
                    }}
                    sx={{ mx: 1 }}
                />

                {/* Send button */}
                <IconButton
                    onClick={handleSendMessage}
                    disabled={!message.trim() && !selectedFile}
                    color="primary"
                >
                    <SendIcon />
                </IconButton>
            </Box>

            {/* GIF Dialog */}
            <Dialog
                open={gifDialogOpen}
                onClose={() => setGifDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <GifPicker
                    onSelect={handleGifSelect}
                    onClose={() => setGifDialogOpen(false)}
                />
            </Dialog>
        </Box>
    );
};

export default MessageInput;