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
    const { user, logout } = useAuth();
    const { socket } = useSocket();
    const [activeRoom, setActiveRoom] = useState(null);
    const [error, setError] = useState('');
    const [usersOnline, setUsersOnline] = useState([]);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            setError('Failed to log out');
        }
    };

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
            {/* Sidebar Drawer */}
            <Drawer
                variant={isMobile ? 'temporary' : 'permanent'}
                open={isMobile ? drawerOpen : true}
                onClose={() => setDrawerOpen(false)}
                sx={{
                    width: DRAWER_WIDTH,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: DRAWER_WIDTH,
                        boxSizing: 'border-box',
                    },
                }}
            >
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                        src={user?.avatar}
                        alt={user?.username}
                        onClick={() => setProfileOpen(true)}
                        sx={{ cursor: 'pointer' }}
                    />
                    <Box>
                        <Typography variant="subtitle1">{user?.username}</Typography>
                        <Typography variant="caption" color="text.secondary">Online</Typography>
                    </Box>
                </Box>
                <Divider />
                <List>
                    <ListItem button onClick={() => setActiveRoom(null)}>
                        <ListItemIcon>
                            <ChatIcon />
                        </ListItemIcon>
                        <ListItemText primary="General Lobby" />
                    </ListItem>
                </List>
            </Drawer>

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
                        {isMobile && (
                            <IconButton edge="start" onClick={() => setDrawerOpen(true)}>
                                <MenuIcon />
                            </IconButton>
                        )}
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
                        <IconButton onClick={() => setProfileOpen(true)}>
                            <SettingsIcon />
                        </IconButton>
                        <IconButton onClick={handleLogout}>
                            <LogoutIcon />
                        </IconButton>
                    </Box>
                </Box>

                {/* Chat content */}
                {activeRoom ? (
                    <ChatRoom
                        roomId={activeRoom}
                        onLeaveRoom={() => setActiveRoom(null)}
                        onClose={() => setActiveRoom(null)}
                    />
                ) : (
                    <ChatLobby
                        onCreateRoom={(roomId) => setActiveRoom(roomId)}
                    />
                )}
            </Box>

            {/* Profile Dialog */}
            <UserProfile
                open={profileOpen}
                onClose={() => setProfileOpen(false)}
            />

            {/* Error Snackbar */}
            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError('')}
            >
                <Alert onClose={() => setError('')} severity="error">
                    {error}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Chat; 