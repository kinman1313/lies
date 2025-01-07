import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { MessageProvider } from './contexts/MessageContext';
import Chat from './components/Chat';
import { Box } from '@mui/material';

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{
                height: '100vh',
                width: '100vw',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                bgcolor: 'background.default'
            }}>
                <AuthProvider>
                    <SocketProvider>
                        <MessageProvider>
                            <Chat />
                        </MessageProvider>
                    </SocketProvider>
                </AuthProvider>
            </Box>
        </ThemeProvider>
    );
}

export default App; 