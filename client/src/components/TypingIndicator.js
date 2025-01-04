import React from 'react';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';

const TypingDot = () => (
    <motion.div
        style={{
            width: 4,
            height: 4,
            backgroundColor: 'currentColor',
            borderRadius: '50%',
            margin: '0 2px'
        }}
        animate={{
            y: [0, -3, 0]
        }}
        transition={{
            duration: 0.6,
            repeat: Infinity,
            repeatType: 'reverse'
        }}
    />
);

const TypingIndicator = ({ typingUsers = [] }) => {
    if (typingUsers.length === 0) return null;

    const text = typingUsers.length === 1
        ? `${typingUsers[0]} is typing...`
        : typingUsers.length === 2
            ? `${typingUsers[0]} and ${typingUsers[1]} are typing...`
            : `${typingUsers.length} people are typing...`;

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1,
                color: 'text.secondary'
            }}
        >
            <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                {text}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TypingDot />
                <TypingDot />
                <TypingDot />
            </Box>
        </Box>
    );
};

export default TypingIndicator; 