import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

const MessageContext = createContext(null);

export const useMessages = () => useContext(MessageContext);

export const MessageProvider = ({ children }) => {
    const { socket } = useSocket();
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [pinnedMessages, setPinnedMessages] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);
    const [scheduledMessages, setScheduledMessages] = useState([]);

    useEffect(() => {
        if (!socket) return;

        // Message handlers
        socket.on('message', (message) => {
            setMessages(prev => [...prev, message]);
        });

        socket.on('messageUpdated', (updatedMessage) => {
            setMessages(prev => prev.map(msg =>
                msg._id === updatedMessage._id ? updatedMessage : msg
            ));
        });

        socket.on('messageDeleted', (messageId) => {
            setMessages(prev => prev.filter(msg => msg._id !== messageId));
            setPinnedMessages(prev => prev.filter(msg => msg._id !== messageId));
        });

        // Pinned message handlers
        socket.on('messagePinned', (message) => {
            setPinnedMessages(prev => [...prev, message]);
        });

        socket.on('messageUnpinned', (messageId) => {
            setPinnedMessages(prev => prev.filter(msg => msg._id !== messageId));
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
        socket.on('messageScheduled', ({ scheduledMessage }) => {
            setScheduledMessages(prev => [...prev, scheduledMessage]);
        });

        // Load initial messages
        socket.emit('getMessages', {}, (response) => {
            if (response.success) {
                setMessages(response.messages);
                setPinnedMessages(response.pinnedMessages);
                setScheduledMessages(response.scheduledMessages);
            }
        });

        return () => {
            socket.off('message');
            socket.off('messageUpdated');
            socket.off('messageDeleted');
            socket.off('messagePinned');
            socket.off('messageUnpinned');
            socket.off('typing');
            socket.off('stopTyping');
            socket.off('messageScheduled');
        };
    }, [socket, user]);

    const sendMessage = (content) => {
        if (socket) {
            socket.emit('message', content);
        }
    };

    const scheduleMessage = (message, scheduledFor) => {
        if (socket) {
            socket.emit('scheduleMessage', { ...message, scheduledFor });
        }
    };

    const pinMessage = (messageId) => {
        if (socket) {
            socket.emit('pin', { messageId });
        }
    };

    const deleteMessage = (messageId) => {
        if (socket) {
            socket.emit('deleteMessage', { messageId });
        }
    };

    const setMessageExpiry = (messageId, expiryTime) => {
        if (socket) {
            socket.emit('setMessageExpiry', { messageId, expiryTime });
        }
    };

    const value = {
        messages,
        pinnedMessages,
        scheduledMessages,
        typingUsers,
        sendMessage,
        scheduleMessage,
        pinMessage,
        deleteMessage,
        setMessageExpiry
    };

    return (
        <MessageContext.Provider value={value}>
            {children}
        </MessageContext.Provider>
    );
};

export default MessageContext; 