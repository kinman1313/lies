import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { config } from '../config';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            // Create socket connection with auth token
            const newSocket = io(config.SOCKET_URL, {
                auth: {
                    token: localStorage.getItem('token')
                },
                transports: ['websocket'],
                withCredentials: true
            });

            // Handle connection events
            newSocket.on('connect', () => {
                console.log('Socket connected');
            });

            newSocket.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
            });

            newSocket.on('disconnect', (reason) => {
                console.log('Socket disconnected:', reason);
            });

            setSocket(newSocket);

            // Cleanup on unmount
            return () => {
                newSocket.close();
            };
        }
    }, [user]);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};