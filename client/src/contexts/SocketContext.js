import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { config } from '../config';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            // Create socket connection with auth token
            const newSocket = io(config.SOCKET_URL, {
                auth: {
                    token: localStorage.getItem('token')
                },
                transports: ['websocket', 'polling'],
                withCredentials: true,
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000
            });

            // Handle connection events
            newSocket.on('connect', () => {
                console.log('Socket connected');
                setIsConnected(true);
                // Join with user info
                newSocket.emit('join', user.username);
            });

            newSocket.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
                setIsConnected(false);
            });

            newSocket.on('disconnect', (reason) => {
                console.log('Socket disconnected:', reason);
                setIsConnected(false);
            });

            // Attempt to reconnect on errors
            newSocket.on('error', (error) => {
                console.error('Socket error:', error);
                if (!newSocket.connected) {
                    newSocket.connect();
                }
            });

            setSocket(newSocket);

            // Cleanup on unmount
            return () => {
                if (newSocket) {
                    newSocket.close();
                }
            };
        }
    }, [user]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};