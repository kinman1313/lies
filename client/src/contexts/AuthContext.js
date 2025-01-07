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
                const response = await axios.get(`${config.API_URL}/api/users/verify`);
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
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (email, password) => {
        try {
            const response = await axios.post(`${config.API_URL}/api/users/login`, {
                email,
                password
            });

            const { token, user: userData } = response.data;

            // Save token and set default header
            localStorage.setItem('token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            setUser(userData);
            setError(null);
            return userData;
        } catch (err) {
            const message = err.response?.data?.error || 'Login failed';
            setError(message);
            throw err;
        }
    };

    const logout = async () => {
        try {
            await axios.post(`${config.API_URL}/api/users/logout`);
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
            setUser(null);
            setError(null);
        }
    };

    const register = async (username, email, password) => {
        try {
            const response = await axios.post(`${config.API_URL}/api/users/register`, {
                username,
                email,
                password
            });

            const { token, user: userData } = response.data;

            // Save token and set default header
            localStorage.setItem('token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            setUser(userData);
            setError(null);
            return userData;
        } catch (err) {
            const message = err.response?.data?.error || 'Registration failed';
            setError(message);
            throw err;
        }
    };

    const updateProfile = async (userData) => {
        try {
            const response = await axios.put(`${config.API_URL}/api/users/profile`, userData);
            setUser(response.data.user);
            setError(null);
            return response.data.user;
        } catch (err) {
            const message = err.response?.data?.error || 'Profile update failed';
            setError(message);
            throw err;
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