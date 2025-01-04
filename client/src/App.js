import React, { useState, useEffect, useRef } from 'react';
import { Container, Paper, TextField, Button, List, ListItem, ListItemText, Typography, Box } from '@mui/material';
import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = 'http://localhost:5000';

function App() {
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [username, setUsername] = useState('');
    const [isJoined, setIsJoined] = useState(false);
    const [users, setUsers] = useState([]);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const newSocket = io(SOCKET_SERVER_URL);
        setSocket(newSocket);

        return () => newSocket.close();
    }, []);

    useEffect(() => {
        if (!socket) return;

        socket.on('message', (message) => {
            setMessages((prev) => [...prev, message]);
        });

        socket.on('userJoined', ({ username, users }) => {
            setMessages((prev) => [...prev, {
                text: `${username} joined the chat`,
                system: true,
                timestamp: new Date().toISOString()
            }]);
            setUsers(users);
        });

        socket.on('userLeft', ({ username, users }) => {
            setMessages((prev) => [...prev, {
                text: `${username} left the chat`,
                system: true,
                timestamp: new Date().toISOString()
            }]);
            setUsers(users);
        });

        return () => {
            socket.off('message');
            socket.off('userJoined');
            socket.off('userLeft');
        };
    }, [socket]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleJoin = (e) => {
        e.preventDefault();
        if (username.trim()) {
            socket.emit('join', username);
            setIsJoined(true);
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (messageInput.trim() && socket) {
            socket.emit('message', messageInput);
            setMessageInput('');
        }
    };

    if (!isJoined) {
        return (
            <Container maxWidth="sm" sx={{ mt: 4 }}>
                <Paper elevation={3} sx={{ p: 3 }}>
                    <Typography variant="h5" gutterBottom>
                        Join Chat
                    </Typography>
                    <form onSubmit={handleJoin}>
                        <TextField
                            fullWidth
                            label="Enter your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            margin="normal"
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            fullWidth
                            sx={{ mt: 2 }}
                        >
                            Join
                        </Button>
                    </form>
                </Paper>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
            <Paper elevation={3} sx={{ p: 3, height: '80vh', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5">Chat Room</Typography>
                    <Typography variant="subtitle1">
                        Online Users: {users.join(', ')}
                    </Typography>
                </Box>

                <List sx={{ flexGrow: 1, overflow: 'auto', mb: 2 }}>
                    {messages.map((message, index) => (
                        <ListItem key={index}>
                            <ListItemText
                                primary={
                                    message.system ? (
                                        <Typography variant="body2" color="text.secondary">
                                            {message.text}
                                        </Typography>
                                    ) : (
                                        <>
                                            <Typography component="span" variant="subtitle2" color="primary">
                                                {message.username}:
                                            </Typography>
                                            {" " + message.text}
                                        </>
                                    )
                                }
                                secondary={new Date(message.timestamp).toLocaleTimeString()}
                            />
                        </ListItem>
                    ))}
                    <div ref={messagesEndRef} />
                </List>

                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
                    <TextField
                        fullWidth
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Type a message..."
                        variant="outlined"
                    />
                    <Button type="submit" variant="contained" color="primary">
                        Send
                    </Button>
                </form>
            </Paper>
        </Container>
    );
}

export default App; 