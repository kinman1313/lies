import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import MessageBubble from './MessageBubble';

const MessageList = ({ messages, currentUser }) => {
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
                overflowY: 'auto',
                padding: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 2
            }}
        >
            {messages.map((message) => (
                <MessageBubble
                    key={message._id}
                    message={message}
                    isOwnMessage={message.senderId === currentUser._id}
                />
            ))}
            <div ref={messagesEndRef} />
        </Box>
    );
};

export default MessageList; 