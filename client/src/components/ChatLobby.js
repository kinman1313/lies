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
    SpeedDialAction
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
import { motion } from 'framer-motion';
import MessageInput from './MessageInput';

const ChatLobby = ({
    onCreateRoom,
    onJoinRoom,
    onOpenSettings,
    socket
}) => {
    const { user } = useAuth();
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [menuAnchorEl, setMenuAnchorEl] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        if (socket) {
            // Join general lobby
            socket.emit('joinLobby');

            // Listen for online users updates
            socket.on('onlineUsers', (users) => {
                setOnlineUsers(users.filter(u => u.id !== user.id));
            });

            // Listen for lobby messages
            socket.on('lobbyMessage', (message) => {
                setMessages(prev => [...prev, message]);
            });

            return () => {
                socket.off('onlineUsers');
                socket.off('lobbyMessage');
                socket.emit('leaveLobby');
            };
        }
    }, [socket, user.id]);

    const handleSendMessage = (messageData) => {
        if (socket) {
            socket.emit('sendLobbyMessage', {
                ...messageData,
                roomType: 'lobby'
            });
        }
    };

    const handleUserClick = (clickedUser) => {
        setSelectedUser(clickedUser);
        setMenuAnchorEl(null);
        // Create or join private chat
        socket.emit('createPrivateRoom', { targetUserId: clickedUser.id }, (response) => {
            if (response.success) {
                onJoinRoom && onJoinRoom(response.roomId);
            }
        });
    };

    const actions = [
        { icon: <GroupIcon />, name: 'Create Group Chat', onClick: handleCreateRoom },
        { icon: <InviteIcon />, name: 'Invite Friends', onClick: () => { } },
        { icon: <SettingsIcon />, name: 'Settings', onClick: onOpenSettings }
    ];

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Paper elevation={0} sx={{ p: 2, backgroundColor: 'background.default' }}>
                <Typography variant="h6" gutterBottom>
                    General Lobby
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {onlineUsers.length} users online
                </Typography>
            </Paper>

            <Box sx={{ flex: 1, overflow: 'auto', p: 2, display: 'flex' }}>
                {/* Online Users List */}
                <Box sx={{ width: 300, borderRight: 1, borderColor: 'divider', pr: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Online Users
                    </Typography>
                    <List>
                        {onlineUsers.map((onlineUser) => (
                            <motion.div
                                key={onlineUser.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ListItem
                                    button
                                    onClick={() => handleUserClick(onlineUser)}
                                    sx={{
                                        borderRadius: 1,
                                        mb: 1,
                                        '&:hover': {
                                            backgroundColor: 'action.hover'
                                        }
                                    }}
                                >
                                    <ListItemAvatar>
                                        <Badge
                                            overlap="circular"
                                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                            variant="dot"
                                            color="success"
                                        >
                                            <Avatar src={onlineUser.profile?.avatar?.url}>
                                                {onlineUser.username[0].toUpperCase()}
                                            </Avatar>
                                        </Badge>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={onlineUser.username}
                                        secondary={onlineUser.status || 'Online'}
                                    />
                                    <IconButton
                                        edge="end"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setMenuAnchorEl(e.currentTarget);
                                            setSelectedUser(onlineUser);
                                        }}
                                    >
                                        <MoreIcon />
                                    </IconButton>
                                </ListItem>
                            </motion.div>
                        ))}
                    </List>
                </Box>

                {/* Lobby Chat Area */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', pl: 2 }}>
                    <Box sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
                        {messages.map((message, index) => (
                            <Box
                                key={index}
                                sx={{
                                    mb: 1,
                                    display: 'flex',
                                    flexDirection: message.userId === user.id ? 'row-reverse' : 'row',
                                    alignItems: 'flex-start'
                                }}
                            >
                                <Avatar
                                    src={message.avatar}
                                    sx={{ width: 32, height: 32, mr: 1, ml: 1 }}
                                >
                                    {message.username[0].toUpperCase()}
                                </Avatar>
                                <Paper
                                    sx={{
                                        p: 1,
                                        maxWidth: '70%',
                                        bgcolor: message.userId === user.id ? 'primary.main' : 'background.paper',
                                        color: message.userId === user.id ? 'primary.contrastText' : 'text.primary'
                                    }}
                                >
                                    <Typography variant="body2">{message.content}</Typography>
                                </Paper>
                            </Box>
                        ))}
                    </Box>
                    <MessageInput onSendMessage={handleSendMessage} />
                </Box>
            </Box>

            <SpeedDial
                ariaLabel="Chat Actions"
                sx={{ position: 'absolute', bottom: 16, right: 16 }}
                icon={<SpeedDialIcon />}
            >
                {actions.map((action) => (
                    <SpeedDialAction
                        key={action.name}
                        icon={action.icon}
                        tooltipTitle={action.name}
                        onClick={action.onClick}
                    />
                ))}
            </SpeedDial>

            <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={() => setMenuAnchorEl(null)}
            >
                <MenuItem onClick={() => handleUserClick(selectedUser)}>
                    <ListItemIcon>
                        <ChatIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Start Chat</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => {
                    setMenuAnchorEl(null);
                    // Handle invite to room
                }}>
                    <ListItemIcon>
                        <InviteIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Invite to Room</ListItemText>
                </MenuItem>
            </Menu>
        </Box>
    );
};

export default ChatLobby; 