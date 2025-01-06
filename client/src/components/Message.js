import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Avatar,
    IconButton,
    Slider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import PlayIcon from '@mui/icons-material/PlayCircleOutline';
import PauseIcon from '@mui/icons-material/PauseCircleOutline';

const MessageBubble = styled(Paper)(({ theme, isCurrentUser }) => ({
    padding: theme.spacing(1.5),
    maxWidth: '70%',
    borderRadius: isCurrentUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
    backgroundColor: isCurrentUser ? theme.palette.primary.main : theme.palette.background.paper,
    color: isCurrentUser ? theme.palette.primary.contrastText : theme.palette.text.primary,
    boxShadow: theme.shadows[2],
    position: 'relative',
    '&::after': {
        content: '""',
        position: 'absolute',
        bottom: 0,
        [isCurrentUser ? 'right' : 'left']: -8,
        width: 0,
        height: 0,
        borderStyle: 'solid',
        borderWidth: isCurrentUser ? '0 0 8px 8px' : '8px 8px 0 0',
        borderColor: isCurrentUser
            ? `transparent transparent transparent ${theme.palette.primary.main}`
            : `transparent ${theme.palette.background.paper} transparent transparent`
    }
}));

const Message = ({ message, isCurrentUser }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
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
        } else if (message.type === 'voice') {
            audioRef.current.src = message.content;
            audioRef.current.play().catch(error => {
                console.error('Error playing audio:', error);
            });
            setIsPlaying(true);
        }
    };

    useEffect(() => {
        if (message.type === 'voice') {
            const audio = audioRef.current;
            audio.src = message.content;

            const handleLoadedMetadata = () => {
                setDuration(audio.duration);
            };

            const handleTimeUpdate = () => {
                setCurrentTime(audio.currentTime);
            };

            const handleEnded = () => {
                setIsPlaying(false);
                setCurrentTime(0);
            };

            audio.addEventListener('loadedmetadata', handleLoadedMetadata);
            audio.addEventListener('timeupdate', handleTimeUpdate);
            audio.addEventListener('ended', handleEnded);

            return () => {
                audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
                audio.removeEventListener('timeupdate', handleTimeUpdate);
                audio.removeEventListener('ended', handleEnded);
                audio.pause();
                audio.src = '';
            };
        }
    }, [message.content, message.type]);

    const renderContent = () => {
        switch (message.type) {
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
                            borderRadius: 1,
                            mt: message.text ? 1 : 0
                        }}
                    />
                );
            case 'voice':
                return (
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        minWidth: 250,
                        p: 1,
                        borderRadius: 1,
                        background: isCurrentUser ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                    }}>
                        <IconButton
                            size="small"
                            onClick={handlePlayPause}
                            sx={{
                                color: isCurrentUser ? 'white' : 'inherit',
                                '&:hover': {
                                    background: isCurrentUser ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'
                                }
                            }}
                        >
                            {isPlaying ? <PauseIcon /> : <PlayIcon />}
                        </IconButton>
                        <Box sx={{ flexGrow: 1, mx: 1 }}>
                            <Slider
                                size="small"
                                value={currentTime}
                                max={duration || 0}
                                onChange={(_, value) => {
                                    audioRef.current.currentTime = value;
                                    setCurrentTime(value);
                                }}
                                sx={{
                                    color: isCurrentUser ? 'white' : 'primary.main',
                                    '& .MuiSlider-thumb': {
                                        width: 12,
                                        height: 12,
                                    },
                                    '& .MuiSlider-rail': {
                                        opacity: 0.3,
                                    }
                                }}
                            />
                        </Box>
                        <Typography
                            variant="caption"
                            sx={{
                                minWidth: 45,
                                color: isCurrentUser ? 'rgba(255, 255, 255, 0.8)' : 'inherit'
                            }}
                        >
                            {formatTime(currentTime)} / {formatTime(duration)}
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
        <Box
            sx={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 1,
                mb: 2,
                flexDirection: isCurrentUser ? 'row-reverse' : 'row'
            }}
        >
            <Avatar
                src={message.avatar}
                sx={{
                    width: 32,
                    height: 32,
                    bgcolor: isCurrentUser ? 'primary.main' : 'secondary.main'
                }}
            >
                {message.username?.[0]?.toUpperCase()}
            </Avatar>
            <Box sx={{ maxWidth: '70%' }}>
                {!isCurrentUser && (
                    <Typography
                        variant="caption"
                        sx={{
                            ml: 1.5,
                            mb: 0.5,
                            display: 'block',
                            color: 'text.secondary'
                        }}
                    >
                        {message.username}
                    </Typography>
                )}
                <MessageBubble isCurrentUser={isCurrentUser}>
                    {renderContent()}
                </MessageBubble>
            </Box>
        </Box>
    );
};

export default Message; 