import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Paper,
    TextField,
    Button,
    Typography,
    Alert,
    CircularProgress,
    IconButton,
    InputAdornment
} from '@mui/material';
import {
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import axios from 'axios';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setStatus({
                type: 'error',
                message: 'Passwords do not match'
            });
            return;
        }

        setLoading(true);
        setStatus({ type: '', message: '' });

        try {
            const response = await axios.post(`/api/auth/reset-password/${token}`, {
                newPassword
            });
            setStatus({
                type: 'success',
                message: 'Password successfully reset. Redirecting to login...'
            });
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (error) {
            setStatus({
                type: 'error',
                message: error.response?.data?.message || 'Failed to reset password'
            });
        } finally {
            setLoading(false);
        }
    };

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
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
                    Reset Password
                </Typography>

                <Typography variant="body2" color="text.secondary" align="center">
                    Enter your new password below.
                </Typography>

                {status.message && (
                    <Alert severity={status.type} sx={{ width: '100%' }}>
                        {status.message}
                    </Alert>
                )}

                <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="New Password"
                            type={showPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            fullWidth
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={toggleShowPassword}
                                            edge="end"
                                        >
                                            {showPassword ? (
                                                <VisibilityOffIcon />
                                            ) : (
                                                <VisibilityIcon />
                                            )}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />

                        <TextField
                            label="Confirm Password"
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            fullWidth
                            error={confirmPassword !== newPassword && confirmPassword !== ''}
                            helperText={
                                confirmPassword !== newPassword && confirmPassword !== ''
                                    ? 'Passwords do not match'
                                    : ''
                            }
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
                                'Reset Password'
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

export default ResetPassword; 