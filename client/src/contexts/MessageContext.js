import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

const MessageContext = createContext();

export const useMessages = () => useContext(MessageContext);

export const MessageProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { socket } = useSocket();
    const { user } = useAuth();

    useEffect(() => {
        if (!socket || !user) return;

        // Load initial messages
        socket.emit('getMessages', {}, (response) => {
            if (response.success) {
                setMessages(response.messages);
            } else {
                setError('Failed to load messages');
            }
            setLoading(false);
        });

        // Listen for new messages
        socket.on('newMessage', (message) => {
            setMessages(prev => [...prev, message]);
        });

        // Listen for message updates
        socket.on('messageUpdate', ({ messageId, update }) => {
            setMessages(prev => prev.map(msg =>
                msg.id === messageId ? { ...msg, ...update } : msg
            ));
        });

        // Listen for voice message status updates
        socket.on('voiceMessageStatus', ({ messageId, status, url }) => {
            setMessages(prev => prev.map(msg =>
                msg.id === messageId ? { ...msg, status, content: url } : msg
            ));
        });

        return () => {
            socket.off('newMessage');
            socket.off('messageUpdate');
            socket.off('voiceMessageStatus');
        };
    }, [socket, user]);

    const sendMessage = async (messageData) => {
        if (!socket) throw new Error('Socket not connected');

        return new Promise((resolve, reject) => {
            const tempId = Date.now().toString();
            const newMessage = {
                id: tempId,
                sender: user.id,
                timestamp: new Date().toISOString(),
                status: 'sending',
                ...messageData
            };

            // Add message to local state immediately
            setMessages(prev => [...prev, newMessage]);

            // Send to server
            socket.emit('sendMessage', messageData, (response) => {
                if (response.success) {
                    // Update the temporary message with server data
                    setMessages(prev => prev.map(msg =>
                        msg.id === tempId ? { ...msg, ...response.message } : msg
                    ));
                    resolve(response.message);
                } else {
                    // Mark message as failed
                    setMessages(prev => prev.map(msg =>
                        msg.id === tempId ? { ...msg, status: 'failed' } : msg
                    ));
                    reject(new Error(response.error));
                }
            });
        });
    };

    const handleError = (error) => {
        console.error('MessageContext error:', error);
        setError(error.message);
    };

    return (
        <MessageContext.Provider value={{
            messages,
            loading,
            error,
            sendMessage,
            handleError
        }}>
            {children}
        </MessageContext.Provider>
    );
};

export default MessageContext; 
