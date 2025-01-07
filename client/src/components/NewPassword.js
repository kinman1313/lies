import React, { useState } from 'react';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Link,
    Box,
    Alert
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import axios from 'axios';
import { config } from '../config';

export default function NewPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { token } = useParams();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            setError('');
            setMessage('');
            setLoading(true);

            await axios.post(`${config.API_URL}/api/users/reset-password/${token}`, { password });
            setMessage('Password has been reset successfully');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            console.error('Set new password error:', err);
            setError(err.response?.data?.error || 'Failed to set new password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 8, mb: 4 }}>
                <Paper elevation={3} sx={{ p: 4 }}>
                    <Typography variant="h4" component="h1" gutterBottom align="center">
                        Set New Password
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {message && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            {message}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <TextField
                            label="New Password"
                            type="password"
                            required
                            fullWidth
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            margin="normal"
                            autoComplete="new-password"
                        />

                        <TextField
                            label="Confirm Password"
                            type="password"
                            required
                            fullWidth
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            margin="normal"
                            autoComplete="new-password"
                        />

                        <LoadingButton
                            type="submit"
                            variant="contained"
                            fullWidth
                            loading={loading}
                            sx={{ mt: 3, mb: 2 }}
                        >
                            Set New Password
                        </LoadingButton>

                        <Box sx={{ textAlign: 'center' }}>
                            <Link component={RouterLink} to="/login" variant="body2">
                                Back to Login
                            </Link>
                        </Box>
                    </form>
                </Paper>
            </Box>
        </Container>
    );
}