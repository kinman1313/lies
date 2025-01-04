import React, { useState } from 'react';
import {
    Box,
    IconButton,
    Popover,
    Typography,
    Tooltip,
    Badge
} from '@mui/material';
import { AddReaction as AddReactionIcon } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👏'];

const MessageReactions = ({ message, onAddReaction, onRemoveReaction }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const { user: currentUser } = useAuth();

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleEmojiSelect = (emoji) => {
        onAddReaction(emoji);
        handleClose();
    };

    const handleReactionClick = (emoji) => {
        const hasReacted = message.reactions.find(
            r => r.emoji === emoji && r.users.includes(currentUser.id)
        );
        if (hasReacted) {
            onRemoveReaction(emoji);
        } else {
            onAddReaction(emoji);
        }
    };

    return (
        <>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                <AnimatePresence>
                    {message.reactions?.map((reaction) => (
                        <motion.div
                            key={reaction.emoji}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <Tooltip
                                title={reaction.users.map(u => u.username).join(', ')}
                                arrow
                            >
                                <Badge
                                    badgeContent={reaction.users.length}
                                    color="primary"
                                    sx={{
                                        '& .MuiBadge-badge': {
                                            fontSize: '0.6rem',
                                            minWidth: '16px',
                                            height: '16px',
                                            padding: '0 4px'
                                        }
                                    }}
                                >
                                    <Box
                                        onClick={() => handleReactionClick(reaction.emoji)}
                                        sx={{
                                            cursor: 'pointer',
                                            bgcolor: 'background.paper',
                                            borderRadius: '12px',
                                            px: 1,
                                            py: 0.5,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            '&:hover': {
                                                bgcolor: 'action.hover'
                                            }
                                        }}
                                    >
                                        <Typography variant="body2">
                                            {reaction.emoji}
                                        </Typography>
                                    </Box>
                                </Badge>
                            </Tooltip>
                        </motion.div>
                    ))}
                </AnimatePresence>

                <IconButton
                    size="small"
                    onClick={handleClick}
                    sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
                >
                    <AddReactionIcon fontSize="small" />
                </IconButton>
            </Box>

            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                PaperProps={{
                    sx: {
                        p: 1,
                        bgcolor: 'background.paper',
                        borderRadius: 2,
                        boxShadow: 3
                    }
                }}
            >
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {commonEmojis.map((emoji) => (
                        <Box
                            key={emoji}
                            onClick={() => handleEmojiSelect(emoji)}
                            sx={{
                                cursor: 'pointer',
                                p: 0.5,
                                borderRadius: 1,
                                '&:hover': {
                                    bgcolor: 'action.hover'
                                }
                            }}
                        >
                            <Typography variant="body1">{emoji}</Typography>
                        </Box>
                    ))}
                </Box>
            </Popover>
        </>
    );
};

export default MessageReactions; 