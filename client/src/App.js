import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { theme } from './theme';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { MessageProvider } from './contexts/MessageContext';
import Chat from './components/Chat';
import Login from './components/Login';
import Register from './components/Register';
import ResetPassword from './components/ResetPassword';
import NewPassword from './components/NewPassword';
import { Box } from '@mui/material';

const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            Loading...
        </Box>;
    }

    return user ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <Router>
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
                        <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/reset-password" element={<ResetPassword />} />
                            <Route path="/new-password/:token" element={<NewPassword />} />
                            <Route path="/" element={
                                <PrivateRoute>
                                    <SocketProvider>
                                        <MessageProvider>
                                            <Chat />
                                        </MessageProvider>
                                    </SocketProvider>
                                </PrivateRoute>
                            } />
                            <Route path="*" element={<Navigate to="/" />} />
                        </Routes>
                    </AuthProvider>
                </Box>
            </ThemeProvider>
        </Router>
    );
}

export default App; 