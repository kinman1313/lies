import React, { useState, useRef } from 'react';
import {
    Box,
    TextField,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stack
} from '@mui/material';
import {
    Send as SendIcon,
    Gif as GifIcon,
    Mic as MicIcon,
    Schedule as ScheduleIcon,
    AttachFile as AttachFileIcon,
    Timer as TimerIcon,
    Stop as StopIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import GifPicker from './GifPicker';
import { useSocket } from '../contexts/SocketContext';

const MessageInput = ({ roomId }) => {
    const { socket } = useSocket();
    const [message, setMessage] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [showScheduler, setShowScheduler] = useState(false);
    const [scheduledTime, setScheduledTime] = useState(null);
    const [showExpirationDialog, setShowExpirationDialog] = useState(false);
    const [expirationMinutes, setExpirationMinutes] = useState(5);
    const mediaRecorder = useRef(null);
    const recordingInterval = useRef(null);
    const audioChunks = useRef([]);
    const fileInputRef = useRef(null);

    const handleSend = () => {
        if (message.trim() || audioChunks.current.length > 0) {
            const messageData = {
                content: message.trim(),
                type: 'text',
                roomId
            };

            socket.emit('message', messageData);
            setMessage('');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder.current = new MediaRecorder(stream);

            mediaRecorder.current.ondataavailable = (event) => {
                audioChunks.current.push(event.data);
            };

            mediaRecorder.current.onstop = async () => {
                const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
                const file = new File([audioBlob], 'voice-message.wav', { type: 'audio/wav' });

                const messageData = {
                    content: '[VOICE]',
                    type: 'voice',
                    roomId,
                    file
                };

                socket.emit('message', messageData);
                audioChunks.current = [];
            };

            mediaRecorder.current.start();
            setIsRecording(true);
            setRecordingTime(0);

            recordingInterval.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (error) {
            console.error('Error starting recording:', error);
        }
    };

    const stopRecording = () => {
        if (mediaRecorder.current && isRecording) {
            mediaRecorder.current.stop();
            mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
            clearInterval(recordingInterval.current);
            setIsRecording(false);
            setRecordingTime(0);
        }
    };

    const handleGifSelect = (gif) => {
        const messageData = {
            content: gif.url,
            type: 'gif',
            roomId,
            metadata: {
                gifId: gif.id,
                title: gif.title
            }
        };

        socket.emit('message', messageData);
        setShowGifPicker(false);
    };

    const handleFileSelect = async (event) => {
        const file = event.target.files[0];
        if (file) {
            const messageData = {
                content: file.name,
                type: 'file',
                roomId,
                file
            };

            socket.emit('message', messageData);
            fileInputRef.current.value = '';
        }
    };

    const handleSchedule = () => {
        if (scheduledTime && message.trim()) {
            const messageData = {
                content: message.trim(),
                type: 'text',
                roomId,
                scheduledFor: scheduledTime.toISOString()
            };

            socket.emit('message', messageData);
            setMessage('');
            setScheduledTime(null);
            setShowScheduler(false);
        }
    };

    const handleSetExpiration = () => {
        if (message.trim() && expirationMinutes > 0) {
            const messageData = {
                content: message.trim(),
                type: 'text',
                roomId,
                expirationMinutes
            };

            socket.emit('message', messageData);
            setMessage('');
            setShowExpirationDialog(false);
        }
    };

    return (
        <Box sx={{ p: 2, backgroundColor: 'background.paper' }}>
            <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                    fullWidth
                    multiline
                    maxRows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    disabled={isRecording}
                    sx={{ flexGrow: 1 }}
                />

                <Tooltip title="Send GIF">
                    <IconButton onClick={() => setShowGifPicker(true)}>
                        <GifIcon />
                    </IconButton>
                </Tooltip>

                <Tooltip title={isRecording ? 'Stop Recording' : 'Record Voice Message'}>
                    <IconButton onClick={isRecording ? stopRecording : startRecording} color={isRecording ? 'error' : 'default'}>
                        {isRecording ? <StopIcon /> : <MicIcon />}
                    </IconButton>
                </Tooltip>

                <Tooltip title="Schedule Message">
                    <IconButton onClick={() => setShowScheduler(true)}>
                        <ScheduleIcon />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Set Message Expiration">
                    <IconButton onClick={() => setShowExpirationDialog(true)}>
                        <TimerIcon />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Attach File">
                    <IconButton component="label">
                        <AttachFileIcon />
                        <input
                            type="file"
                            hidden
                            onChange={handleFileSelect}
                            ref={fileInputRef}
                        />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Send">
                    <IconButton onClick={handleSend} disabled={!message.trim() && !isRecording}>
                        <SendIcon />
                    </IconButton>
                </Tooltip>
            </Stack>

            {/* GIF Picker Dialog */}
            <Dialog open={showGifPicker} onClose={() => setShowGifPicker(false)} maxWidth="md" fullWidth>
                <DialogTitle>Select a GIF</DialogTitle>
                <DialogContent>
                    <GifPicker onSelect={handleGifSelect} />
                </DialogContent>
            </Dialog>

            {/* Message Scheduler Dialog */}
            <Dialog open={showScheduler} onClose={() => setShowScheduler(false)}>
                <DialogTitle>Schedule Message</DialogTitle>
                <DialogContent>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DateTimePicker
                            label="Schedule for"
                            value={scheduledTime}
                            onChange={setScheduledTime}
                            minDateTime={new Date()}
                            renderInput={(params) => <TextField {...params} sx={{ mt: 2 }} />}
                        />
                    </LocalizationProvider>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowScheduler(false)}>Cancel</Button>
                    <Button onClick={handleSchedule} variant="contained">Schedule</Button>
                </DialogActions>
            </Dialog>

            {/* Message Expiration Dialog */}
            <Dialog open={showExpirationDialog} onClose={() => setShowExpirationDialog(false)}>
                <DialogTitle>Set Message Expiration</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Expire After</InputLabel>
                        <Select
                            value={expirationMinutes}
                            onChange={(e) => setExpirationMinutes(e.target.value)}
                            label="Expire After"
                        >
                            <MenuItem value={1}>1 minute</MenuItem>
                            <MenuItem value={5}>5 minutes</MenuItem>
                            <MenuItem value={10}>10 minutes</MenuItem>
                            <MenuItem value={30}>30 minutes</MenuItem>
                            <MenuItem value={60}>1 hour</MenuItem>
                            <MenuItem value={1440}>24 hours</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowExpirationDialog(false)}>Cancel</Button>
                    <Button onClick={handleSetExpiration} variant="contained">Set Expiration</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default MessageInput;