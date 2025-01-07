import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Avatar,
    Box,
    Typography,
    Switch,
    FormControlLabel,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Divider,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Badge
} from '@mui/material';
import {
    Edit as EditIcon,
    Palette as PaletteIcon,
    EmojiEmotions as EmojiIcon,
    Notifications as NotificationsIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { config } from '../config';
import { useSocket } from '../contexts/SocketContext';

const NOTIFICATION_SOUNDS = {
    default: '/sounds/notification-default.mp3',
    chime: '/sounds/notification-chime.mp3',
    ding: '/sounds/notification-ding.mp3',
    pop: '/sounds/notification-pop.mp3'
};

const UserProfile = ({ open, onClose }) => {
    const { user, updateProfile } = useAuth();
    const { socket } = useSocket();
    const [username, setUsername] = useState(user?.username || '');
    const [avatar, setAvatar] = useState(user?.avatar || '');
    const [newAvatar, setNewAvatar] = useState(null);
    const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(
        localStorage.getItem('notificationsEnabled') === 'true'
    );
    const [soundEnabled, setSoundEnabled] = useState(
        localStorage.getItem('soundEnabled') === 'true'
    );
    const [notificationSound, setNotificationSound] = useState(
        localStorage.getItem('notificationSound') || 'default'
    );
    const [preferences, setPreferences] = useState({
        theme: user?.preferences?.theme || 'light',
        bubbleStyle: user?.preferences?.bubbleStyle || 'modern',
        messageColor: user?.preferences?.messageColor || '#7C4DFF'
    });

    useEffect(() => {
        if (user) {
            setUsername(user.username);
            setAvatar(user.avatar);
            setPreferences({
                theme: user.preferences?.theme || 'light',
                bubbleStyle: user.preferences?.bubbleStyle || 'modern',
                messageColor: user.preferences?.messageColor || '#7C4DFF'
            });
        }
    }, [user]);

    const handleSave = async () => {
        try {
            await updateProfile({
                username,
                avatar: newAvatar || avatar,
                preferences
            });

            // Save notification preferences
            localStorage.setItem('notificationsEnabled', notificationsEnabled);
            localStorage.setItem('soundEnabled', soundEnabled);
            localStorage.setItem('notificationSound', notificationSound);

            onClose();
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    };

    const handleAvatarChange = async (event) => {
        const file = event.target.files[0];
        if (file) {
            try {
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch(`${config.API_URL}/api/upload`, {
                    method: 'POST',
                    body: formData,
                    credentials: 'include'
                });

                if (!response.ok) throw new Error('Upload failed');

                const { fileUrl } = await response.json();
                setNewAvatar(fileUrl);

                // Update avatar immediately in socket context
                socket.emit('updateAvatar', { avatarUrl: fileUrl });
            } catch (error) {
                console.error('Error uploading avatar:', error);
            }
        }
    };

    const playSound = (sound) => {
        const audio = new Audio(NOTIFICATION_SOUNDS[sound]);
        audio.play();
    };

    const handleColorChange = (event) => {
        const newColor = event.target.value;
        setPreferences(prev => ({
            ...prev,
            messageColor: newColor
        }));
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Profile Settings</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
                    {/* Profile Section */}
                    <Box>
                        <Typography variant="h6" gutterBottom>Profile</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Badge
                                overlap="circular"
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                badgeContent={
                                    <IconButton
                                        size="small"
                                        component="label"
                                        sx={{
                                            bgcolor: 'background.paper',
                                            boxShadow: 1,
                                            '&:hover': { bgcolor: 'background.paper' }
                                        }}
                                    >
                                        <EditIcon fontSize="small" />
                                        <input
                                            type="file"
                                            hidden
                                            accept="image/*"
                                            onChange={handleAvatarChange}
                                        />
                                    </IconButton>
                                }
                            >
                                <Avatar
                                    src={newAvatar || avatar}
                                    alt={username}
                                    sx={{ width: 80, height: 80 }}
                                >
                                    {username ? username[0].toUpperCase() : '?'}
                                </Avatar>
                            </Badge>
                            <TextField
                                label="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                fullWidth
                            />
                        </Box>
                    </Box>

                    <Divider />

                    {/* Appearance Settings */}
                    <Box>
                        <Typography variant="h6" gutterBottom>Appearance</Typography>
                        <List>
                            <ListItem>
                                <ListItemIcon>
                                    <EmojiIcon />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Message Style"
                                    secondary="Customize your message appearance"
                                />
                                <Select
                                    size="small"
                                    value={preferences.bubbleStyle}
                                    onChange={(e) => setPreferences(prev => ({ ...prev, bubbleStyle: e.target.value }))}
                                >
                                    <MenuItem value="modern">Modern</MenuItem>
                                    <MenuItem value="classic">Classic</MenuItem>
                                    <MenuItem value="minimal">Minimal</MenuItem>
                                </Select>
                            </ListItem>

                            <ListItem>
                                <ListItemIcon>
                                    <PaletteIcon />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Message Bubble Color"
                                    secondary="Choose your message bubble color"
                                />
                                <input
                                    type="color"
                                    value={preferences.messageColor}
                                    onChange={handleColorChange}
                                    style={{ marginLeft: '8px' }}
                                />
                            </ListItem>
                        </List>
                    </Box>

                    <Divider />

                    {/* Notification Settings */}
                    <Box>
                        <Typography variant="h6" gutterBottom>Notifications</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={notificationsEnabled}
                                        onChange={(e) => setNotificationsEnabled(e.target.checked)}
                                    />
                                }
                                label="Enable Notifications"
                            />

                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={soundEnabled}
                                        onChange={(e) => setSoundEnabled(e.target.checked)}
                                        disabled={!notificationsEnabled}
                                    />
                                }
                                label="Enable Sound"
                            />

                            <FormControl fullWidth disabled={!notificationsEnabled || !soundEnabled}>
                                <InputLabel>Notification Sound</InputLabel>
                                <Select
                                    value={notificationSound}
                                    onChange={(e) => {
                                        setNotificationSound(e.target.value);
                                        playSound(e.target.value);
                                    }}
                                    label="Notification Sound"
                                >
                                    <MenuItem value="default">Default</MenuItem>
                                    <MenuItem value="chime">Chime</MenuItem>
                                    <MenuItem value="ding">Ding</MenuItem>
                                    <MenuItem value="pop">Pop</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} variant="contained">Save</Button>
            </DialogActions>
        </Dialog>
    );
};

export default UserProfile; 