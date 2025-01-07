import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { debounce } from 'lodash';

const MessageContext = createContext(null);

export const useMessages = () => useContext(MessageContext);

export const MessageProvider = ({ children }) => {
    const { socket } = useSocket();
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [pinnedMessages, setPinnedMessages] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);
    const [scheduledMessages, setScheduledMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Debounced typing indicator
    const debouncedEmitTyping = useCallback(
        debounce((isTyping) => {
            if (socket && user) {
                socket.emit(isTyping ? 'typing' : 'stopTyping', { username: user.username });
            }
        }, 300),
        [socket, user]
    );

    useEffect(() => {
        if (!socket) return;

        const handleError = (error) => {
            console.error('Message operation failed:', error);
            setError(error.message || 'Operation failed');
            // Clear error after 5 seconds
            setTimeout(() => setError(null), 5000);
        };

        // Message handlers with error handling
        socket.on('message', (message) => {
            try {
                setMessages(prev => [...prev, message]);
                setError(null);
            } catch (err) {
                handleError(err);
            }
        });

        socket.on('messageUpdated', (updatedMessage) => {
            try {
                setMessages(prev => prev.map(msg =>
                    msg._id === updatedMessage._id ? updatedMessage : msg
                ));
                setError(null);
            } catch (err) {
                handleError(err);
            }
        });

        socket.on('messageDeleted', (messageId) => {
            try {
                setMessages(prev => prev.filter(msg => msg._id !== messageId));
                setPinnedMessages(prev => prev.filter(msg => msg._id !== messageId));
                setError(null);
            } catch (err) {
                handleError(err);
            }
        });

        // Pinned message handlers
        socket.on('messagePinned', (message) => {
            try {
                setPinnedMessages(prev => [...prev, message]);
                // Update the message in the main messages list
                setMessages(prev => prev.map(msg =>
                    msg._id === message._id ? { ...msg, isPinned: true } : msg
                ));
                setError(null);
            } catch (err) {
                handleError(err);
            }
        });

        socket.on('messageUnpinned', (messageId) => {
            try {
                setPinnedMessages(prev => prev.filter(msg => msg._id !== messageId));
                // Update the message in the main messages list
                setMessages(prev => prev.map(msg =>
                    msg._id === messageId ? { ...msg, isPinned: false } : msg
                ));
                setError(null);
            } catch (err) {
                handleError(err);
            }
        });

        // Typing indicators
        socket.on('typing', ({ username }) => {
            if (username !== user?.username) {
                setTypingUsers(prev => [...new Set([...prev, username])]);
            }
        });

        socket.on('stopTyping', ({ username }) => {
            setTypingUsers(prev => prev.filter(user => user !== username));
        });

        // Scheduled messages
        socket.on('messageScheduled', ({ scheduledMessage, error }) => {
            if (error) {
                handleError(new Error(error));
            } else {
                setScheduledMessages(prev => [...prev, scheduledMessage]);
                setError(null);
            }
        });

        // Message reactions
        socket.on('messageReaction', ({ messageId, reaction, username }) => {
            try {
                setMessages(prev => prev.map(msg => {
                    if (msg._id === messageId) {
                        const reactions = msg.reactions || [];
                        const existingReaction = reactions.findIndex(r =>
                            r.emoji === reaction && r.username === username
                        );

                        if (existingReaction >= 0) {
                            // Remove reaction
                            return {
                                ...msg,
                                reactions: reactions.filter((_, i) => i !== existingReaction)
                            };
                        } else {
                            // Add reaction
                            return {
                                ...msg,
                                reactions: [...reactions, { emoji: reaction, username }]
                            };
                        }
                    }
                    return msg;
                }));
                setError(null);
            } catch (err) {
                handleError(err);
            }
        });

        // Load initial messages
        const loadInitialMessages = async () => {
            try {
                setLoading(true);
                socket.emit('getMessages', {}, (response) => {
                    if (response.error) {
                        handleError(new Error(response.error));
                    } else {
                        setMessages(response.messages || []);
                        setPinnedMessages(response.pinnedMessages || []);
                        setScheduledMessages(response.scheduledMessages || []);
                        setError(null);
                    }
                    setLoading(false);
                });
            } catch (err) {
                handleError(err);
                setLoading(false);
            }
        };

        loadInitialMessages();

        return () => {
            socket.off('message');
            socket.off('messageUpdated');
            socket.off('messageDeleted');
            socket.off('messagePinned');
            socket.off('messageUnpinned');
            socket.off('typing');
            socket.off('stopTyping');
            socket.off('messageScheduled');
            socket.off('messageReaction');
        };
    }, [socket, user]);

    const sendMessage = async (content) => {
        if (!socket) return;
        try {
            return new Promise((resolve, reject) => {
                socket.emit('message', content, (response) => {
                    if (response.error) {
                        handleError(new Error(response.error));
                        reject(response.error);
                    } else {
                        resolve(response);
                    }
                });
            });
        } catch (err) {
            handleError(err);
            throw err;
        }
    };

    const scheduleMessage = async (message, scheduledFor) => {
        if (!socket) return;
        try {
            return new Promise((resolve, reject) => {
                socket.emit('scheduleMessage', { ...message, scheduledFor }, (response) => {
                    if (response.error) {
                        handleError(new Error(response.error));
                        reject(response.error);
                    } else {
                        resolve(response);
                    }
                });
            });
        } catch (err) {
            handleError(err);
            throw err;
        }
    };

    const pinMessage = async (messageId) => {
        if (!socket) return;
        try {
            return new Promise((resolve, reject) => {
                socket.emit('pin', { messageId }, (response) => {
                    if (response.error) {
                        handleError(new Error(response.error));
                        reject(response.error);
                    } else {
                        resolve(response);
                    }
                });
            });
        } catch (err) {
            handleError(err);
            throw err;
        }
    };

    const deleteMessage = async (messageId) => {
        if (!socket) return;
        try {
            return new Promise((resolve, reject) => {
                socket.emit('deleteMessage', { messageId }, (response) => {
                    if (response.error) {
                        handleError(new Error(response.error));
                        reject(response.error);
                    } else {
                        resolve(response);
                    }
                });
            });
        } catch (err) {
            handleError(err);
            throw err;
        }
    };

    const setMessageExpiry = async (messageId, expiryTime) => {
        if (!socket) return;
        try {
            return new Promise((resolve, reject) => {
                socket.emit('setMessageExpiry', { messageId, expiryTime }, (response) => {
                    if (response.error) {
                        handleError(new Error(response.error));
                        reject(response.error);
                    } else {
                        resolve(response);
                    }
                });
            });
        } catch (err) {
            handleError(err);
            throw err;
        }
    };

    const addReaction = async (messageId, reaction) => {
        if (!socket) return;
        try {
            return new Promise((resolve, reject) => {
                socket.emit('addReaction', { messageId, reaction }, (response) => {
                    if (response.error) {
                        handleError(new Error(response.error));
                        reject(response.error);
                    } else {
                        resolve(response);
                    }
                });
            });
        } catch (err) {
            handleError(err);
            throw err;
        }
    };

    const handleTyping = (isTyping) => {
        debouncedEmitTyping(isTyping);
    };

    const value = {
        messages,
        pinnedMessages,
        scheduledMessages,
        typingUsers,
        loading,
        error,
        sendMessage,
        scheduleMessage,
        pinMessage,
        deleteMessage,
        setMessageExpiry,
        addReaction,
        handleTyping
    };

    return (
        <MessageContext.Provider value={value}>
            {children}
        </MessageContext.Provider>
    );
};

export default MessageContext; 
