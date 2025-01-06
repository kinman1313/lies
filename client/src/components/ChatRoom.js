import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Tooltip,
    Menu,
    MenuItem,
    Divider
} from '@mui/material';
import {
    Settings as SettingsIcon,
    PersonAdd as InviteIcon,
    ExitToApp as LeaveIcon,
    MoreVert as MoreIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

const ChatRoom = ({
    roomId,
    onLeaveRoom,
    socket,
    onClose
}) => {
    const { user } = useAuth();
    const [room, setRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [members, setMembers] = useState([]);
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [settingsAnchorEl, setSettingsAnchorEl] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (socket && roomId) {
            // Join room
            socket.emit('joinRoom', { roomId });

            // Load room data
            socket.emit('getRoomData', { roomId }, (response) => {
                if (response.success) {
                    setRoom(response.room);
                    setMembers(response.members);
                    setMessages(response.messages);
                } else {
                    setError('Failed to load room data');
                }
            });

            // Listen for new messages
            socket.on('message', (message) => {
                setMessages(prev => [...prev, message]);
            });

            // Listen for voice messages
            socket.on('voiceMessage', ({ messageId, duration }) => {
                setMessages(prev => prev.map(msg =>
                    msg._id === messageId
                        ? { ...msg, metadata: { ...msg.metadata, duration } }
                        : msg
                ));
            });

            // Listen for GIF messages
            socket.on('gifMessage', ({ messageId, dimensions }) => {
                setMessages(prev => prev.map(msg =>
                    msg._id === messageId
                        ? { ...msg, metadata: { ...msg.metadata, ...dimensions } }
                        : msg
                ));
            });

            // Listen for message reactions
            socket.on('messageReaction', ({ messageId, emoji, action, userId, username }) => {
                setMessages(prev => prev.map(msg => {
                    if (msg._id === messageId) {
                        const reactions = [...(msg.reactions || [])];
                        const reactionIndex = reactions.findIndex(r => r.emoji === emoji);

                        if (action === 'add') {
                            if (reactionIndex === -1) {
                                reactions.push({ emoji, users: [{ _id: userId, username }] });
                            } else if (!reactions[reactionIndex].users.some(u => u._id === userId)) {
                                reactions[reactionIndex].users.push({ _id: userId, username });
                            }
                        } else {
                            if (reactionIndex !== -1) {
                                reactions[reactionIndex].users = reactions[reactionIndex].users.filter(u => u._id !== userId);
                                if (reactions[reactionIndex].users.length === 0) {
                                    reactions.splice(reactionIndex, 1);
                                }
                            }
                        }

                        return { ...msg, reactions };
                    }
                    return msg;
                }));
            });

            // Listen for member updates
            socket.on('memberUpdate', ({ members: updatedMembers }) => {
                setMembers(updatedMembers);
            });

            return () => {
                socket.emit('leaveRoom', { roomId });
                socket.off('message');
                socket.off('voiceMessage');
                socket.off('gifMessage');
                socket.off('messageReaction');
                socket.off('memberUpdate');
            };
        }
    }, [socket, roomId]);

    const handleSendMessage = (messageData) => {
        if (socket) {
            // Ensure message data has the required fields
            const message = {
                roomId,
                type: messageData.type || 'text',
                content: messageData.content,
                metadata: messageData.metadata || {}
            };

            // Send message through socket
            socket.emit('sendMessage', message, (response) => {
                if (!response.success) {
                    setError('Failed to send message');
                }
            });
        }
    };

    const handleInviteMember = () => {
        if (socket && inviteEmail.trim()) {
            socket.emit('inviteMember', {
                roomId,
                email: inviteEmail.trim()
            }, (response) => {
                if (response.success) {
                    setInviteDialogOpen(false);
                    setInviteEmail('');
                } else {
                    setError(response.error || 'Failed to send invite');
                }
            });
        }
    };

    const handleLeaveRoom = () => {
        if (socket) {
            socket.emit('leaveRoom', { roomId }, (response) => {
                if (response.success) {
                    onLeaveRoom && onLeaveRoom();
                } else {
                    setError('Failed to leave room');
                }
            });
        }
    };

    const handleDeleteRoom = () => {
        if (socket && room?.ownerId === user.id) {
            socket.emit('deleteRoom', { roomId }, (response) => {
                if (response.success) {
                    onClose && onClose();
                } else {
                    setError('Failed to delete room');
                }
            });
        }
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Room Header */}
            <Box sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: 1,
                borderColor: 'divider'
            }}>
                <Typography variant="h6">
                    {room?.name || 'Loading...'}
                </Typography>
                <Box>
                    <Tooltip title="Invite Member">
                        <IconButton onClick={() => setInviteDialogOpen(true)}>
                            <InviteIcon />
                        </IconButton>
                    </Tooltip>
                    <IconButton onClick={(e) => setSettingsAnchorEl(e.currentTarget)}>
                        <MoreIcon />
                    </IconButton>
                </Box>
            </Box>

            {/* Room Content */}
            <Box sx={{
                flex: 1,
                display: 'flex',
                overflow: 'hidden'
            }}>
                {/* Messages Area */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <MessageList messages={messages} />
                    <MessageInput onSendMessage={handleSendMessage} />
                </Box>

                {/* Members Sidebar */}
                <Box sx={{
                    width: 240,
                    borderLeft: 1,
                    borderColor: 'divider',
                    display: { xs: 'none', sm: 'block' }
                }}>
                    <List>
                        <ListItem>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                Members ({members.length})
                            </Typography>
                        </ListItem>
                        {members.map((member) => (
                            <ListItem key={member.id}>
                                <ListItemAvatar>
                                    <Avatar src={member.avatar} alt={member.name}>
                                        {member.name[0]}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={member.name}
                                    secondary={member.id === room?.ownerId ? 'Owner' : ''}
                                />
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Box>

            {/* Settings Menu */}
            <Menu
                anchorEl={settingsAnchorEl}
                open={Boolean(settingsAnchorEl)}
                onClose={() => setSettingsAnchorEl(null)}
            >
                <MenuItem onClick={handleLeaveRoom}>
                    <ListItemAvatar>
                        <LeaveIcon />
                    </ListItemAvatar>
                    <ListItemText primary="Leave Room" />
                </MenuItem>
                {room?.ownerId === user.id && (
                    <MenuItem onClick={handleDeleteRoom}>
                        <ListItemAvatar>
                            <DeleteIcon />
                        </ListItemAvatar>
                        <ListItemText primary="Delete Room" />
                    </MenuItem>
                )}
            </Menu>

            {/* Invite Dialog */}
            <Dialog open={inviteDialogOpen} onClose={() => setInviteDialogOpen(false)}>
                <DialogTitle>Invite Member</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Email Address"
                        type="email"
                        fullWidth
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleInviteMember} variant="contained">
                        Send Invite
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ChatRoom; 