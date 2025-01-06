import React, { useRef, useEffect } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { PlayArrow } from '@mui/icons-material';

const MessageList = ({ messages }) => {
    const messagesEndRef = useRef(null);
    const { user } = useAuth();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    console.log('Rendering messages:', messages); // Debug log

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
            {messages.map((message) => (
                <Box
                    key={message._id}
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: message.userId === user._id ? 'flex-end' : 'flex-start',
                        maxWidth: '70%',
                        alignSelf: message.userId === user._id ? 'flex-end' : 'flex-start'
                    }}
                >
                    {/* Message bubble */}
                    <Box
                        sx={{
                            backgroundColor: message.userId === user._id ? 'primary.main' : 'background.paper',
                            color: message.userId === user._id ? 'primary.contrastText' : 'text.primary',
                            borderRadius: 2,
                            p: 2,
                            position: 'relative',
                            ...(message.pending && {
                                opacity: 0.7
                            })
                        }}
                    >
                        {/* Username */}
                        {message.userId !== user._id && (
                            <Typography variant="caption" sx={{ opacity: 0.7, mb: 0.5, display: 'block' }}>
                                {message.username}
                            </Typography>
                        )}

                        {/* Message content */}
                        {message.type === 'text' && (
                            <Typography variant="body1">
                                {message.content}
                            </Typography>
                        )}

                        {message.type === 'gif' && (
                            <Box
                                component="img"
                                src={message.content}
                                alt={message.metadata?.title || 'GIF'}
                                sx={{
                                    maxWidth: '100%',
                                    height: 'auto',
                                    borderRadius: 1
                                }}
                            />
                        )}

                        {message.type === 'voice' && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <IconButton size="small">
                                    <PlayArrow />
                                </IconButton>
                                <Typography variant="caption">
                                    Voice message ({message.metadata?.duration || 0}s)
                                </Typography>
                            </Box>
                        )}

                        {/* Timestamp */}
                        <Typography
                            variant="caption"
                            sx={{
                                opacity: 0.7,
                                mt: 0.5,
                                display: 'block',
                                textAlign: message.userId === user._id ? 'right' : 'left'
                            }}
                        >
                            {new Date(message.createdAt).toLocaleTimeString()}
                        </Typography>
                    </Box>
                </Box>
            ))}
            <div ref={messagesEndRef} />
        </Box>
    );
};

export default MessageList;