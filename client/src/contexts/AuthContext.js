import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { config } from '../config';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check authentication status on mount
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                // Set default authorization header
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                // Verify token with server
                const response = await axios.get(`${config.API_URL}/api/auth/verify`);
                if (response.data.user) {
                    setUser(response.data.user);
                } else {
                    // Clear invalid token
                    localStorage.removeItem('token');
                    delete axios.defaults.headers.common['Authorization'];
                }
            } catch (err) {
                console.error('Auth verification failed:', err);
                // Clear invalid token
                localStorage.removeItem('token');
                delete axios.defaults.headers.common['Authorization'];
                setError(err.response?.data?.error || err.message);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (email, password) => {
        try {
            setError(null);
            const response = await axios.post(`${config.API_URL}/api/auth/login`, {
                email,
                password
            });

            const { token, user: userData } = response.data;

            // Save token and set default header
            localStorage.setItem('token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            setUser(userData);
            return userData;
        } catch (err) {
            console.error('Login error:', err);
            const message = err.response?.data?.error || err.message || 'Login failed';
            setError(message);
            throw new Error(message);
        }
    };

    const register = async (username, email, password) => {
        try {
            setError(null);
            const response = await axios.post(`${config.API_URL}/api/auth/register`, {
                username,
                email,
                password
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const { token, user: userData } = response.data;

            // Save token and set default header
            localStorage.setItem('token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            setUser(userData);
            return userData;
        } catch (err) {
            console.error('Registration error:', err);
            const message = err.response?.data?.error || err.message || 'Registration failed';
            setError(message);
            throw new Error(message);
        }
    };

    const logout = async () => {
        try {
            setError(null);
            await axios.post(`${config.API_URL}/api/auth/logout`);
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
            setUser(null);
        }
    };

    const updateProfile = async (userData) => {
        try {
            setError(null);
            const response = await axios.put(`${config.API_URL}/api/users/profile`, userData);
            setUser(response.data.user);
            return response.data.user;
        } catch (err) {
            console.error('Profile update error:', err);
            const message = err.response?.data?.error || err.message || 'Profile update failed';
            setError(message);
            throw new Error(message);
        }
    };

    const value = {
        user,
        loading,
        error,
        login,
        logout,
        register,
        updateProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}; 