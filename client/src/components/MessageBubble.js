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
    LinearProgress,
    ListItemIcon,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Select,
    FormControl,
    InputLabel
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
    Delete as DeleteIcon,
    Timelapse as TimelapseIcon
} from '@mui/icons-material';
import EmojiPicker from './EmojiPicker';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow, formatDistance } from 'date-fns';
import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

const EXPIRY_OPTIONS = [
    { value: 5 * 60 * 1000, label: '5 minutes' },
    { value: 15 * 60 * 1000, label: '15 minutes' },
    { value: 30 * 60 * 1000, label: '30 minutes' },
    { value: 60 * 60 * 1000, label: '1 hour' },
    { value: 24 * 60 * 60 * 1000, label: '24 hours' },
    { value: 7 * 24 * 60 * 60 * 1000, label: '7 days' }
];

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
    const theme = useTheme();
    const [expiryDialogOpen, setExpiryDialogOpen] = useState(false);
    const [selectedExpiry, setSelectedExpiry] = useState(EXPIRY_OPTIONS[0].value);

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

    const handleSetExpiry = () => {
        socket.emit('setMessageExpiry', {
            messageId: message._id,
            expiryTime: selectedExpiry
        });
        setExpiryDialogOpen(false);
        handleMenuClose();
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
                    p: 2,
                    backgroundColor: isOwn ? message.user?.preferences?.messageColor || theme.palette.primary.main : 'background.paper',
                    backgroundImage: isOwn ? `linear-gradient(135deg, ${message.user?.preferences?.messageColor || theme.palette.primary.main} 0%, ${message.user?.preferences?.messageColor ? alpha(message.user?.preferences?.messageColor, 0.8) : theme.palette.primary.light} 100%)` : 'none',
                    color: isOwn ? '#fff' : 'text.primary',
                    maxWidth: '70%',
                    borderRadius: '16px',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid',
                    borderColor: isOwn ? 'transparent' : 'rgba(255, 255, 255, 0.1)',
                    boxShadow: isOwn ? `0 4px 20px ${alpha(message.user?.preferences?.messageColor || theme.palette.primary.main, 0.3)}` : '0 4px 20px rgba(0, 0, 0, 0.1)'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography
                            variant="caption"
                            sx={{
                                color: isOwn ? 'rgba(255, 255, 255, 0.8)' : 'text.secondary',
                                fontWeight: 500
                            }}
                        >
                            {message.username}
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                            {renderContent()}
                        </Box>
                        <Typography
                            variant="caption"
                            sx={{
                                display: 'block',
                                mt: 1,
                                color: isOwn ? 'rgba(255, 255, 255, 0.6)' : 'text.secondary'
                            }}
                        >
                            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                        </Typography>
                    </Box>
                    <IconButton
                        size="small"
                        onClick={handleMenuOpen}
                        sx={{
                            color: isOwn ? 'rgba(255, 255, 255, 0.8)' : 'text.secondary',
                            '&:hover': {
                                backgroundColor: isOwn ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                            }
                        }}
                    >
                        <MoreVertIcon fontSize="small" />
                    </IconButton>
                </Box>

                {/* Message metadata */}
                <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                        mt: 1,
                        color: isOwn ? 'rgba(255, 255, 255, 0.8)' : 'text.secondary'
                    }}
                >
                    {message.isPinned && (
                        <Tooltip title="Pinned">
                            <PushPinIcon fontSize="small" />
                        </Tooltip>
                    )}
                    {message.scheduledFor && (
                        <Tooltip title={`Scheduled for ${new Date(message.scheduledFor).toLocaleString()}`}>
                            <ScheduleIcon fontSize="small" />
                        </Tooltip>
                    )}
                    {timeLeft && (
                        <Tooltip title="Message will disappear">
                            <Chip
                                icon={<TimerIcon fontSize="small" />}
                                label={timeLeft}
                                size="small"
                                variant="outlined"
                                sx={{
                                    borderColor: isOwn ? 'rgba(255, 255, 255, 0.2)' : 'inherit',
                                    color: 'inherit'
                                }}
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
                                sx={{
                                    borderColor: isOwn ? 'rgba(255, 255, 255, 0.2)' : 'inherit',
                                    color: 'inherit',
                                    '&:hover': {
                                        backgroundColor: isOwn ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                                    }
                                }}
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
                PaperProps={{
                    sx: {
                        backgroundColor: 'rgba(19, 47, 76, 0.95)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
                    }
                }}
            >
                <MenuItem onClick={() => setShowEmojiPicker(true)}>
                    <ListItemIcon>
                        <EmojiIcon fontSize="small" />
                    </ListItemIcon>
                    Add Reaction
                </MenuItem>
                <MenuItem onClick={handlePin}>
                    <ListItemIcon>
                        <PushPinIcon fontSize="small" />
                    </ListItemIcon>
                    {message.isPinned ? 'Unpin' : 'Pin'}
                </MenuItem>
                <MenuItem onClick={handleReply}>
                    <ListItemIcon>
                        <ReplyIcon fontSize="small" />
                    </ListItemIcon>
                    Reply
                </MenuItem>
                {isOwn && (
                    <>
                        <MenuItem onClick={handleEdit}>
                            <ListItemIcon>
                                <EditIcon fontSize="small" />
                            </ListItemIcon>
                            Edit
                        </MenuItem>
                        <MenuItem onClick={() => setExpiryDialogOpen(true)}>
                            <ListItemIcon>
                                <TimelapseIcon fontSize="small" />
                            </ListItemIcon>
                            Set Expiry Time
                        </MenuItem>
                        <MenuItem onClick={handleDelete}>
                            <ListItemIcon>
                                <DeleteIcon fontSize="small" />
                            </ListItemIcon>
                            Delete
                        </MenuItem>
                    </>
                )}
            </Menu>

            {/* Expiry Dialog */}
            <Dialog
                open={expiryDialogOpen}
                onClose={() => setExpiryDialogOpen(false)}
                PaperProps={{
                    sx: {
                        backgroundColor: 'rgba(19, 47, 76, 0.95)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '16px',
                        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
                    }
                }}
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TimelapseIcon />
                        Set Message Expiry Time
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                        Choose when this message should disappear:
                    </Typography>
                    <FormControl fullWidth>
                        <InputLabel>Expiry Time</InputLabel>
                        <Select
                            value={selectedExpiry}
                            onChange={(e) => setSelectedExpiry(e.target.value)}
                            label="Expiry Time"
                            sx={{
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255, 255, 255, 0.1)'
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255, 255, 255, 0.2)'
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: theme.palette.primary.main
                                }
                            }}
                        >
                            {EXPIRY_OPTIONS.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setExpiryDialogOpen(false)}
                        sx={{
                            color: 'text.secondary',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.05)'
                            }
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSetExpiry}
                        variant="contained"
                        sx={{
                            background: theme.palette.primary.gradient,
                            '&:hover': {
                                background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.secondary.light} 100%)`,
                            }
                        }}
                    >
                        Set Expiry
                    </Button>
                </DialogActions>
            </Dialog>

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