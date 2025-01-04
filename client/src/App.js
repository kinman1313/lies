import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Chat from './components/Chat';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';

// Create theme
const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#7C4DFF',
        },
        secondary: {
            main: '#69F0AE',
        },
        background: {
            default: '#121212',
            paper: '#1E1E1E',
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                },
            },
        },
    },
});

// Protected Route Component
const PrivateRoute = ({ children }) => {
    const { user } = useAuth();
    return user ? children : <Navigate to="/login" />;
};

// Public Route Component (redirects to chat if already logged in)
const PublicRoute = ({ children }) => {
    const { user } = useAuth();
    return !user ? children : <Navigate to="/chat" />;
};

// Chat component (moved from previous App.js)
function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>
                <Router>
                    <Routes>
                        <Route
                            path="/login"
                            element={
                                <PublicRoute>
                                    <Login />
                                </PublicRoute>
                            }
                        />
                        <Route
                            path="/register"
                            element={
                                <PublicRoute>
                                    <Register />
                                </PublicRoute>
                            }
                        />
                        <Route
                            path="/forgot-password"
                            element={
                                <PublicRoute>
                                    <ForgotPassword />
                                </PublicRoute>
                            }
                        />
                        <Route
                            path="/reset-password/:token"
                            element={
                                <PublicRoute>
                                    <ResetPassword />
                                </PublicRoute>
                            }
                        />
                        <Route
                            path="/*"
                            element={
                                <PrivateRoute>
                                    <Chat />
                                </PrivateRoute>
                            }
                        />
                    </Routes>
                </Router>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App; 