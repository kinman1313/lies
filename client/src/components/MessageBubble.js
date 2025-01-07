import React, { useState, useRef } from 'react';
import {
    Box,
    Typography,
    IconButton,
    Paper,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Avatar,
    useTheme
} from '@mui/material';
import {
    MoreVert as MoreVertIcon,
    Reply as ReplyIcon,
    Delete as DeleteIcon,
    ContentCopy as CopyIcon,
    PlayArrow as PlayArrowIcon,
    Pause as PauseIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

const MessageBubble = ({ message, isOwn }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);
    const theme = useTheme();

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(message.content);
        handleMenuClose();
    };

    const handleReply = () => {
        // Implement reply functionality
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

    const renderContent = () => {
        switch (message.type) {
            case 'voice':
                return (
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        minWidth: 200
                    }}>
                        <IconButton size="small" onClick={handlePlayVoice}>
                            {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                        </IconButton>
                        <audio ref={audioRef} src={message.content} onEnded={() => setIsPlaying(false)} />
                        <Typography variant="caption">
                            {message.metadata?.duration}s
                        </Typography>
                    </Box>
                );
            case 'gif':
                return (
                    <Box
                        component="img"
                        src={message.content}
                        alt="GIF"
                        sx={{
                            maxWidth: '300px',
                            width: '100%',
                            height: 'auto',
                            borderRadius: 1
                        }}
                    />
                );
            case 'file':
                return (
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        p: 1,
                        bgcolor: 'rgba(0, 0, 0, 0.04)',
                        borderRadius: 1
                    }}>
                        <Typography variant="body2">
                            📎 {message.metadata?.fileName}
                        </Typography>
                    </Box>
                );
            default:
                return (
                    <Typography variant="body1">
                        {message.content}
                    </Typography>
                );
        }
    };

    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1,
            flexDirection: isOwn ? 'row-reverse' : 'row'
        }}>
            <Avatar
                src={message.avatar}
                sx={{ width: 32, height: 32 }}
            >
                {message.username?.[0]?.toUpperCase()}
            </Avatar>

            <Paper
                elevation={1}
                sx={{
                    maxWidth: '70%',
                    p: 2,
                    bgcolor: isOwn ? theme.palette.primary.main : 'background.paper',
                    color: isOwn ? 'white' : 'text.primary',
                    borderRadius: '16px',
                    position: 'relative',
                    ...(message.status === 'sending' && {
                        opacity: 0.7
                    }),
                    ...(message.status === 'failed' && {
                        bgcolor: 'error.main',
                        color: 'white'
                    })
                }}
            >
                {!isOwn && (
                    <Typography
                        variant="caption"
                        sx={{
                            color: isOwn ? 'inherit' : 'text.secondary',
                            mb: 0.5,
                            display: 'block'
                        }}
                    >
                        {message.username}
                    </Typography>
                )}

                {renderContent()}

                <Typography
                    variant="caption"
                    sx={{
                        color: isOwn ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary',
                        mt: 0.5,
                        display: 'block',
                        textAlign: 'right'
                    }}
                >
                    {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                    {message.status === 'failed' && ' • Failed to send'}
                </Typography>

                <IconButton
                    size="small"
                    onClick={handleMenuOpen}
                    sx={{
                        position: 'absolute',
                        top: 8,
                        [isOwn ? 'left' : 'right']: 8,
                        color: isOwn ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary'
                    }}
                >
                    <MoreVertIcon fontSize="small" />
                </IconButton>
            </Paper>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: isOwn ? 'left' : 'right'
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: isOwn ? 'left' : 'right'
                }}
            >
                <MenuItem onClick={handleReply}>
                    <ListItemIcon>
                        <ReplyIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Reply</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleCopy}>
                    <ListItemIcon>
                        <CopyIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Copy</ListItemText>
                </MenuItem>
                {isOwn && (
                    <MenuItem onClick={handleDelete}>
                        <ListItemIcon>
                            <DeleteIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Delete</ListItemText>
                    </MenuItem>
                )}
            </Menu>
        </Box>
    );
};

export default MessageBubble; 