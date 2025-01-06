import React, { useState, useEffect, useRef } from 'react';
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
    Divider,
    Switch,
    FormControlLabel,
    Snackbar,
    Alert
} from '@mui/material';
import {
    Settings as SettingsIcon,
    PersonAdd as InviteIcon,
    ExitToApp as LeaveIcon,
    MoreVert as MoreIcon,
    Delete as DeleteIcon,
    Notifications as NotificationsIcon,
    NotificationsOff as NotificationsOffIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import PinnedMessages from './PinnedMessages';
import TypingIndicator from './TypingIndicator';

const ChatRoom = ({
    roomId,
    onLeaveRoom,
    onClose
}) => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [room, setRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [pinnedMessages, setPinnedMessages] = useState([]);
    const [members, setMembers] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [settingsAnchorEl, setSettingsAnchorEl] = useState(null);
    const [error, setError] = useState('');
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const typingTimeoutRef = useRef({});
    const notificationSound = useRef(new Audio('/notification.mp3'));

    useEffect(() => {
        if (socket && roomId) {
            console.log('Setting up socket listeners for room:', roomId); // Debug log

            // Join room
            socket.emit('joinRoom', { roomId });

            // Load room data
            socket.emit('getRoomData', { roomId }, (response) => {
                if (response.success) {
                    setRoom(response.room);
                    setMembers(response.members);
                    setMessages(response.messages);
                    setPinnedMessages(response.messages.filter(m => m.isPinned));
                    setUnreadCount(response.unreadCount || 0);
                } else {
                    setError('Failed to load room data');
                }
            });

            // Listen for new messages
            socket.on('message', (data) => {
                console.log('Received message event:', data); // Debug log
                if (data.type === 'new') {
                    setMessages(prev => [...prev, data.message]);
                } else if (data.type === 'reaction') {
                    setMessages(prev => prev.map(msg =>
                        msg._id === data.messageId
                            ? { ...msg, reactions: data.reactions }
                            : msg
                    ));
                }
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

            // Listen for file messages
            socket.on('fileMessage', ({ messageId, fileName, fileSize, fileType }) => {
                setMessages(prev => prev.map(msg =>
                    msg._id === messageId
                        ? { ...msg, metadata: { ...msg.metadata, fileName, fileSize, fileType } }
                        : msg
                ));
            });

            // Listen for message pins
            socket.on('messagePinned', ({ messageId, pinnedBy, pinnedAt }) => {
                setMessages(prev => prev.map(msg =>
                    msg._id === messageId
                        ? { ...msg, isPinned: true, pinnedBy, pinnedAt }
                        : msg
                ));
                setPinnedMessages(prev => [...prev, messages.find(m => m._id === messageId)]);
            });

            socket.on('messageUnpinned', ({ messageId }) => {
                setMessages(prev => prev.map(msg =>
                    msg._id === messageId
                        ? { ...msg, isPinned: false, pinnedBy: null, pinnedAt: null }
                        : msg
                ));
                setPinnedMessages(prev => prev.filter(m => m._id !== messageId));
            });

            // Listen for message edits
            socket.on('messageEdited', ({ messageId, content, editedAt }) => {
                setMessages(prev => prev.map(msg =>
                    msg._id === messageId
                        ? { ...msg, content, isEdited: true, editedAt }
                        : msg
                ));
                setPinnedMessages(prev => prev.map(msg =>
                    msg._id === messageId
                        ? { ...msg, content, isEdited: true, editedAt }
                        : msg
                ));
            });

            // Listen for message deletions
            socket.on('messageDeleted', ({ messageId, deletedAt }) => {
                setMessages(prev => prev.map(msg =>
                    msg._id === messageId
                        ? { ...msg, isDeleted: true, deletedAt }
                        : msg
                ));
                setPinnedMessages(prev => prev.filter(m => m._id !== messageId));
            });

            // Listen for typing indicators
            socket.on('typing', ({ userId, username, isTyping }) => {
                setTypingUsers(prev => {
                    if (isTyping && !prev.includes(username)) {
                        return [...prev, username];
                    } else if (!isTyping) {
                        return prev.filter(u => u !== username);
                    }
                    return prev;
                });
            });

            // Listen for message read status
            socket.on('messageRead', ({ messageId, userId, readAt }) => {
                setMessages(prev => prev.map(msg =>
                    msg._id === messageId
                        ? {
                            ...msg,
                            readBy: [...(msg.readBy || []), { user: userId, readAt }]
                        }
                        : msg
                ));
            });

            // Listen for member updates
            socket.on('memberUpdate', ({ members: updatedMembers }) => {
                setMembers(updatedMembers);
            });

            // Handle errors
            socket.on('error', (error) => {
                console.error('Socket error:', error);
                setError(error.message);
            });

            return () => {
                console.log('Cleaning up socket listeners'); // Debug log
                socket.emit('leaveRoom', { roomId });
                socket.off('message');
                socket.off('voiceMessage');
                socket.off('gifMessage');
                socket.off('fileMessage');
                socket.off('messagePinned');
                socket.off('messageUnpinned');
                socket.off('messageEdited');
                socket.off('messageDeleted');
                socket.off('typing');
                socket.off('messageRead');
                socket.off('memberUpdate');
                socket.off('error');
            };
        }
    }, [socket, roomId, user._id, notificationsEnabled]);

    const handleSendMessage = (messageData) => {
        if (socket) {
            console.log('Sending message:', messageData); // Debug log
            socket.emit('message', {
                ...messageData,
                roomId
            });
        }
    };

    const handleTyping = (isTyping) => {
        if (socket) {
            // Clear existing timeout
            if (typingTimeoutRef.current[roomId]) {
                clearTimeout(typingTimeoutRef.current[roomId]);
            }

            socket.emit('typing', { roomId, isTyping });

            // Set timeout to stop typing indicator after 3 seconds
            if (isTyping) {
                typingTimeoutRef.current[roomId] = setTimeout(() => {
                    socket.emit('typing', { roomId, isTyping: false });
                }, 3000);
            }
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

    const toggleNotifications = () => {
        setNotificationsEnabled(!notificationsEnabled);
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6">
                        {room?.name || 'Loading...'}
                    </Typography>
                    {unreadCount > 0 && (
                        <Typography
                            variant="caption"
                            sx={{
                                backgroundColor: 'primary.main',
                                color: 'white',
                                px: 1,
                                py: 0.5,
                                borderRadius: 1
                            }}
                        >
                            {unreadCount} unread
                        </Typography>
                    )}
                </Box>
                <Box>
                    <Tooltip title={notificationsEnabled ? 'Disable Notifications' : 'Enable Notifications'}>
                        <IconButton onClick={toggleNotifications}>
                            {notificationsEnabled ? <NotificationsIcon /> : <NotificationsOffIcon />}
                        </IconButton>
                    </Tooltip>
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
                    <PinnedMessages messages={pinnedMessages} roomId={roomId} />
                    <MessageList messages={messages} />
                    <Box sx={{ position: 'relative' }}>
                        <TypingIndicator typingUsers={typingUsers} />
                        <MessageInput
                            onSendMessage={handleSendMessage}
                            onTyping={handleTyping}
                        />
                    </Box>
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
                    <ListItemText primary="Leave Room" />
                    <LeaveIcon sx={{ ml: 1 }} />
                </MenuItem>
                {room?.ownerId === user.id && (
                    <MenuItem onClick={handleDeleteRoom}>
                        <ListItemText primary="Delete Room" />
                        <DeleteIcon sx={{ ml: 1 }} />
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

export default ChatRoom; 