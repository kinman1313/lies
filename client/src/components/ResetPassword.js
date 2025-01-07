import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
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

export default function ResetPassword() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setError('');
            setMessage('');
            setLoading(true);

            // Use the forgot-password endpoint to request a reset
            await axios.post(`${config.API_URL}/api/users/forgot-password`, { email });
            setMessage('Password reset instructions have been sent to your email.');
        } catch (err) {
            console.error('Reset password error:', err);
            setError(err.response?.data?.error || 'Failed to send reset instructions');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 8, mb: 4 }}>
                <Paper elevation={3} sx={{ p: 4 }}>
                    <Typography variant="h4" component="h1" gutterBottom align="center">
                        Reset Password
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
                            label="Email"
                            type="email"
                            required
                            fullWidth
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            margin="normal"
                            autoComplete="email"
                        />

                        <LoadingButton
                            type="submit"
                            variant="contained"
                            fullWidth
                            loading={loading}
                            sx={{ mt: 3, mb: 2 }}
                        >
                            Reset Password
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