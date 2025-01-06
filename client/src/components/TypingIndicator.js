import React from 'react';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';

const dotVariants = {
    initial: { y: 0 },
    animate: { y: -3 }
};

const TypingIndicator = ({ typingUsers }) => {
    if (!typingUsers || typingUsers.length === 0) return null;

    const text = typingUsers.length === 1
        ? `${typingUsers[0]} is typing`
        : typingUsers.length === 2
            ? `${typingUsers[0]} and ${typingUsers[1]} are typing`
            : `${typingUsers.length} people are typing`;

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1,
                position: 'absolute',
                bottom: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'background.paper',
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8,
                boxShadow: '0 -2px 4px rgba(0,0,0,0.1)',
                zIndex: 1
            }}
        >
            <Typography variant="caption" color="text.secondary">
                {text}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        variants={dotVariants}
                        initial="initial"
                        animate="animate"
                        transition={{
                            duration: 0.5,
                            repeat: Infinity,
                            repeatType: "reverse",
                            delay: i * 0.2
                        }}
                    >
                        <Box
                            sx={{
                                width: 4,
                                height: 4,
                                borderRadius: '50%',
                                backgroundColor: 'text.secondary'
                            }}
                        />
                    </motion.div>
                ))}
            </Box>
        </Box>
    );
};

export default TypingIndicator; 