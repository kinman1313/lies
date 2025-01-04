import React from 'react';
import {
    Box,
    Typography,
    IconButton,
    Collapse,
    Paper,
    Divider
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Reply as ReplyIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const MessageThread = ({
    parentMessage,
    replies = [],
    expanded,
    onToggle,
    onReply,
    children
}) => {
    const replyCount = replies.length;

    if (!parentMessage.replyTo && replyCount === 0) {
        return children;
    }

    return (
        <Box sx={{ mb: 2 }}>
            {parentMessage.replyTo && (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 1,
                        pl: 2
                    }}
                >
                    <ReplyIcon
                        fontSize="small"
                        sx={{ color: 'text.secondary', transform: 'scaleX(-1)' }}
                    />
                    <Typography
                        variant="caption"
                        sx={{
                            color: 'text.secondary',
                            fontStyle: 'italic'
                        }}
                    >
                        Replying to {parentMessage.replyTo.username}
                    </Typography>
                </Box>
            )}

            {children}

            {replyCount > 0 && (
                <>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mt: 1,
                            pl: 2
                        }}
                    >
                        <IconButton
                            size="small"
                            onClick={onToggle}
                            sx={{ p: 0.5 }}
                        >
                            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                        <Typography
                            variant="caption"
                            sx={{
                                color: 'text.secondary',
                                cursor: 'pointer'
                            }}
                            onClick={onToggle}
                        >
                            {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                        </Typography>
                    </Box>

                    <Collapse in={expanded}>
                        <Box
                            sx={{
                                pl: 4,
                                mt: 1,
                                borderLeft: '2px solid',
                                borderColor: 'divider'
                            }}
                        >
                            <AnimatePresence>
                                {replies.map((reply, index) => (
                                    <motion.div
                                        key={reply.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{
                                            type: 'spring',
                                            stiffness: 500,
                                            damping: 30,
                                            delay: index * 0.1
                                        }}
                                    >
                                        {reply}
                                        {index < replies.length - 1 && (
                                            <Divider sx={{ my: 1 }} />
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </Box>
                    </Collapse>
                </>
            )}
        </Box>
    );
};

export default MessageThread; 