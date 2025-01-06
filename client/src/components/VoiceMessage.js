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

const VoiceMessage = ({ onSend, maxDuration = 300, onClose }) => {
    const [isRecording, setIsRecording] = useState(false);
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
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';
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

            mediaRecorderRef.current.start();
            startTimeRef.current = Date.now();
            setIsRecording(true);

            const updateDuration = () => {
                if (isRecording) {
                    const elapsed = (Date.now() - startTimeRef.current) / 1000;
                    setDuration(elapsed);
                    if (elapsed < maxDuration) {
                        animationFrameRef.current = requestAnimationFrame(updateDuration);
                    } else {
                        stopRecording();
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
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        }
    };

    const togglePlayback = () => {
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play();
            setIsPlaying(true);
        }
    };

    const handleSend = () => {
        if (audioUrl) {
            onSend(audioUrl, duration);
        }
    };

    useEffect(() => {
        const audio = audioRef.current;

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
        };
    }, []);

    return (
        <Box sx={{ width: '100%' }}>
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                >
                    <Paper
                        elevation={3}
                        sx={{
                            p: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            alignItems: 'center'
                        }}
                    >
                        <Typography variant="h6" gutterBottom>
                            Voice Message
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            {!isRecording && !audioUrl && (
                                <Tooltip title="Start Recording">
                                    <IconButton
                                        color="primary"
                                        onClick={startRecording}
                                        sx={{ width: 56, height: 56 }}
                                    >
                                        <MicIcon />
                                    </IconButton>
                                </Tooltip>
                            )}

                            {isRecording && (
                                <Tooltip title="Stop Recording">
                                    <IconButton
                                        color="error"
                                        onClick={stopRecording}
                                        sx={{ width: 56, height: 56 }}
                                    >
                                        <StopIcon />
                                    </IconButton>
                                </Tooltip>
                            )}

                            {audioUrl && (
                                <>
                                    <IconButton onClick={togglePlayback}>
                                        {isPlaying ? <PauseIcon /> : <PlayIcon />}
                                    </IconButton>
                                    <Box sx={{ width: 200 }}>
                                        <Slider
                                            value={currentTime}
                                            max={duration}
                                            onChange={(_, value) => {
                                                audioRef.current.currentTime = value;
                                                setCurrentTime(value);
                                            }}
                                            size="small"
                                        />
                                    </Box>
                                    <Typography variant="caption">
                                        {formatTime(currentTime)} / {formatTime(duration)}
                                    </Typography>
                                    <IconButton color="error" onClick={() => {
                                        setAudioUrl(null);
                                        setDuration(0);
                                        setCurrentTime(0);
                                    }}>
                                        <DeleteIcon />
                                    </IconButton>
                                    <IconButton color="primary" onClick={handleSend}>
                                        <SendIcon />
                                    </IconButton>
                                </>
                            )}
                        </Box>

                        {isRecording && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CircularProgress
                                    variant="determinate"
                                    value={(duration / maxDuration) * 100}
                                    size={24}
                                />
                                <Typography variant="body2">
                                    {formatTime(duration)} / {formatTime(maxDuration)}
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </motion.div>
            </AnimatePresence>
        </Box>
    );
};

export default VoiceMessage; 