import React, { useState } from 'react';
import {
    Box,
    TextField,
    IconButton,
    Tooltip,
    SpeedDial,
    SpeedDialIcon,
    SpeedDialAction
} from '@mui/material';
import {
    Send as SendIcon,
    Mic as MicIcon,
    GifBox as GifIcon,
    AttachFile as AttachFileIcon,
    EmojiEmotions as EmojiIcon,
    Schedule as ScheduleIcon
} from '@mui/icons-material';
import VoiceMessage from './VoiceMessage';
import GifPicker from './GifPicker';
import FileUpload from './FileUpload';
import MessageScheduler from './MessageScheduler';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

const MessageInput = ({ onSendMessage }) => {
    const [message, setMessage] = useState('');
    const [showVoiceMessage, setShowVoiceMessage] = useState(false);
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showFileUpload, setShowFileUpload] = useState(false);
    const [showScheduler, setShowScheduler] = useState(false);
    const [speedDialOpen, setSpeedDialOpen] = useState(false);

    const handleSend = (e) => {
        e?.preventDefault();
        if (message.trim()) {
            onSendMessage(message);
            setMessage('');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleEmojiSelect = (emoji) => {
        setMessage(prev => prev + emoji.native);
        setShowEmojiPicker(false);
    };

    const handleGifSelect = (gif) => {
        onSendMessage(`[GIF] ${gif.url}`);
        setShowGifPicker(false);
    };

    const handleVoiceMessageSend = (audioUrl) => {
        onSendMessage(`[VOICE] ${audioUrl}`);
        setShowVoiceMessage(false);
    };

    const handleFileUpload = (fileUrl) => {
        onSendMessage(`[FILE] ${fileUrl}`);
        setShowFileUpload(false);
    };

    const handleScheduleMessage = (scheduledMessage, scheduledTime) => {
        // Handle scheduled message
        setShowScheduler(false);
    };

    const actions = [
        { icon: <MicIcon />, name: 'Voice', onClick: () => setShowVoiceMessage(true) },
        { icon: <GifIcon />, name: 'GIF', onClick: () => setShowGifPicker(true) },
        { icon: <EmojiIcon />, name: 'Emoji', onClick: () => setShowEmojiPicker(true) },
        { icon: <AttachFileIcon />, name: 'File', onClick: () => setShowFileUpload(true) },
        { icon: <ScheduleIcon />, name: 'Schedule', onClick: () => setShowScheduler(true) }
    ];

    return (
        <Box sx={{ position: 'relative' }}>
            {showVoiceMessage && (
                <VoiceMessage
                    onSend={handleVoiceMessageSend}
                    onClose={() => setShowVoiceMessage(false)}
                />
            )}

            {showGifPicker && (
                <GifPicker
                    onSelect={handleGifSelect}
                    onClose={() => setShowGifPicker(false)}
                />
            )}

            {showFileUpload && (
                <FileUpload
                    onUpload={handleFileUpload}
                    onClose={() => setShowFileUpload(false)}
                />
            )}

            {showScheduler && (
                <MessageScheduler
                    message={message}
                    onSchedule={handleScheduleMessage}
                    onClose={() => setShowScheduler(false)}
                />
            )}

            {showEmojiPicker && (
                <Box sx={{
                    position: 'absolute',
                    bottom: '100%',
                    right: 0,
                    zIndex: 1
                }}>
                    <Picker
                        data={data}
                        onEmojiSelect={handleEmojiSelect}
                        theme="light"
                    />
                </Box>
            )}

            <Box
                component="form"
                onSubmit={handleSend}
                sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    borderTop: 1,
                    borderColor: 'divider'
                }}
            >
                <SpeedDial
                    ariaLabel="Message options"
                    sx={{
                        position: 'absolute',
                        bottom: 70,
                        right: 16
                    }}
                    icon={<SpeedDialIcon />}
                    onClose={() => setSpeedDialOpen(false)}
                    onOpen={() => setSpeedDialOpen(true)}
                    open={speedDialOpen}
                    direction="up"
                >
                    {actions.map((action) => (
                        <SpeedDialAction
                            key={action.name}
                            icon={action.icon}
                            tooltipTitle={action.name}
                            onClick={action.onClick}
                        />
                    ))}
                </SpeedDial>

                <TextField
                    fullWidth
                    multiline
                    maxRows={4}
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    sx={{ flex: 1 }}
                />

                <Tooltip title="Send">
                    <IconButton
                        color="primary"
                        onClick={handleSend}
                        disabled={!message.trim()}
                    >
                        <SendIcon />
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>
    );
};

export default MessageInput;