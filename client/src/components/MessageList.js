import React from 'react';
import { Box } from '@mui/material';
import MessageBubble from './MessageBubble';
import { useAuth } from '../contexts/AuthContext';

const MessageList = ({ messages }) => {
    const { user } = useAuth();

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            p: 2
        }}>
            {messages.map((message) => (
                <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={message.sender === user?.id}
                />
            ))}
        </Box>
    );
};

export default MessageList;