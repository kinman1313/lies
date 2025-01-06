import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { config } from '../config';
import {
    Container,
    Paper,
    TextField,
    Button,
    List,
    ListItem,
    ListItemText,
    Typography,
    Box,
    AppBar,
    Toolbar,
    IconButton,
    Drawer,
    List as MUIList,
    ListItem as MUIListItem,
    ListItemIcon,
    ListItemText as MUIListItemText,
    Divider
} from '@mui/material';
import {
    Menu as MenuIcon,
    Send as SendIcon,
    ExitToApp as LogoutIcon,
    Person as PersonIcon,
    Gif as GifIcon,
    Mic as MicIcon,
    Schedule as ScheduleIcon,
    EmojiEmotions as EmojiIcon
} from '@mui/icons-material';
import { io } from 'socket.io-client';
import TypingIndicator from './TypingIndicator';
import MessageReactions from './MessageReactions';
import MessageThread from './MessageThread';
import GifPicker from './GifPicker';
import VoiceMessage from './VoiceMessage';
import MessageScheduler from './MessageScheduler';
import UserProfile from './UserProfile';

const drawerWidth = 240;

export default function Chat() {
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [users, setUsers] = useState([]);
    const [showProfile, setShowProfile] = useState(false);
    const [typingUsers, setTypingUsers] = useState([]);
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [showVoiceMessage, setShowVoiceMessage] = useState(false);
    const [showScheduler, setShowScheduler] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [scheduledMessages, setScheduledMessages] = useState([]);
    const messagesEndRef = useRef(null);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const typingTimeoutRef = useRef(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    useEffect(() => {
        const newSocket = io(config.SOCKET_URL, {
            withCredentials: true
        });
        setSocket(newSocket);

        // Join chat with authenticated username
        newSocket.emit('join', user.username);

        return () => newSocket.close();
    }, [user.username]);

    useEffect(() => {
        if (!socket) return;

        socket.on('message', (message) => {
            setMessages((prev) => [...prev, message]);
        });

        socket.on('userJoined', ({ username, users }) => {
            setMessages((prev) => [...prev, {
                text: `${username} joined the chat`,
                system: true,
                timestamp: new Date().toISOString()
            }]);
            setUsers(users);
        });

        socket.on('userLeft', ({ username, users }) => {
            setMessages((prev) => [...prev, {
                text: `${username} left the chat`,
                system: true,
                timestamp: new Date().toISOString()
            }]);
            setUsers(users);
        });

        socket.on('typing', ({ username }) => {
            if (username !== user.username) {
                setTypingUsers(prev => {
                    if (!prev.includes(username)) {
                        return [...prev, username];
                    }
                    return prev;
                });
            }
        });

        socket.on('stopTyping', ({ username }) => {
            setTypingUsers(prev => prev.filter(user => user !== username));
        });

        return () => {
            socket.off('message');
            socket.off('userJoined');
            socket.off('userLeft');
            socket.off('typing');
            socket.off('stopTyping');
        };
    }, [socket, user.username]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const emitTyping = () => {
        if (socket) {
            socket.emit('typing', { username: user.username });

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            typingTimeoutRef.current = setTimeout(() => {
                socket.emit('stopTyping', { username: user.username });
            }, 1000);
        }
    };

    const handleInputChange = (e) => {
        setMessageInput(e.target.value);
        emitTyping();
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (messageInput.trim() && socket) {
            socket.emit('message', messageInput);
            setMessageInput('');
            socket.emit('stopTyping', { username: user.username });
        }
    };

    const handleGifSelect = (gif) => {
        if (socket) {
            socket.emit('message', `[GIF] ${gif.url}`);
            setShowGifPicker(false);
        }
    };

    const handleVoiceMessage = (audioUrl) => {
        if (socket) {
            socket.emit('message', `[VOICE] ${audioUrl}`);
        }
    };

    const handleScheduleMessage = (scheduleData) => {
        setScheduledMessages(prev => [...prev, scheduleData]);
        // Here you would typically also send this to the server
    };

    const handleLogout = async () => {
        try {
            if (socket) {
                socket.disconnect();
            }
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Failed to log out:', error);
        }
    };

    return (
        <Box sx={{ display: 'flex', height: '100vh' }}>
            {/* App Bar */}
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <Toolbar>
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={() => setDrawerOpen(!drawerOpen)}
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        Chat Room
                    </Typography>
                    <IconButton color="inherit" onClick={() => setShowProfile(!showProfile)}>
                        <PersonIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>

            {/* Side Drawer for Online Users */}
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                    },
                }}
            >
                <Toolbar /> {/* Spacer for AppBar */}
                <Box sx={{ overflow: 'auto' }}>
                    <List>
                        <ListItem>
                            <Typography variant="subtitle1" color="primary">
                                Online Users ({users.length})
                            </Typography>
                        </ListItem>
                        {users.map((username, index) => (
                            <ListItem key={index}>
                                <ListItemIcon>
                                    <PersonIcon />
                                </ListItemIcon>
                                <ListItemText primary={username} />
                            </ListItem>
                        ))}
                    </List>
                    <Divider />
                    <List>
                        <ListItem button onClick={handleLogout}>
                            <ListItemIcon>
                                <LogoutIcon />
                            </ListItemIcon>
                            <ListItemText primary="Logout" />
                        </ListItem>
                    </List>
                </Box>
            </Drawer>

            {/* Main Chat Area */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    mt: 8, // Add margin top to account for AppBar
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    marginRight: showProfile ? '300px' : 0,
                    transition: 'margin 0.3s ease-in-out'
                }}
            >
                <Box sx={{ height: 'calc(100vh - 180px)', overflow: 'auto', mb: 2 }}>
                    {messages.map((message, index) => (
                        <MessageThread
                            key={index}
                            message={{
                                ...message,
                                id: index,
                                user: {
                                    id: message.username,
                                    username: message.username,
                                    avatar: null
                                }
                            }}
                            replies={[]}
                            onReply={(reply) => {
                                if (socket) {
                                    socket.emit('message', `@${message.username} ${reply.text}`);
                                }
                            }}
                        />
                    ))}
                    <div ref={messagesEndRef} />
                </Box>

                {/* Message Input Area */}
                <Box sx={{
                    position: 'fixed',
                    bottom: 0,
                    right: showProfile ? 300 : 0,
                    left: drawerWidth,
                    p: 2,
                    bgcolor: 'background.paper',
                    borderTop: 1,
                    borderColor: 'divider'
                }}>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        <IconButton onClick={() => setShowGifPicker(!showGifPicker)} title="Send GIF">
                            <GifIcon />
                        </IconButton>
                        <IconButton onClick={() => setShowVoiceMessage(!showVoiceMessage)} title="Voice Message">
                            <MicIcon />
                        </IconButton>
                        <IconButton onClick={() => setShowScheduler(!showScheduler)} title="Schedule Message">
                            <ScheduleIcon />
                        </IconButton>
                        <IconButton onClick={() => setShowEmojiPicker(!showEmojiPicker)} title="Add Emoji">
                            <EmojiIcon />
                        </IconButton>
                    </Box>

                    {/* Feature Overlays */}
                    {showGifPicker && (
                        <Box sx={{ position: 'absolute', bottom: '100%', left: 0, right: 0, mb: 1 }}>
                            <Paper elevation={3} sx={{ p: 2 }}>
                                <GifPicker
                                    onSelect={handleGifSelect}
                                    onClose={() => setShowGifPicker(false)}
                                />
                            </Paper>
                        </Box>
                    )}

                    {showVoiceMessage && (
                        <Box sx={{ position: 'absolute', bottom: '100%', left: 0, right: 0, mb: 1 }}>
                            <Paper elevation={3} sx={{ p: 2 }}>
                                <VoiceMessage
                                    onSend={handleVoiceMessage}
                                    onClose={() => setShowVoiceMessage(false)}
                                />
                            </Paper>
                        </Box>
                    )}

                    {showScheduler && (
                        <Box sx={{ position: 'absolute', bottom: '100%', left: 0, right: 0, mb: 1 }}>
                            <Paper elevation={3} sx={{ p: 2 }}>
                                <MessageScheduler
                                    scheduledMessages={scheduledMessages}
                                    onSchedule={handleScheduleMessage}
                                    onClose={() => setShowScheduler(false)}
                                />
                            </Paper>
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                            fullWidth
                            value={messageInput}
                            onChange={handleInputChange}
                            placeholder="Type a message..."
                            variant="outlined"
                            size="small"
                        />
                        <IconButton
                            color="primary"
                            onClick={handleSendMessage}
                            disabled={!messageInput.trim()}
                        >
                            <SendIcon />
                        </IconButton>
                    </Box>
                </Box>
            </Box>

            {/* Profile Panel */}
            <Box
                sx={{
                    width: 300,
                    position: 'fixed',
                    right: showProfile ? 0 : -300,
                    top: 0,
                    height: '100vh',
                    bgcolor: 'background.paper',
                    borderLeft: 1,
                    borderColor: 'divider',
                    transition: 'right 0.3s ease-in-out',
                    overflowY: 'auto',
                    mt: 8 // Add margin top to account for AppBar
                }}
            >
                <UserProfile user={user} />
            </Box>
        </Box>
    );
} 