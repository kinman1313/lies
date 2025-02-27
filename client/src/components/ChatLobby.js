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

    const handleCreateRoom = () => {
        onCreateRoom && onCreateRoom();
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

            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                <List>
                    {onlineUsers.map((onlineUser) => (
                        <motion.div
                            key={onlineUser.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ListItem
                                button
                                onClick={() => handleUserClick(onlineUser)}
                                sx={{
                                    mb: 1,
                                    borderRadius: 1,
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
                                        <Avatar src={onlineUser.avatar}>
                                            {onlineUser.username[0]}
                                        </Avatar>
                                    </Badge>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={onlineUser.username}
                                    secondary={onlineUser.status || 'Online'}
                                />
                                <IconButton edge="end">
                                    <ChatIcon />
                                </IconButton>
                            </ListItem>
                        </motion.div>
                    ))}
                </List>
            </Box>

            <Box sx={{ p: 2 }}>
                <MessageInput onSendMessage={handleSendMessage} />
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
        </Box>
    );
};

export default ChatLobby; 