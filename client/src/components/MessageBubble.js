import React, { useState, useRef } from 'react';
import { Paper, Typography, Box, IconButton, Slider } from '@mui/material';
import { PlayArrow as PlayIcon, Pause as PauseIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

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
    const bubbleStyle = user.preferences?.bubbleStyle || 'modern';
    const messageColor = user.preferences?.messageColor || '#7C4DFF';
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
                marginBottom: '8px'
            }}
        >
            <Paper
                elevation={bubbleStyle === 'minimal' ? 0 : 2}
                sx={{
                    ...bubbleVariants[bubbleStyle],
                    background: isOwn
                        ? `linear-gradient(145deg, ${messageColor}CC, ${messageColor}99)`
                        : 'rgba(19, 47, 76, 0.4)',
                    color: isOwn ? '#fff' : 'inherit',
                    overflow: 'hidden'
                }}
            >
                {message.type === 'gif' ? (
                    <Box
                        sx={{
                            position: 'relative',
                            width: '100%',
                            '&:hover': {
                                '& .gif-overlay': {
                                    opacity: 1
                                }
                            }
                        }}
                    >
                        <Box
                            component="img"
                            src={message.content}
                            alt="GIF"
                            loading="lazy"
                            sx={{
                                width: '100%',
                                height: 'auto',
                                maxHeight: '300px',
                                objectFit: 'contain',
                                borderRadius: bubbleStyle === 'modern' ? '12px' : '4px',
                                display: 'block'
                            }}
                        />
                        <Box
                            className="gif-overlay"
                            sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'rgba(0,0,0,0.3)',
                                opacity: 0,
                                transition: 'opacity 0.2s ease-in-out',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: bubbleStyle === 'modern' ? '12px' : '4px'
                            }}
                        >
                            <Typography
                                variant="caption"
                                sx={{
                                    color: 'white',
                                    backgroundColor: 'rgba(0,0,0,0.5)',
                                    padding: '4px 8px',
                                    borderRadius: '4px'
                                }}
                            >
                                GIF
                            </Typography>
                        </Box>
                    </Box>
                ) : message.type === 'voice' ? (
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        minWidth: 250,
                        p: 1,
                        borderRadius: bubbleStyle === 'modern' ? '12px' : '4px',
                        background: isOwn ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                    }}>
                        <IconButton
                            size="small"
                            onClick={handlePlayPause}
                            sx={{
                                color: isOwn ? 'white' : 'inherit',
                                '&:hover': {
                                    background: isOwn ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'
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
                                    color: isOwn ? 'white' : 'primary.main',
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
                                color: isOwn ? 'rgba(255, 255, 255, 0.8)' : 'inherit'
                            }}
                        >
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </Typography>
                    </Box>
                ) : (
                    <Typography variant="body1">
                        {message.content}
                    </Typography>
                )}
            </Paper>
        </motion.div>
    );
};

export default MessageBubble; 