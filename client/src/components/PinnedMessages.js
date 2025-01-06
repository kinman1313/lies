import React from 'react';
import {
    Box,
    Typography,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Collapse,
    Paper
} from '@mui/material';
import {
    PushPin as PinIcon,
    KeyboardArrowDown as ExpandIcon,
    KeyboardArrowUp as CollapseIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useSocket } from '../contexts/SocketContext';

const PinnedMessages = ({ messages, roomId }) => {
    const [expanded, setExpanded] = React.useState(true);
    const { socket } = useSocket();

    const handleUnpin = (messageId) => {
        socket.emit('unpin', { messageId });
    };

    const renderMessageContent = (message) => {
        switch (message.type) {
            case 'text':
                return message.content;
            case 'gif':
                return '[GIF]';
            case 'voice':
                return '[Voice Message]';
            case 'file':
                return `[File: ${message.fileName}]`;
            default:
                return '';
        }
    };

    if (!messages || messages.length === 0) return null;

    return (
        <Paper
            elevation={1}
            sx={{
                position: 'sticky',
                top: 0,
                zIndex: 2,
                backgroundColor: 'background.paper',
                borderRadius: 2,
                mb: 2
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 1,
                    borderBottom: expanded ? 1 : 0,
                    borderColor: 'divider',
                    cursor: 'pointer'
                }}
                onClick={() => setExpanded(!expanded)}
            >
                <PinIcon sx={{ mr: 1 }} />
                <Typography variant="subtitle2">
                    Pinned Messages ({messages.length})
                </Typography>
                <IconButton size="small" sx={{ ml: 'auto' }}>
                    {expanded ? <CollapseIcon /> : <ExpandIcon />}
                </IconButton>
            </Box>

            <Collapse in={expanded}>
                <List dense>
                    <AnimatePresence>
                        {messages.map((message) => (
                            <motion.div
                                key={message._id}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ListItem>
                                    <ListItemText
                                        primary={
                                            <Typography variant="body2" noWrap>
                                                {renderMessageContent(message)}
                                            </Typography>
                                        }
                                        secondary={
                                            <Typography variant="caption" color="text.secondary">
                                                {message.username} • {format(new Date(message.createdAt), 'MMM d, HH:mm')}
                                            </Typography>
                                        }
                                    />
                                    <ListItemSecondaryAction>
                                        <IconButton
                                            edge="end"
                                            size="small"
                                            onClick={() => handleUnpin(message._id)}
                                        >
                                            <PinIcon fontSize="small" />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </List>
            </Collapse>
        </Paper>
    );
};

export default PinnedMessages; 