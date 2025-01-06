import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    Typography,
    IconButton,
    Menu,
    MenuItem,
    Paper,
    Tooltip,
    CircularProgress,
    Chip,
    Stack,
    Collapse,
    LinearProgress
} from '@mui/material';
import {
    MoreVert as MoreVertIcon,
    PlayArrow as PlayArrowIcon,
    Pause as PauseIcon,
    Schedule as ScheduleIcon,
    Timer as TimerIcon,
    PushPin as PushPinIcon,
    Download as DownloadIcon,
    EmojiEmotions as EmojiIcon,
    Reply as ReplyIcon,
    Edit as EditIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import EmojiPicker from './EmojiPicker';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow, formatDistance } from 'date-fns';

const MessageBubble = ({ message, isOwn }) => {
    const { socket } = useSocket();
    const { user } = useAuth();
    const [anchorEl, setAnchorEl] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [timeLeft, setTimeLeft] = useState(null);
    const audioRef = useRef(null);
    const progressInterval = useRef(null);

    useEffect(() => {
        if (message.expiresAt) {
            const updateTimeLeft = () => {
                const now = new Date();
                const expiry = new Date(message.expiresAt);
                if (now >= expiry) {
                    setTimeLeft('Expired');
                    clearInterval(progressInterval.current);
                } else {
                    setTimeLeft(formatDistance(expiry, now, { addSuffix: true }));
                }
            };
            updateTimeLeft();
            progressInterval.current = setInterval(updateTimeLeft, 1000);
        }

        return () => {
            if (progressInterval.current) {
                clearInterval(progressInterval.current);
            }
        };
    }, [message.expiresAt]);

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleReaction = (emoji) => {
        socket.emit('reaction', {
            messageId: message._id,
            emoji
        });
        setShowEmojiPicker(false);
    };

    const handlePin = () => {
        socket.emit('pin', {
            messageId: message._id,
            unpin: message.isPinned
        });
        handleMenuClose();
    };

    const handleReply = () => {
        // Implement reply functionality
        handleMenuClose();
    };

    const handleEdit = () => {
        // Implement edit functionality
        handleMenuClose();
    };

    const handleDelete = () => {
        // Implement delete functionality
        handleMenuClose();
    };

    const handlePlayVoice = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleDownload = () => {
        if (message.fileUrl) {
            window.open(message.fileUrl, '_blank');
        }
    };

    const renderContent = () => {
        switch (message.type) {
            case 'voice':
                return (
                    <Box>
                        <audio
                            ref={audioRef}
                            src={message.fileUrl}
                            onLoadedMetadata={() => setDuration(audioRef.current.duration)}
                            onTimeUpdate={() => setCurrentTime(audioRef.current.currentTime)}
                            onEnded={() => setIsPlaying(false)}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton onClick={handlePlayVoice}>
                                {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                            </IconButton>
                            <LinearProgress
                                variant="determinate"
                                value={(currentTime / duration) * 100}
                                sx={{ flexGrow: 1 }}
                            />
                            <Typography variant="caption">
                                {Math.floor(currentTime)}s / {Math.floor(duration)}s
                            </Typography>
                        </Box>
                    </Box>
                );

            case 'gif':
                return (
                    <Box
                        component="img"
                        src={message.content}
                        alt={message.metadata?.title || 'GIF'}
                        sx={{ maxWidth: 300, borderRadius: 1 }}
                    />
                );

            case 'file':
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography>{message.fileName}</Typography>
                        <IconButton onClick={handleDownload} size="small">
                            <DownloadIcon />
                        </IconButton>
                    </Box>
                );

            default:
                return <Typography>{message.content}</Typography>;
        }
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isOwn ? 'flex-end' : 'flex-start',
                mb: 1
            }}
        >
            <Paper
                elevation={1}
                sx={{
                    p: 1,
                    backgroundColor: isOwn ? 'primary.light' : 'background.paper',
                    maxWidth: '70%'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="caption" color="textSecondary">
                            {message.username}
                        </Typography>
                        {renderContent()}
                    </Box>
                    <IconButton size="small" onClick={handleMenuOpen}>
                        <MoreVertIcon fontSize="small" />
                    </IconButton>
                </Box>

                {/* Message metadata */}
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    {message.isPinned && (
                        <Tooltip title="Pinned">
                            <PushPinIcon fontSize="small" color="primary" />
                        </Tooltip>
                    )}
                    {message.scheduledFor && (
                        <Tooltip title={`Scheduled for ${new Date(message.scheduledFor).toLocaleString()}`}>
                            <ScheduleIcon fontSize="small" color="primary" />
                        </Tooltip>
                    )}
                    {timeLeft && (
                        <Tooltip title="Message will disappear">
                            <Chip
                                icon={<TimerIcon fontSize="small" />}
                                label={timeLeft}
                                size="small"
                                color="warning"
                            />
                        </Tooltip>
                    )}
                </Stack>

                {/* Reactions */}
                {message.reactions?.length > 0 && (
                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {message.reactions.map((reaction, index) => (
                            <Chip
                                key={index}
                                label={`${reaction.emoji} ${reaction.count}`}
                                size="small"
                                onClick={() => handleReaction(reaction.emoji)}
                            />
                        ))}
                    </Box>
                )}
            </Paper>

            {/* Message menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={() => setShowEmojiPicker(true)}>
                    <EmojiIcon fontSize="small" sx={{ mr: 1 }} /> React
                </MenuItem>
                <MenuItem onClick={handleReply}>
                    <ReplyIcon fontSize="small" sx={{ mr: 1 }} /> Reply
                </MenuItem>
                <MenuItem onClick={handlePin}>
                    <PushPinIcon fontSize="small" sx={{ mr: 1 }} />
                    {message.isPinned ? 'Unpin' : 'Pin'}
                </MenuItem>
                {isOwn && (
                    <>
                        <MenuItem onClick={handleEdit}>
                            <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit
                        </MenuItem>
                        <MenuItem onClick={handleDelete}>
                            <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
                        </MenuItem>
                    </>
                )}
            </Menu>

            {/* Emoji picker */}
            <Collapse in={showEmojiPicker}>
                <Paper sx={{ mt: 1, p: 1 }}>
                    <EmojiPicker onSelect={handleReaction} />
                </Paper>
            </Collapse>
        </Box>
    );
};

export default MessageBubble; 