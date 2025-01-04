import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
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
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': bubbleStyle === 'modern' ? {
                        content: '""',
                        position: 'absolute',
                        width: '20px',
                        height: '20px',
                        [isOwn ? 'right' : 'left']: '-10px',
                        bottom: '8px',
                        background: isOwn
                            ? `linear-gradient(145deg, ${messageColor}CC, ${messageColor}99)`
                            : 'rgba(19, 47, 76, 0.4)',
                        transform: isOwn ? 'rotate(-45deg)' : 'rotate(45deg)',
                        clipPath: 'polygon(0 0, 100% 100%, 100% 0)',
                        borderRadius: '4px'
                    } : {}
                }}
            >
                {!message.system && (
                    <Typography
                        variant="subtitle2"
                        sx={{
                            color: isOwn ? 'white' : 'primary.main',
                            mb: 0.5
                        }}
                    >
                        {isOwn ? 'You' : message.username}
                    </Typography>
                )}

                {message.type === 'gif' ? (
                    <Box
                        component={motion.div}
                        layoutId={`gif-${message.gif.url}`}
                        sx={{
                            position: 'relative',
                            width: '100%',
                            borderRadius: 1,
                            overflow: 'hidden',
                            '&::before': {
                                content: '""',
                                display: 'block',
                                paddingTop: `${(message.gif.height / message.gif.width) * 100}%`
                            }
                        }}
                    >
                        <motion.img
                            src={message.gif.url}
                            alt="GIF"
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                            }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                        />
                    </Box>
                ) : (
                    <Typography
                        variant="body1"
                        sx={{
                            color: isOwn ? 'white' : 'text.primary',
                            wordBreak: 'break-word'
                        }}
                    >
                        {message.text}
                    </Typography>
                )}

                <Typography
                    variant="caption"
                    sx={{
                        color: isOwn ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                        display: 'block',
                        textAlign: 'right',
                        mt: 0.5
                    }}
                >
                    {new Date(message.timestamp).toLocaleTimeString()}
                </Typography>
            </Paper>
        </motion.div>
    );
};

export default MessageBubble; 