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
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    marginRight: showProfile ? '300px' : 0,
                    transition: 'margin 0.3s ease-in-out'
                }}
            >
                <Box sx={{ height: 'calc(100vh - 140px)', overflow: 'auto', mb: 2 }}>
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
                </Box>

                <Box sx={{ position: 'fixed', bottom: 0, right: showProfile ? 300 : 0, left: 0, p: 2, bgcolor: 'background.paper' }}>
                    <TextField
                        fullWidth
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Type a message..."
                        variant="outlined"
                    />
                </Box>
            </Box>

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
                    overflowY: 'auto'
                }}
            >
                <IconButton
                    onClick={() => setShowProfile(!showProfile)}
                    sx={{
                        position: 'absolute',
                        left: -48,
                        top: 8,
                        bgcolor: 'background.paper',
                        '&:hover': { bgcolor: 'action.hover' },
                        zIndex: 1
                    }}
                >
                    <PersonIcon />
                </IconButton>
                <UserProfile user={user} />
            </Box>
        </Box>
    );
} 