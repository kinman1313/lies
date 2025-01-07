import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    Divider,
    CircularProgress,
    Alert
} from '@mui/material';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { useMessages } from '../contexts/MessageContext';

const ChatLobby = () => {
    const { socket, isConnected } = useSocket();
    const { user } = useAuth();
    const { messages, loading, error, sendMessage } = useMessages();
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (messageData) => {
        try {
            await sendMessage(messageData);
        } catch (err) {
            console.error('Failed to send message:', err);
        }
    };

    if (!isConnected) {
        return (
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                gap: 2
            }}>
                <CircularProgress />
                <Typography>Connecting to chat...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            bgcolor: 'background.default'
        }}>
            {/* Messages Area */}
            <Box sx={{
                flex: 1,
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                p: 3
            }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Alert severity="error" sx={{ mx: 2 }}>
                        {error}
                    </Alert>
                ) : messages.length === 0 ? (
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        gap: 2,
                        color: 'text.secondary'
                    }}>
                        <Typography variant="h6">Welcome to the Chat!</Typography>
                        <Typography>Start a conversation by sending a message.</Typography>
                    </Box>
                ) : (
                    <MessageList messages={messages} />
                )}
                <div ref={messagesEndRef} />
            </Box>

            <Divider />

            {/* Message Input */}
            <Box sx={{
                p: 2,
                bgcolor: 'background.paper',
                borderTop: 1,
                borderColor: 'divider'
            }}>
                <MessageInput onSendMessage={handleSendMessage} />
            </Box>
        </Box>
    );
};

export default ChatLobby; 