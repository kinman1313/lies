import React, { useState } from 'react';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import {
    Container,
    Paper,
    TextField,
    Typography,
    Link,
    Box,
    Alert,
    InputAdornment,
    IconButton
} from '@mui/material';
import {
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import LoadingButton from '@mui/lab/LoadingButton';
import axios from 'axios';
import { config } from '../config';

export default function NewPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const navigate = useNavigate();
    const { token } = useParams();

    const validatePassword = (pass) => {
        const errors = {};
        if (pass.length < 8) {
            errors.length = 'Password must be at least 8 characters long';
        }
        if (!/[A-Z]/.test(pass)) {
            errors.uppercase = 'Password must contain at least one uppercase letter';
        }
        if (!/[a-z]/.test(pass)) {
            errors.lowercase = 'Password must contain at least one lowercase letter';
        }
        if (!/[0-9]/.test(pass)) {
            errors.number = 'Password must contain at least one number';
        }
        return errors;
    };

    const handlePasswordChange = (e) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        setValidationErrors(validatePassword(newPassword));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (Object.keys(validationErrors).length > 0) {
            setError('Please fix the password validation errors');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            setError('');
            setMessage('');
            setLoading(true);

            await axios.post(`${config.API_URL}/api/users/reset-password/${token}`, { password });
            setMessage('Password has been successfully reset. Redirecting to login...');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to reset password. Please try again.');
            console.error('Reset password error:', err);
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

                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="New Password"
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            autoComplete="new-password"
                            value={password}
                            onChange={handlePasswordChange}
                            error={Object.keys(validationErrors).length > 0}
                            helperText={Object.values(validationErrors)[0]}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />

                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="confirmPassword"
                            label="Confirm New Password"
                            type={showPassword ? 'text' : 'password'}
                            id="confirmPassword"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            error={password !== confirmPassword && confirmPassword !== ''}
                            helperText={
                                password !== confirmPassword && confirmPassword !== ''
                                    ? 'Passwords do not match'
                                    : ''
                            }
                        />

                        <Box sx={{ mt: 2, mb: 2 }}>
                            <Typography variant="caption" color="textSecondary">
                                Password must contain:
                            </Typography>
                            <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                                <li>
                                    <Typography
                                        variant="caption"
                                        color={password.length >= 8 ? 'success.main' : 'text.secondary'}
                                    >
                                        At least 8 characters
                                    </Typography>
                                </li>
                                <li>
                                    <Typography
                                        variant="caption"
                                        color={/[A-Z]/.test(password) ? 'success.main' : 'text.secondary'}
                                    >
                                        One uppercase letter
                                    </Typography>
                                </li>
                                <li>
                                    <Typography
                                        variant="caption"
                                        color={/[a-z]/.test(password) ? 'success.main' : 'text.secondary'}
                                    >
                                        One lowercase letter
                                    </Typography>
                                </li>
                                <li>
                                    <Typography
                                        variant="caption"
                                        color={/[0-9]/.test(password) ? 'success.main' : 'text.secondary'}
                                    >
                                        One number
                                    </Typography>
                                </li>
                            </ul>
                        </Box>

                        <LoadingButton
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                            loading={loading}
                            disabled={
                                Object.keys(validationErrors).length > 0 ||
                                password !== confirmPassword ||
                                !password ||
                                !confirmPassword
                            }
                        >
                            Set New Password
                        </LoadingButton>

                        <Box sx={{ textAlign: 'center' }}>
                            <Link component={RouterLink} to="/login" variant="body2">
                                Back to Login
                            </Link>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
}