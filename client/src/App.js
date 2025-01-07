import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { MessageProvider } from './contexts/MessageContext';
import theme from './theme';

// Components
import Login from './components/Login';
import Register from './components/Register';
import ResetPassword from './components/ResetPassword';
import NewPassword from './components/NewPassword';
import Chat from './components/Chat';
import PrivateRoute from './components/PrivateRoute';
import UserProfile from './components/UserProfile';

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>
                <Router>
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/reset-password/:token" element={<NewPassword />} />

                        {/* Protected Routes */}
                        <Route
                            path="/chat/*"
                            element={
                                <PrivateRoute>
                                    <SocketProvider>
                                        <MessageProvider>
                                            <Chat />
                                        </MessageProvider>
                                    </SocketProvider>
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/profile"
                            element={
                                <PrivateRoute>
                                    <UserProfile />
                                </PrivateRoute>
                            }
                        />

                        {/* Redirect root to chat or login */}
                        <Route
                            path="/"
                            element={<Navigate to="/chat" replace />}
                        />
                    </Routes>
                </Router>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App; 