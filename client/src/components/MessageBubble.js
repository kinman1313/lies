import React, { useState, useRef } from 'react';
import { Paper, Typography, Box, IconButton, Slider, Menu, MenuItem, TextField } from '@mui/material';
import {
    PlayArrow as PlayIcon,
    Pause as PauseIcon,
    MoreVert as MoreVertIcon,
    PushPin as PinIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Check as CheckIcon,
    Close as CloseIcon,
    Download as DownloadIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { format } from 'date-fns';

const bubbleVariants = {
    modern: {
        borderRadius: '18px',
        padding: '10px 16px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
    },
    classic: {
        borderRadius: '4px',
        padding: '8px 12px'
    },
    minimal: {
        borderRadius: '0px',
        padding: '6px 10px',
        boxShadow: 'none'
    }
};

const MessageBubble = ({ message, isOwn }) => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const bubbleStyle = user.preferences?.bubbleStyle || 'modern';
    const messageColor = user.preferences?.messageColor || '#7C4DFF';
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [anchorEl, setAnchorEl] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(message.content);
    const audioRef = useRef(new Audio());

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handlePlayPause = () => {
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            if (message.type === 'voice') {
                audioRef.current.src = message.content;
                audioRef.current.play().catch(error => {
                    console.error('Error playing audio:', error);
                });
                setIsPlaying(true);
            }
        }
    };

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handlePin = () => {
        socket.emit('pin', { messageId: message._id });
        handleMenuClose();
    };

    const handleUnpin = () => {
        socket.emit('unpin', { messageId: message._id });
        handleMenuClose();
    };

    const handleEdit = () => {
        setIsEditing(true);
        handleMenuClose();
    };

    const handleDelete = () => {
        socket.emit('delete', { messageId: message._id });
        handleMenuClose();
    };

    const handleSaveEdit = () => {
        socket.emit('edit', { messageId: message._id, content: editContent });
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditContent(message.content);
        setIsEditing(false);
    };

    const handleDownload = () => {
        if (message.type === 'file') {
            window.open(message.fileUrl, '_blank');
        }
    };

    React.useEffect(() => {
        if (message.type === 'voice') {
            audioRef.current.src = message.content;

            const handleLoadedMetadata = () => {
                setDuration(audioRef.current.duration);
            };

            const handleTimeUpdate = () => {
                setCurrentTime(audioRef.current.currentTime);
            };

            const handleEnded = () => {
                setIsPlaying(false);
                setCurrentTime(0);
            };

            audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
            audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
            audioRef.current.addEventListener('ended', handleEnded);

            return () => {
                audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
                audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
                audioRef.current.removeEventListener('ended', handleEnded);
                audioRef.current.pause();
                audioRef.current.src = '';
            };
        }
    }, [message.content, message.type]);

    React.useEffect(() => {
        // Mark message as read when it becomes visible
        if (!isOwn && !message.readBy?.some(read => read.user === user._id)) {
            socket.emit('markRead', { messageId: message._id });
        }
    }, [message._id, isOwn, user._id, message.readBy]);

    const renderContent = () => {
        if (message.isDeleted) {
            return (
                <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                    This message has been deleted
                </Typography>
            );
        }

        if (isEditing) {
            return (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <TextField
                        fullWidth
                        multiline
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        variant="outlined"
                        size="small"
                    />
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <IconButton size="small" onClick={handleSaveEdit}>
                            <CheckIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={handleCancelEdit}>
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </Box>
            );
        }

        switch (message.type) {
            case 'text':
                return <Typography>{message.content}</Typography>;
            case 'gif':
                return <img src={message.content} alt="GIF" style={{ maxWidth: '100%', borderRadius: '8px' }} />;
            case 'voice':
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <IconButton onClick={handlePlayPause} size="small">
                            {isPlaying ? <PauseIcon /> : <PlayIcon />}
                        </IconButton>
                        <Slider
                            size="small"
                            value={currentTime}
                            max={duration}
                            onChange={(_, value) => {
                                audioRef.current.currentTime = value;
                            }}
                            sx={{ flexGrow: 1 }}
                        />
                        <Typography variant="caption">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </Typography>
                    </Box>
                );
            case 'file':
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography>{message.fileName}</Typography>
                        <IconButton size="small" onClick={handleDownload}>
                            <DownloadIcon fontSize="small" />
                        </IconButton>
                    </Box>
                );
            default:
                return null;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
                type: "spring",
                stiffness: 260,
                damping: 20
            }}
            style={{
                alignSelf: isOwn ? 'flex-end' : 'flex-start',
                maxWidth: message.type === 'gif' ? '300px' : '70%',
                marginBottom: '8px',
                position: 'relative'
            }}
        >
            <Paper
                elevation={1}
                sx={{
                    ...bubbleVariants[bubbleStyle],
                    backgroundColor: isOwn ? messageColor : 'background.paper',
                    color: isOwn ? 'white' : 'text.primary',
                    position: 'relative'
                }}
            >
                {message.isPinned && (
                    <PinIcon
                        sx={{
                            position: 'absolute',
                            top: -12,
                            right: -12,
                            transform: 'rotate(45deg)',
                            color: 'primary.main',
                            fontSize: 20
                        }}
                    />
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
                        {message.username}
                    </Typography>
                    <IconButton size="small" onClick={handleMenuOpen}>
                        <MoreVertIcon fontSize="small" />
                    </IconButton>
                </Box>

                {renderContent()}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                    <Typography variant="caption" sx={{ color: isOwn ? 'rgba(255,255,255,0.7)' : 'text.secondary' }}>
                        {format(new Date(message.createdAt), 'HH:mm')}
                        {message.isEdited && ' (edited)'}
                    </Typography>
                    {!isOwn && message.readBy?.length > 0 && (
                        <Typography variant="caption" sx={{ color: isOwn ? 'rgba(255,255,255,0.7)' : 'text.secondary' }}>
                            Read by {message.readBy.length}
                        </Typography>
                    )}
                </Box>
            </Paper>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
            >
                {message.isPinned ? (
                    <MenuItem onClick={handleUnpin}>
                        <PinIcon sx={{ mr: 1 }} /> Unpin Message
                    </MenuItem>
                ) : (
                    <MenuItem onClick={handlePin}>
                        <PinIcon sx={{ mr: 1 }} /> Pin Message
                    </MenuItem>
                )}
                {isOwn && !message.isDeleted && (
                    <>
                        <MenuItem onClick={handleEdit}>
                            <EditIcon sx={{ mr: 1 }} /> Edit Message
                        </MenuItem>
                        <MenuItem onClick={handleDelete}>
                            <DeleteIcon sx={{ mr: 1 }} /> Delete Message
                        </MenuItem>
                    </>
                )}
                {message.type === 'file' && (
                    <MenuItem onClick={handleDownload}>
                        <DownloadIcon sx={{ mr: 1 }} /> Download File
                    </MenuItem>
                )}
            </Menu>
        </motion.div>
    );
};

export default MessageBubble; 