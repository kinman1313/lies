import React, { useRef, useEffect } from 'react';
import { Box } from '@mui/material';
import MessageBubble from './MessageBubble';
import { useAuth } from '../contexts/AuthContext';

const MessageList = ({ messages }) => {
    const { user } = useAuth();
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <Box
            sx={{
                flex: 1,
                overflow: 'auto',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 1
            }}
        >
            {messages.map((message, index) => (
                <MessageBubble
                    key={message._id || index}
                    message={message}
                    isOwn={message.sender?._id === user?.id}
                />
            ))}
            <div ref={messagesEndRef} />
        </Box>
    );
};

export default MessageList;