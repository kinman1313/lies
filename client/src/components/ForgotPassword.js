import React, { useState } from 'react';
import {
    Box,
    Paper,
    TextField,
    Button,
    Typography,
    Alert,
    CircularProgress
} from '@mui/material';
import { motion } from 'framer-motion';
import axios from 'axios';
import { API_URL } from '../config';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', message: '' });

        try {
            const response = await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
            setStatus({
                type: 'success',
                message: 'Password reset email sent. Please check your inbox.'
            });
            setEmail('');
        } catch (error) {
            console.error('Password reset error:', error);
            setStatus({
                type: 'error',
                message: error.response?.data?.message || 'Failed to send reset email'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                p: 3
            }}
        >
            <Paper
                elevation={3}
                sx={{
                    p: 4,
                    width: '100%',
                    maxWidth: 400,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3
                }}
            >
                <Typography variant="h5" component="h1" align="center" gutterBottom>
                    Forgot Password
                </Typography>

                <Typography variant="body2" color="text.secondary" align="center">
                    Enter your email address and we'll send you a link to reset your password.
                </Typography>

                {status.message && (
                    <Alert severity={status.type} sx={{ width: '100%' }}>
                        {status.message}
                    </Alert>
                )}

                <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            fullWidth
                        />

                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            disabled={loading}
                            sx={{ mt: 2 }}
                        >
                            {loading ? (
                                <CircularProgress size={24} color="inherit" />
                            ) : (
                                'Send Reset Link'
                            )}
                        </Button>
                    </Box>
                </form>

                <Button
                    href="/login"
                    variant="text"
                    sx={{ mt: 2 }}
                >
                    Back to Login
                </Button>
            </Paper>
        </Box>
    );
};

export default ForgotPassword; 