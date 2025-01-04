import React, { useState, useEffect, useRef } from 'react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import { Box, TextField, Button, Paper, Typography, Container } from '@mui/material';
import io from 'socket.io-client';
import MessageBubble from './MessageBubble';

const Chat = () => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [socket, setSocket] = useState(null);
    const messagesEndRef = useRef(null);
    const { user } = useAuth();

    useEffect(() => {
        const newSocket = io(API_URL);
        setSocket(newSocket);

        return () => newSocket.close();
    }, []);

    useEffect(() => {
        if (socket) {
            socket.on('message', (message) => {
                setMessages(prevMessages => [...prevMessages, message]);
            });
        }
    }, [socket]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (newMessage.trim() && socket) {
            const messageData = {
                text: newMessage,
                username: user.username,
                timestamp: new Date().toISOString()
            };
            socket.emit('message', messageData);
            setNewMessage('');
        }
    };

    return (
        <Container maxWidth="md">
            <Paper elevation={3} sx={{ height: '80vh', display: 'flex', flexDirection: 'column', p: 2 }}>
                <Box sx={{ flexGrow: 1, overflow: 'auto', mb: 2 }}>
                    {messages.map((message, index) => (
                        <MessageBubble
                            key={index}
                            message={message}
                            isOwnMessage={message.username === user?.username}
                        />
                    ))}
                    <div ref={messagesEndRef} />
                </Box>
                <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                        fullWidth
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        variant="outlined"
                        size="small"
                    />
                    <Button type="submit" variant="contained" disabled={!newMessage.trim()}>
                        Send
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default Chat; 