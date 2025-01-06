import React, { useState, useEffect, useRef } from 'react';
import { Box, Drawer, useMediaQuery, useTheme, IconButton, Divider, List, ListItem, ListItemText, ListItemAvatar, Avatar, Badge, Typography } from '@mui/material';
import { Menu as MenuIcon, FiberManualRecord as OnlineIcon } from '@mui/icons-material';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import RoomList from './RoomList';
import ChatRoom from './ChatRoom';
import UserProfile from './UserProfile';

const Chat = () => {
    const { socket } = useSocket();
    const { user, updateUser } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [rooms, setRooms] = useState([]);
    const [currentRoomId, setCurrentRoomId] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(!isMobile);
    const [error, setError] = useState('');
    const [onlineUsers, setOnlineUsers] = useState([]);

    const handleUpdateProfile = async (profile) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users/me`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ profile })
            });
            const data = await response.json();
            if (data.user) {
                updateUser(data.user);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    };

    const handleUpdatePreferences = async (preferences) => {
        try {
            // Create a clean preferences object without any circular references
            const cleanPreferences = {
                theme: preferences.theme,
                language: preferences.language,
                notifications: preferences.notifications,
                messageColor: preferences.messageColor,
                bubbleStyle: preferences.bubbleStyle
            };

            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users/me`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ preferences: cleanPreferences })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.user) {
                updateUser(data.user);
            }
        } catch (error) {
            console.error('Error updating preferences:', error);
        }
    };

    const handleUpdateAvatar = async (avatarData) => {
        try {
            // Create a new FormData object
            const formData = new FormData();

            // Convert base64 to blob
            const base64Response = await fetch(avatarData);
            const blob = await base64Response.blob();

            // Append the blob to FormData
            formData.append('avatar', blob, 'avatar.jpg');

            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users/avatar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            const data = await response.json();
            if (data.user) {
                updateUser(data.user);
            }
        } catch (error) {
            console.error('Error updating avatar:', error);
        }
    };

    useEffect(() => {
        if (socket) {
            loadRooms();
            loadOnlineUsers();

            socket.on('roomListUpdate', loadRooms);
            socket.on('roomDeleted', handleRoomDeleted);
            socket.on('userConnected', handleUserConnection);
            socket.on('userDisconnected', handleUserDisconnection);
            socket.on('onlineUsers', setOnlineUsers);

            return () => {
                socket.off('roomListUpdate');
                socket.off('roomDeleted');
                socket.off('userConnected');
                socket.off('userDisconnected');
                socket.off('onlineUsers');
            };
        }
    }, [socket]);

    const loadRooms = async () => {
        socket.emit('getRooms', (response) => {
            if (response.success) {
                setRooms(response.rooms);
                // If no room is selected and rooms exist, select the first one
                if (!currentRoomId && response.rooms.length > 0) {
                    setCurrentRoomId(response.rooms[0]._id);
                }
            } else {
                setError('Failed to load rooms');
            }
        });
    };

    const handleRoomSelect = (roomId) => {
        setCurrentRoomId(roomId);
        if (isMobile) {
            setDrawerOpen(false);
        }
    };

    const handleRoomDeleted = ({ roomId }) => {
        if (currentRoomId === roomId) {
            setCurrentRoomId(null);
        }
    };

    const handleLeaveRoom = () => {
        setCurrentRoomId(null);
        if (isMobile) {
            setDrawerOpen(true);
        }
    };

    const loadOnlineUsers = () => {
        if (socket) {
            socket.emit('getOnlineUsers');
        }
    };

    const handleUserConnection = (userData) => {
        setOnlineUsers(prev => [...prev, userData]);
    };

    const handleUserDisconnection = (userId) => {
        setOnlineUsers(prev => prev.filter(u => u._id !== userId));
    };

    const handleDirectMessage = async (targetUser) => {
        if (socket) {
            socket.emit('createDirectRoom', { targetUserId: targetUser._id }, (response) => {
                if (response.success) {
                    setCurrentRoomId(response.room._id);
                    if (isMobile) {
                        setDrawerOpen(false);
                    }
                }
            });
        }
    };

    return (
        <Box sx={{ height: '100vh', display: 'flex', bgcolor: 'background.default' }}>
            {/* Menu Button */}
            <IconButton
                sx={{
                    position: 'fixed',
                    top: 16,
                    left: drawerOpen ? 336 : 16,
                    zIndex: theme.zIndex.drawer + 1,
                    bgcolor: 'background.paper',
                    boxShadow: 1,
                    transition: theme.transitions.create(['left'], {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.leavingScreen,
                    }),
                    '&:hover': { bgcolor: 'background.paper' }
                }}
                onClick={() => setDrawerOpen(!drawerOpen)}
            >
                <MenuIcon />
            </IconButton>

            {/* Left Panel */}
            <Drawer
                variant={isMobile ? 'temporary' : 'persistent'}
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                sx={{
                    width: 320,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: 320,
                        boxSizing: 'border-box',
                        border: 'none',
                        bgcolor: 'background.paper',
                        backgroundImage: 'none',
                    }
                }}
            >
                <Box sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: 'background.paper',
                }}>
                    {/* User Profile Section */}
                    <UserProfile
                        user={user}
                        onUpdateProfile={handleUpdateProfile}
                        onUpdatePreferences={handleUpdatePreferences}
                        onUpdateAvatar={handleUpdateAvatar}
                    />
                    <Divider />

                    {/* Online Users Section */}
                    <Box sx={{ p: 2, flex: 1, overflowY: 'auto' }}>
                        <Typography variant="h6" gutterBottom sx={{ pl: 1 }}>
                            Online Users
                        </Typography>
                        <List>
                            {onlineUsers.map((onlineUser) => (
                                onlineUser._id !== user?._id && (
                                    <ListItem
                                        key={onlineUser._id}
                                        button
                                        onClick={() => handleDirectMessage(onlineUser)}
                                        sx={{
                                            borderRadius: 1,
                                            mb: 0.5,
                                            '&:hover': {
                                                bgcolor: 'action.hover'
                                            }
                                        }}
                                    >
                                        <ListItemAvatar>
                                            <Badge
                                                overlap="circular"
                                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                                badgeContent={
                                                    <Box
                                                        sx={{
                                                            width: 10,
                                                            height: 10,
                                                            borderRadius: '50%',
                                                            bgcolor: 'success.main',
                                                            border: '2px solid',
                                                            borderColor: 'background.paper'
                                                        }}
                                                    />
                                                }
                                            >
                                                <Avatar src={onlineUser.profile?.avatar?.url}>
                                                    {onlineUser.username?.[0].toUpperCase()}
                                                </Avatar>
                                            </Badge>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={onlineUser.username}
                                            secondary="Online"
                                            primaryTypographyProps={{
                                                variant: 'subtitle2'
                                            }}
                                            secondaryTypographyProps={{
                                                variant: 'caption',
                                                sx: { color: 'success.main' }
                                            }}
                                        />
                                    </ListItem>
                                )
                            ))}
                        </List>
                    </Box>
                    <Divider />

                    {/* Rooms Section */}
                    <Box sx={{ flex: 1, overflowY: 'auto' }}>
                        <RoomList
                            rooms={rooms}
                            onRoomSelect={handleRoomSelect}
                            socket={socket}
                        />
                    </Box>
                </Box>
            </Drawer>

            {/* Main Chat Area */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    ml: !isMobile && drawerOpen ? '320px' : 0,
                    transition: theme.transitions.create(['margin'], {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.leavingScreen,
                    })
                }}
            >
                {currentRoomId ? (
                    <ChatRoom
                        roomId={currentRoomId}
                        onLeaveRoom={handleLeaveRoom}
                        socket={socket}
                    />
                ) : (
                    <Box
                        sx={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'background.default'
                        }}
                    >
                        <Typography variant="h6" color="text.secondary">
                            Select a user or room to start chatting
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default Chat; 