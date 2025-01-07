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

const DRAWER_WIDTH = 280;

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
        <Box sx={{
            display: 'flex',
            height: '100vh',
            width: '100vw',
            overflow: 'hidden',
            bgcolor: 'background.default'
        }}>
            {/* Sidebar */}
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
                        background: 'rgba(19, 47, 76, 0.95)',
                        backdropFilter: 'blur(20px)',
                        borderRight: '1px solid rgba(255, 255, 255, 0.1)'
                    }
                }}
            >
                {/* User Profile Section */}
                <Box sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.02)'
                }}>
                    <Avatar
                        src={user?.avatar}
                        alt={user?.username}
                        onClick={() => setProfileOpen(true)}
                        sx={{
                            cursor: 'pointer',
                            width: 40,
                            height: 40,
                            border: '2px solid rgba(124, 77, 255, 0.5)',
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                                transform: 'scale(1.05)',
                                borderColor: theme.palette.primary.main
                            }
                        }}
                    />
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'white' }}>
                            {user?.username}
                        </Typography>
                        <Typography
                            variant="caption"
                            sx={{
                                color: '#4CAF50',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5
                            }}
                        >
                            <Box
                                component="span"
                                sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    backgroundColor: '#4CAF50',
                                    display: 'inline-block'
                                }}
                            />
                            Online
                        </Typography>
                    </Box>
                    <IconButton onClick={handleLogout} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        <LogoutIcon />
                    </IconButton>
                </Box>

                {/* Online Users List */}
                <List sx={{ flex: 1, overflow: 'auto' }}>
                    {usersOnline.map((onlineUser) => (
                        <ListItem key={onlineUser.id}>
                            <ListItemIcon>
                                <Avatar src={onlineUser.avatar} alt={onlineUser.username} />
                            </ListItemIcon>
                            <ListItemText
                                primary={onlineUser.username}
                                sx={{ color: 'white' }}
                            />
                        </ListItem>
                    ))}
                </List>
            </Drawer>

            {/* Main Chat Area */}
            <Box sx={{
                flex: 1,
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                ml: isMobile ? 0 : `${DRAWER_WIDTH}px`,
                bgcolor: 'background.default'
            }}>
                {/* Chat Header */}
                <AppBar position="static" sx={{ bgcolor: 'background.paper', boxShadow: 1 }}>
                    <Toolbar>
                        {isMobile && (
                            <IconButton
                                edge="start"
                                onClick={() => setDrawerOpen(true)}
                                sx={{ mr: 2 }}
                            >
                                <MenuIcon />
                            </IconButton>
                        )}
                        <Typography variant="h6" sx={{ flexGrow: 1 }}>
                            {activeRoom ? `Room: ${activeRoom}` : 'Chat Lobby'}
                        </Typography>
                    </Toolbar>
                </AppBar>

                {/* Chat Content */}
                <Box sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    bgcolor: 'background.default'
                }}>
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
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
                <Alert
                    onClose={() => setError('')}
                    severity="error"
                    sx={{
                        backgroundColor: 'rgba(211, 47, 47, 0.95)',
                        backdropFilter: 'blur(20px)',
                        '.MuiAlert-icon': {
                            color: '#fff'
                        }
                    }}
                >
                    {error}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Chat; 