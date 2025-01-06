import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    ListItemIcon,
    Avatar,
    IconButton,
    Button,
    Menu,
    MenuItem,
    Divider,
    Badge,
    Tooltip,
    SpeedDial,
    SpeedDialIcon,
    SpeedDialAction,
    Snackbar,
    Alert
} from '@mui/material';
import {
    Add as AddIcon,
    Group as GroupIcon,
    PersonAdd as InviteIcon,
    Settings as SettingsIcon,
    Chat as ChatIcon,
    MoreVert as MoreIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { motion } from 'framer-motion';
import MessageInput from './MessageInput';
import MessageList from './MessageList';

const ChatLobby = ({ onCreateRoom }) => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [messages, setMessages] = useState([]);
    const [error, setError] = useState('');
    const [usersOnline, setUsersOnline] = useState([]);

    useEffect(() => {
        if (socket) {
            socket.emit('joinLobby');

            socket.on('lobbyMessage', (message) => {
                setMessages(prev => [...prev, message]);
            });

            socket.on('usersOnline', (users) => {
                setUsersOnline(users);
            });

            return () => {
                socket.emit('leaveLobby');
                socket.off('lobbyMessage');
                socket.off('usersOnline');
            };
        }
    }, [socket]);

    const handleSendMessage = (messageData) => {
        if (socket) {
            socket.emit('lobbyMessage', messageData);
        }
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Lobby Header */}
            <Box sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: 1,
                borderColor: 'divider',
                backgroundColor: 'background.paper',
                zIndex: 2
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6">
                        General Lobby
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {usersOnline.length} users online
                    </Typography>
                </Box>
            </Box>

            {/* Messages Area */}
            <Box sx={{ flex: 1, overflow: 'auto', px: 2, py: 1 }}>
                <MessageList messages={messages} />
            </Box>

            {/* Message Input */}
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                <MessageInput onSendMessage={handleSendMessage} />
            </Box>

            {/* Error Snackbar */}
            <Snackbar
                open={Boolean(error)}
                autoHideDuration={6000}
                onClose={() => setError('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
                <Alert onClose={() => setError('')} severity="error">
                    {error}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ChatLobby; 