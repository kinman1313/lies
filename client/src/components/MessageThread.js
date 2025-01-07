import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Paper,
    Typography,
    IconButton,
    Collapse,
    Divider,
    Avatar,
    Badge,
    Tooltip,
    Button,
    TextField,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    CircularProgress
} from '@mui/material';
import {
    Reply as ReplyIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Send as SendIcon,
    Thread as ThreadIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import MessageBubble from './MessageBubble';
import MessageReactions from './MessageReactions';
import { formatDistanceToNow } from 'date-fns';

const MessageThread = ({
    message,
    replies = [],
    onReply,
    onLoadMore,
    hasMoreReplies = false,
    isLoadingReplies = false,
    onAddReaction,
    onRemoveReaction
}) => {
    const { user: currentUser } = useAuth();
    const [expanded, setExpanded] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [showReplyInput, setShowReplyInput] = useState(false);
    const replyInputRef = useRef(null);

    useEffect(() => {
        if (showReplyInput && replyInputRef.current) {
            replyInputRef.current.focus();
        }
    }, [showReplyInput]);

    const handleReply = () => {
        if (replyText.trim()) {
            onReply({
                content: replyText,
                replyTo: message._id,
                type: 'text'
            });
            setReplyText('');
            setShowReplyInput(false);
        }
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleReply();
        }
    };

    const renderMessageContent = () => {
        switch (message.type) {
            case 'gif':
                return (
                    <Box sx={{ maxWidth: '300px', borderRadius: 2, overflow: 'hidden' }}>
                        <img src={message.content} alt="GIF" style={{ width: '100%', height: 'auto' }} />
                    </Box>
                );
            case 'voice':
                return (
                    <Box>
                        <audio controls src={message.fileUrl}>
                            Your browser does not support the audio element.
                        </audio>
                    </Box>
                );
            case 'file':
                return (
                    <Box>
                        <Button
                            variant="outlined"
                            href={message.fileUrl}
                            target="_blank"
                            startIcon={<Icon>attachment</Icon>}
                        >
                            {message.fileName || 'Download File'}
                        </Button>
                    </Box>
                );
            default:
                return <Typography>{message.content}</Typography>;
        }
    };

    return (
        <Box sx={{ mb: 2 }}>
            <Paper
                elevation={1}
                sx={{
                    p: 2,
                    backgroundColor: message.userId === currentUser?._id ? '#e3f2fd' : '#fff'
                }}
            >
                <Box display="flex" alignItems="flex-start" gap={1}>
                    <ListItemAvatar>
                        <Avatar src={message.userAvatar}>{message.username[0]}</Avatar>
                    </ListItemAvatar>
                    <Box flex={1}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                            <Typography variant="subtitle2" color="textSecondary">
                                {message.username}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                            </Typography>
                        </Box>
                        {renderMessageContent()}
                        <MessageReactions
                            reactions={message.reactions}
                            onAddReaction={onAddReaction}
                            onRemoveReaction={onRemoveReaction}
                            messageId={message._id}
                        />
                    </Box>
                </Box>
            </Paper>

            {replies.length > 0 && (
                <>
                    <IconButton size="small" onClick={() => setExpanded(!expanded)}>
                        {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                    <Collapse in={expanded}>
                        <List>
                            {replies.map((reply) => (
                                <ListItem key={reply._id}>
                                    <MessageBubble message={reply} />
                                </ListItem>
                            ))}
                            {hasMoreReplies && (
                                <Button
                                    onClick={onLoadMore}
                                    disabled={isLoadingReplies}
                                    startIcon={isLoadingReplies && <CircularProgress size={20} />}
                                >
                                    Load More Replies
                                </Button>
                            )}
                        </List>
                    </Collapse>
                </>
            )}

            {showReplyInput ? (
                <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                    <TextField
                        fullWidth
                        size="small"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your reply..."
                        inputRef={replyInputRef}
                    />
                    <IconButton color="primary" onClick={handleReply}>
                        <SendIcon />
                    </IconButton>
                    <IconButton onClick={() => setShowReplyInput(false)}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            ) : (
                <IconButton size="small" onClick={() => setShowReplyInput(true)}>
                    <ReplyIcon />
                </IconButton>
            )}
        </Box>
    );
};

export default MessageThread; 