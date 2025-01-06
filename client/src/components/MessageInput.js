import React, { useState } from 'react';
import { Box, TextField, IconButton } from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';

const MessageInput = ({ onSendMessage }) => {
    const [message, setMessage] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (message.trim()) {
            onSendMessage(message);
            setMessage('');
        }
    };

    return (
        <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
                display: 'flex',
                gap: 1,
                padding: 2,
                borderTop: '1px solid',
                borderColor: 'divider'
            }}
        >
            <TextField
                fullWidth
                variant="outlined"
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                size="small"
            />
            <IconButton type="submit" color="primary">
                <SendIcon />
            </IconButton>
        </Box>
    );
};

export default MessageInput; 