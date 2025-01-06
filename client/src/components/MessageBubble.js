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
                    color: isOwn ? '#fff' : 'inherit',
                    overflow: 'hidden'
                }}
            >
                {message.text?.startsWith('[GIF]') ? (
                    <Box
                        component="img"
                        src={message.text.replace('[GIF] ', '')}
                        alt="GIF"
                        sx={{
                            width: '100%',
                            height: 'auto',
                            maxHeight: '200px',
                            objectFit: 'cover',
                            borderRadius: bubbleStyle === 'modern' ? '12px' : '4px'
                        }}
                    />
                ) : (
                    <Typography variant="body1">
                        {message.text}
                    </Typography>
                )}
            </Paper>
        </motion.div>
    );
};

export default MessageBubble; 