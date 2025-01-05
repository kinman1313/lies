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
    const [drawerOpen, setDrawerOpen] = useState(false);
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

    const drawer = (
        <Box>
            <Toolbar>
                <Typography variant="h6" noWrap component="div">
                    Online Users
                </Typography>
            </Toolbar>
            <Divider />
            <MUIList>
                {users.map((username, index) => (
                    <MUIListItem key={index}>
                        <ListItemIcon>
                            <PersonIcon />
                        </ListItemIcon>
                        <MUIListItemText primary={username} />
                    </MUIListItem>
                ))}
            </MUIList>
            <Divider />
            <MUIList>
                <MUIListItem button onClick={handleLogout}>
                    <ListItemIcon>
                        <LogoutIcon />
                    </ListItemIcon>
                    <MUIListItemText primary="Logout" />
                </MUIListItem>
            </MUIList>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <Toolbar>
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={() => setDrawerOpen(!drawerOpen)}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        Chat Room
                    </Typography>
                    <UserProfile user={user} />
                </Toolbar>
            </AppBar>

            <Drawer
                variant="temporary"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                sx={{
                    display: { xs: 'block', sm: 'none' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                }}
            >
                {drawer}
            </Drawer>

            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', sm: 'block' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                }}
                open
            >
                {drawer}
            </Drawer>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                    mt: 8
                }}
            >
                <Paper
                    elevation={3}
                    sx={{
                        height: 'calc(100vh - 100px)',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    <List sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
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
                            >
                                <Paper
                                    elevation={1}
                                    sx={{
                                        p: 1,
                                        maxWidth: '70%',
                                        bgcolor: message.system
                                            ? 'grey.100'
                                            : message.username === user.username
                                                ? 'primary.light'
                                                : 'background.paper'
                                    }}
                                >
                                    <ListItemText
                                        primary={
                                            message.system ? (
                                                <Typography variant="body2" color="text.secondary">
                                                    {message.text}
                                                </Typography>
                                            ) : (
                                                <>
                                                    <Typography variant="subtitle2" color={
                                                        message.username === user.username ? 'white' : 'primary'
                                                    }>
                                                        {message.username === user.username ? 'You' : message.username}
                                                    </Typography>
                                                    <Typography color={
                                                        message.username === user.username ? 'white' : 'text.primary'
                                                    }>
                                                        {message.text}
                                                    </Typography>
                                                </>
                                            )
                                        }
                                        secondary={
                                            <Box>
                                                <Typography
                                                    variant="caption"
                                                    color={message.username === user.username ? 'white' : 'text.secondary'}
                                                >
                                                    {new Date(message.timestamp).toLocaleTimeString()}
                                                </Typography>
                                                {!message.system && (
                                                    <MessageReactions
                                                        reactions={message.reactions || []}
                                                        onAddReaction={(emoji) => {
                                                            // Handle reaction
                                                        }}
                                                        onRemoveReaction={(emoji) => {
                                                            // Handle removing reaction
                                                        }}
                                                        currentUserId={user.username}
                                                    />
                                                )}
                                            </Box>
                                        }
                                    />
                                </Paper>
                            </MessageThread>
                        ))}
                        <div ref={messagesEndRef} />
                    </List>

                    {typingUsers.length > 0 && (
                        <TypingIndicator users={typingUsers} />
                    )}

                    <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
                        {showVoiceMessage && (
                            <Box sx={{ mb: 2 }}>
                                <VoiceMessage
                                    onSend={handleVoiceMessage}
                                    onClose={() => setShowVoiceMessage(false)}
                                />
                            </Box>
                        )}

                        {showScheduler && (
                            <Box sx={{ mb: 2 }}>
                                <MessageScheduler
                                    scheduledMessages={scheduledMessages}
                                    onSchedule={handleScheduleMessage}
                                    onClose={() => setShowScheduler(false)}
                                    onEdit={(message) => {
                                        // Handle edit
                                    }}
                                    onDelete={(id) => {
                                        setScheduledMessages(prev => prev.filter(msg => msg.id !== id));
                                    }}
                                />
                            </Box>
                        )}

                        {showGifPicker && (
                            <Box sx={{ mb: 2 }}>
                                <GifPicker
                                    onSelect={handleGifSelect}
                                    onClose={() => setShowGifPicker(false)}
                                />
                            </Box>
                        )}

                        <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
                            <IconButton
                                color="primary"
                                onClick={() => setShowGifPicker(!showGifPicker)}
                                title="Send GIF"
                            >
                                <GifIcon />
                            </IconButton>
                            <IconButton
                                color="primary"
                                onClick={() => setShowVoiceMessage(true)}
                                title="Record Voice Message"
                            >
                                <MicIcon />
                            </IconButton>
                            <IconButton
                                color="primary"
                                onClick={() => setShowScheduler(true)}
                                title="Schedule Message"
                            >
                                <ScheduleIcon />
                            </IconButton>
                            <IconButton
                                color="primary"
                                onClick={() => setShowEmojiPicker(true)}
                                title="Add Emoji"
                            >
                                <EmojiIcon />
                            </IconButton>
                        </Box>

                        <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
                            <TextField
                                fullWidth
                                value={messageInput}
                                onChange={handleInputChange}
                                placeholder="Type a message..."
                                variant="outlined"
                                size="small"
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                endIcon={<SendIcon />}
                            >
                                Send
                            </Button>
                        </form>
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
} 