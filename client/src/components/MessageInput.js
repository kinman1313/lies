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
    Button
} from '@mui/material';
import {
    Send as SendIcon,
    Gif as GifIcon,
    Mic as MicIcon,
    AttachFile as AttachFileIcon,
    Schedule as ScheduleIcon,
    Stop as StopIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import GifPicker from './GifPicker';

const MessageInput = ({ onSendMessage, isLoading }) => {
    const [message, setMessage] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [showScheduler, setShowScheduler] = useState(false);
    const [scheduledTime, setScheduledTime] = useState(null);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const fileInputRef = useRef(null);
    const chunks = useRef([]);

    const handleSendMessage = (type = 'text', content = message, file = null) => {
        if (!content.trim() && !file) return;

        onSendMessage({
            type,
            content: content.trim(),
            file,
            scheduledFor: scheduledTime
        });

        setMessage('');
        setShowGifPicker(false);
        setShowScheduler(false);
        setScheduledTime(null);
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage();
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.current.push(e.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(chunks.current, { type: 'audio/webm' });
                chunks.current = [];
                
                const file = new File([blob], 'voice-message.webm', { type: 'audio/webm' });
                handleSendMessage('voice', 'Voice message', file);
            };

            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Could not access microphone');
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
        }
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            handleSendMessage('file', file.name, file);
        }
        event.target.value = null; // Reset file input
    };

    const handleGifSelect = (gifUrl) => {
        handleSendMessage('gif', gifUrl);
    };

    return (
        <Box sx={{ p: 2, backgroundColor: 'background.paper' }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                    fullWidth
                    multiline
                    maxRows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    disabled={isLoading || isRecording}
                    sx={{ backgroundColor: 'white' }}
                />
                
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
                />

                <Tooltip title="Attach file">
                    <IconButton
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading || isRecording}
                    >
                        <AttachFileIcon />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Send GIF">
                    <IconButton
                        onClick={() => setShowGifPicker(true)}
                        disabled={isLoading || isRecording}
                    >
                        <GifIcon />
                    </IconButton>
                </Tooltip>

                <Tooltip title={isRecording ? "Stop recording" : "Record voice message"}>
                    <IconButton
                        onClick={isRecording ? stopRecording : startRecording}
                        color={isRecording ? "error" : "default"}
                        disabled={isLoading}
                    >
                        {isRecording ? <StopIcon /> : <MicIcon />}
                    </IconButton>
                </Tooltip>

                <Tooltip title="Schedule message">
                    <IconButton
                        onClick={() => setShowScheduler(true)}
                        disabled={isLoading || isRecording}
                    >
                        <ScheduleIcon />
                    </IconButton>
                </Tooltip>

                <IconButton
                    color="primary"
                    onClick={() => handleSendMessage()}
                    disabled={isLoading || isRecording || (!message.trim() && !scheduledTime)}
                >
                    {isLoading ? <CircularProgress size={24} /> : <SendIcon />}
                </IconButton>
            </Box>

            {/* GIF Picker Dialog */}
            <Dialog
                open={showGifPicker}
                onClose={() => setShowGifPicker(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Select a GIF</DialogTitle>
                <DialogContent>
                    <GifPicker onSelect={handleGifSelect} />
                </DialogContent>
            </Dialog>

            {/* Message Scheduler Dialog */}
            <Dialog
                open={showScheduler}
                onClose={() => setShowScheduler(false)}
            >
                <DialogTitle>Schedule Message</DialogTitle>
                <DialogContent>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DateTimePicker
                            label="Schedule for"
                            value={scheduledTime}
                            onChange={setScheduledTime}
                            minDateTime={new Date()}
                            renderInput={(params) => <TextField {...params} fullWidth sx={{ mt: 2 }} />}
                        />
                    </LocalizationProvider>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowScheduler(false)}>Cancel</Button>
                    <Button
                        onClick={() => handleSendMessage()}
                        disabled={!message.trim() || !scheduledTime}
                        variant="contained"
                    >
                        Schedule
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default MessageInput;