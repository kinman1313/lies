import React, { createContext, useContext, useState, useEffect } from 'react';
import io from 'socket.io-client';
import { config } from '../config';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const newSocket = io(config.SOCKET_URL, {
            auth: {
                token
            },
            transports: ['websocket', 'polling']
        });

        newSocket.on('connect', () => {
            console.log('Connected to socket server');
        });

        newSocket.on('error', (error) => {
            console.error('Socket error:', error);
        });

        newSocket.on('disconnect', () => {
            console.log('Disconnected from socket server');
        });

        setSocket(newSocket);

        return () => {
            if (newSocket) {
                newSocket.disconnect();
            }
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};

export default SocketContext; 