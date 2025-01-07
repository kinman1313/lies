import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/styles/CssBaseline';
import { theme } from './theme';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { MessageProvider } from './contexts/MessageContext';
import Chat from './components/Chat';

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>
                <SocketProvider>
                    <MessageProvider>
                        <Chat />
                    </MessageProvider>
                </SocketProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App; 