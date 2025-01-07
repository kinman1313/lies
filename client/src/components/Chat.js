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
        <Box sx={{
            height: '100vh',
            display: 'flex',
            background: theme.palette.background.default,
            backgroundImage: `
                radial-gradient(at 40% 20%, rgba(124, 77, 255, 0.15) 0px, transparent 50%),
                radial-gradient(at 80% 0%, rgba(0, 229, 255, 0.1) 0px, transparent 50%),
                radial-gradient(at 0% 50%, rgba(124, 77, 255, 0.1) 0px, transparent 50%)
            `,
            backgroundAttachment: 'fixed'
        }}>
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
                        background: 'rgba(19, 47, 76, 0.95)',
                        backdropFilter: 'blur(20px)',
                        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '4px 0 30px rgba(0, 0, 0, 0.2)'
                    },
                }}
            >
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
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{user?.username}</Typography>
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
                </Box>

                {/* Main chat area */}
                <Box sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    background: 'rgba(19, 47, 76, 0.4)',
                    backdropFilter: 'blur(20px)'
                }}>
                    {/* Header */}
                    <Box sx={{
                        p: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        background: 'rgba(19, 47, 76, 0.95)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                        zIndex: 2
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {isMobile && (
                                <IconButton
                                    edge="start"
                                    onClick={() => setDrawerOpen(true)}
                                    sx={{
                                        color: theme.palette.primary.main,
                                        '&:hover': {
                                            background: 'rgba(124, 77, 255, 0.08)'
                                        }
                                    }}
                                >
                                    <MenuIcon />
                                </IconButton>
                            )}
                            <Typography variant="h6" sx={{
                                fontWeight: 600,
                                background: theme.palette.primary.gradient,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}>
                                {activeRoom ? 'Chat Room' : 'General Lobby'}
                            </Typography>
                            {!activeRoom && (
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: 'rgba(255, 255, 255, 0.7)',
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        padding: '4px 8px',
                                        borderRadius: '12px',
                                        fontSize: '0.75rem'
                                    }}
                                >
                                    {usersOnline.length} users online
                                </Typography>
                            )}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton
                                onClick={() => setProfileOpen(true)}
                                sx={{
                                    color: theme.palette.primary.main,
                                    '&:hover': {
                                        background: 'rgba(124, 77, 255, 0.08)'
                                    }
                                }}
                            >
                                <SettingsIcon />
                            </IconButton>
                            <IconButton
                                onClick={handleLogout}
                                sx={{
                                    color: '#ef5350',
                                    '&:hover': {
                                        background: 'rgba(239, 83, 80, 0.08)'
                                    }
                                }}
                            >
                                <LogoutIcon />
                            </IconButton>
                        </Box>
                    </Box>

                    {/* Chat content */}
                    <Box sx={{
                        flex: 1,
                        overflow: 'hidden',
                        position: 'relative',
                        '&::after': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            pointerEvents: 'none',
                            background: 'linear-gradient(180deg, rgba(19, 47, 76, 0.2) 0%, transparent 100%)'
                        }
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
            </Drawer>
        </Box>
    );
};

export default Chat; 