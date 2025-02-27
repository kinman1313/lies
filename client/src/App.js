import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import Login from './components/Login';
import Register from './components/Register';
import Chat from './components/Chat';
import ResetPassword from './components/ResetPassword';
import NewPassword from './components/NewPassword';

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
        <Router>
            <AuthProvider>
                <SocketProvider>
                    <Routes>
                        <Route path="/login" element={
                            <PublicRoute>
                                <Login />
                            </PublicRoute>
                        } />
                        <Route path="/register" element={
                            <PublicRoute>
                                <Register />
                            </PublicRoute>
                        } />
                        <Route path="/reset-password" element={
                            <PublicRoute>
                                <ResetPassword />
                            </PublicRoute>
                        } />
                        <Route path="/reset-password/:token" element={
                            <PublicRoute>
                                <NewPassword />
                            </PublicRoute>
                        } />
                        <Route path="/chat" element={
                            <PrivateRoute>
                                <Chat />
                            </PrivateRoute>
                        } />
                        <Route path="/" element={<Navigate to="/chat" />} />
                    </Routes>
                </SocketProvider>
            </AuthProvider>
        </Router>
    );
}

export default App; 