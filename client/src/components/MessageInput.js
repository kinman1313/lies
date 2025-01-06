import React, { useState, useRef } from 'react';
import {
    Box,
    TextField,
    IconButton,
    Tooltip,
    SpeedDial,
    SpeedDialIcon,
    SpeedDialAction,
    Popover
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
    const [gifAnchorEl, setGifAnchorEl] = useState(null);
    const inputRef = useRef(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (message.trim()) {
            onSendMessage({
                type: 'text',
                content: message.trim()
            });
            setMessage('');
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
        setGifAnchorEl(null);
    };

    const handleVoiceMessageSend = (audioUrl, duration) => {
        onSendMessage({
            type: 'voice',
            content: audioUrl,
            metadata: {
                duration: duration || 0
            }
        });
        setShowVoiceMessage(false);
    };

    return (
        <Box sx={{ p: 2, backgroundColor: 'background.paper' }}>
            {showVoiceMessage && (
                <Box sx={{ position: 'absolute', bottom: '100%', left: 0, right: 0, p: 2 }}>
                    <VoiceMessage
                        onSend={handleVoiceMessageSend}
                        onClose={() => setShowVoiceMessage(false)}
                    />
                </Box>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
                <TextField
                    fullWidth
                    multiline
                    maxRows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    ref={inputRef}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 2
                        }
                    }}
                />
                <IconButton
                    color="primary"
                    onClick={() => setShowVoiceMessage(true)}
                >
                    <MicIcon />
                </IconButton>
                <IconButton
                    color="primary"
                    onClick={(e) => setGifAnchorEl(e.currentTarget)}
                >
                    <GifIcon />
                </IconButton>
                <IconButton type="submit" color="primary" disabled={!message.trim()}>
                    <SendIcon />
                </IconButton>
            </form>

            <Popover
                open={Boolean(gifAnchorEl)}
                anchorEl={gifAnchorEl}
                onClose={() => setGifAnchorEl(null)}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                sx={{
                    mt: -2
                }}
            >
                <GifPicker
                    onSelect={handleGifSelect}
                    onClose={() => setGifAnchorEl(null)}
                />
            </Popover>
        </Box>
    );
};

export default MessageInput;