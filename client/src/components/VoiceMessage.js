import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    IconButton,
    Typography,
    Paper,
    Slider,
    CircularProgress,
    Tooltip
} from '@mui/material';
import {
    Mic as MicIcon,
    Stop as StopIcon,
    PlayArrow as PlayIcon,
    Pause as PauseIcon,
    Delete as DeleteIcon,
    Send as SendIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const VoiceMessage = ({ onSend, maxDuration = 300 }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [duration, setDuration] = useState(0);
    const [audioUrl, setAudioUrl] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const audioRef = useRef(new Audio());
    const animationFrameRef = useRef();
    const startTimeRef = useRef(0);

    useEffect(() => {
        return () => {
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [audioUrl]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                const url = URL.createObjectURL(audioBlob);
                setAudioUrl(url);
                audioRef.current.src = url;
            };

            mediaRecorderRef.current.start(10);
            setIsRecording(true);
            startTimeRef.current = Date.now();

            const updateDuration = () => {
                if (isRecording && !isPaused) {
                    const currentDuration = (Date.now() - startTimeRef.current) / 1000;
                    setDuration(currentDuration);

                    if (currentDuration >= maxDuration) {
                        stopRecording();
                    } else {
                        animationFrameRef.current = requestAnimationFrame(updateDuration);
                    }
                }
            };

            updateDuration();
        } catch (error) {
            console.error('Error accessing microphone:', error);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
            setIsPaused(false);
        }
    };

    const togglePause = () => {
        if (isRecording) {
            if (isPaused) {
                mediaRecorderRef.current.resume();
                startTimeRef.current = Date.now() - (duration * 1000);
            } else {
                mediaRecorderRef.current.pause();
            }
            setIsPaused(!isPaused);
        }
    };

    const handlePlayPause = () => {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        setCurrentTime(audioRef.current.currentTime);
    };

    const handleSliderChange = (event, newValue) => {
        const time = (newValue / 100) * audioRef.current.duration;
        audioRef.current.currentTime = time;
        setCurrentTime(time);
    };

    useEffect(() => {
        const audio = audioRef.current;
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', () => setIsPlaying(false));

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', () => setIsPlaying(false));
        };
    }, []);

    const handleSend = () => {
        if (audioUrl) {
            onSend(audioUrl);
            setAudioUrl(null);
            setDuration(0);
            setCurrentTime(0);
        }
    };

    const handleDelete = () => {
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
            setAudioUrl(null);
            setDuration(0);
            setCurrentTime(0);
        }
    };

    return (
        <Box>
            <Paper
                variant="outlined"
                sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    bgcolor: 'background.paper'
                }}
            >
                <AnimatePresence mode="wait">
                    {!isRecording && !audioUrl && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                        >
                            <Tooltip title="Record Voice Message">
                                <IconButton
                                    color="primary"
                                    onClick={startRecording}
                                    sx={{
                                        width: 48,
                                        height: 48,
                                        '&:hover': {
                                            backgroundColor: 'primary.dark'
                                        }
                                    }}
                                >
                                    <MicIcon />
                                </IconButton>
                            </Tooltip>
                        </motion.div>
                    )}

                    {isRecording && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{ display: 'flex', alignItems: 'center', gap: 16 }}
                        >
                            <Box sx={{ position: 'relative' }}>
                                <CircularProgress
                                    variant="determinate"
                                    value={(duration / maxDuration) * 100}
                                    size={48}
                                />
                                <IconButton
                                    color="error"
                                    onClick={stopRecording}
                                    sx={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)'
                                    }}
                                >
                                    <StopIcon />
                                </IconButton>
                            </Box>
                            <Typography variant="body2">
                                {formatTime(duration)}
                            </Typography>
                            <IconButton onClick={togglePause}>
                                {isPaused ? <PlayIcon /> : <PauseIcon />}
                            </IconButton>
                        </motion.div>
                    )}

                    {audioUrl && !isRecording && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%' }}
                        >
                            <IconButton onClick={handlePlayPause}>
                                {isPlaying ? <PauseIcon /> : <PlayIcon />}
                            </IconButton>
                            <Box sx={{ flexGrow: 1, mx: 2 }}>
                                <Slider
                                    value={(currentTime / audioRef.current.duration) * 100 || 0}
                                    onChange={handleSliderChange}
                                    sx={{
                                        color: 'primary.main',
                                        '& .MuiSlider-thumb': {
                                            width: 12,
                                            height: 12
                                        }
                                    }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                    {formatTime(currentTime)} / {formatTime(audioRef.current.duration || 0)}
                                </Typography>
                            </Box>
                            <IconButton color="error" onClick={handleDelete}>
                                <DeleteIcon />
                            </IconButton>
                            <IconButton color="primary" onClick={handleSend}>
                                <SendIcon />
                            </IconButton>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Paper>
        </Box>
    );
};

export default VoiceMessage; 