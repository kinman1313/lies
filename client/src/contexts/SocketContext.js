import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { config } from '../config';

const SocketContext = createContext(null);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [reconnectAttempts, setReconnectAttempts] = useState(0);
    const { user } = useAuth();

    const connectSocket = useCallback(() => {
        if (!user) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        const newSocket = io(config.SOCKET_URL, {
            auth: { token },
            transports: ['websocket'],
            withCredentials: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 10000
        });

        newSocket.on('connect', () => {
            console.log('Socket connected');
            setIsConnected(true);
            setReconnectAttempts(0);

            // Join with user info
            newSocket.emit('join', {
                userId: user.id,
                username: user.username
            });
        });

        newSocket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            setIsConnected(false);
            setReconnectAttempts(prev => prev + 1);
        });

        newSocket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            setIsConnected(false);

            // Attempt to reconnect if not a client-side disconnect
            if (reason === 'io server disconnect') {
                newSocket.connect();
            }
        });

        newSocket.on('error', (error) => {
            console.error('Socket error:', error);
            if (!newSocket.connected) {
                newSocket.connect();
            }
        });

        setSocket(newSocket);

        return () => {
            if (newSocket) {
                newSocket.disconnect();
            }
        };
    }, [user]);

    // Initialize socket connection when user is available
    useEffect(() => {
        const cleanup = connectSocket();
        return () => cleanup && cleanup();
    }, [connectSocket]);

    // Reconnect socket when connection is lost
    useEffect(() => {
        if (!isConnected && socket && reconnectAttempts < 5) {
            const timer = setTimeout(() => {
                console.log('Attempting to reconnect...');
                socket.connect();
            }, 1000 * (reconnectAttempts + 1));

            return () => clearTimeout(timer);
        }
    }, [isConnected, socket, reconnectAttempts]);

    const value = {
        socket,
        isConnected,
        reconnectAttempts
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};