import React, { useState } from 'react';
import {
    Box,
    TextField,
    Button,
    IconButton,
    Dialog,
    useTheme,
    useMediaQuery
} from '@mui/material';
import {
    Send as SendIcon,
    Gif as GifIcon
} from '@mui/icons-material';
import GifPicker from './GifPicker';
import { playSound } from '../utils/sounds';

const ChatInput = ({ onSendMessage }) => {
    const [messageInput, setMessageInput] = useState('');
    const [showGifPicker, setShowGifPicker] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const handleSubmit = (e) => {
        e.preventDefault();
        if (messageInput.trim()) {
            onSendMessage({ type: 'text', text: messageInput });
            setMessageInput('');
            playSound('message');
        }
    };

    const handleGifSelect = (gif) => {
        onSendMessage({ type: 'gif', gif });
        playSound('message');
    };

    return (
        <>
            <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
                    <IconButton
                        color="primary"
                        onClick={() => setShowGifPicker(true)}
                        sx={{
                            '&:hover': {
                                background: 'rgba(124, 77, 255, 0.1)'
                            }
                        }}
                    >
                        <GifIcon />
                    </IconButton>
                    <TextField
                        fullWidth
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Type a message..."
                        variant="outlined"
                        size="small"
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                        multiline
                        maxRows={4}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        endIcon={<SendIcon />}
                        disabled={!messageInput.trim()}
                    >
                        {!isMobile && 'Send'}
                    </Button>
                </form>
            </Box>

            <Dialog
                open={showGifPicker}
                onClose={() => setShowGifPicker(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        background: 'transparent',
                        boxShadow: 'none'
                    }
                }}
            >
                <GifPicker
                    onSelect={handleGifSelect}
                    onClose={() => setShowGifPicker(false)}
                />
            </Dialog>
        </>
    );
};

export default ChatInput; 