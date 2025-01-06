import React, { useState, useEffect } from 'react';
import {
    Box,
    Drawer,
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Avatar,
    Badge,
    Divider,
    useTheme,
    useMediaQuery,
    Snackbar,
    Alert
} from '@mui/material';
import {
    Menu as MenuIcon,
    ExitToApp as LogoutIcon,
    Settings as SettingsIcon,
    Chat as ChatIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import ChatRoom from './ChatRoom';
import ChatLobby from './ChatLobby';
import UserProfile from './UserProfile';

const DRAWER_WIDTH = 240;

const Chat = () => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [activeRoom, setActiveRoom] = useState(null);
    const [error, setError] = useState('');
    const [usersOnline, setUsersOnline] = useState([]);

    useEffect(() => {
        if (socket) {
            socket.on('usersOnline', (users) => {
                setUsersOnline(users);
            });

            return () => {
                socket.off('usersOnline');
            };
        }
    }, [socket]);

    return (
        <Box sx={{ height: '100vh', display: 'flex' }}>
            {/* Main chat area */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Header */}
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
                            {activeRoom ? 'Chat Room' : 'General Lobby'}
                        </Typography>
                        {!activeRoom && (
                            <Typography variant="caption" color="text.secondary">
                                {usersOnline.length} users online
                            </Typography>
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton onClick={() => {/* handle settings */ }}>
                            <SettingsIcon />
                        </IconButton>
                        <IconButton onClick={() => {/* handle logout */ }}>
                            <LogoutIcon />
                        </IconButton>
                    </Box>
                </Box>

                {activeRoom ? (
                    <ChatRoom
                        roomId={activeRoom}
                        onLeaveRoom={() => setActiveRoom(null)}
                        onClose={() => setActiveRoom(null)}
                    />
                ) : (
                    <ChatLobby
                        onCreateRoom={() => {/* handle room creation */ }}
                    />
                )}
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

export default Chat; 