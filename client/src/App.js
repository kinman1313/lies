import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './contexts/SocketContext';
import { AuthProvider } from './contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import ResetPassword from './components/ResetPassword';
import NewPassword from './components/NewPassword';
import Chat from './components/Chat';
import PrivateRoute from './components/PrivateRoute';
import './App.css';

function App() {
    return (
        <Router>
            <AuthProvider>
                <SocketProvider>
                    <div className="app">
                        <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/reset-password" element={<ResetPassword />} />
                            <Route path="/reset-password/:token" element={<NewPassword />} />
                            <Route
                                path="/"
                                element={
                                    <PrivateRoute>
                                        <Chat />
                                    </PrivateRoute>
                                }
                            />
                        </Routes>
                    </div>
                </SocketProvider>
            </AuthProvider>
        </Router>
    );
}

export default App; 