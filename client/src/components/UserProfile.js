import React, { useState } from 'react';
import {
    Box,
    Paper,
    Avatar,
    Typography,
    Button,
    IconButton,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemButton,
    Tab,
    Tabs,
    Badge,
    Switch,
    FormControlLabel,
    Tooltip
} from '@mui/material';
import {
    Edit as EditIcon,
    GitHub as GitHubIcon,
    Twitter as TwitterIcon,
    LinkedIn as LinkedInIcon,
    Language as WebsiteIcon,
    AccessTime as TimeIcon,
    Translate as TranslateIcon,
    Palette as PaletteIcon,
    Notifications as NotificationsIcon,
    Lock as LockIcon,
    EmojiEmotions as EmojiIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const UserProfile = ({
    user,
    onUpdateProfile,
    onUpdatePreferences,
    onUpdateAvatar
}) => {
    const { user: currentUser } = useAuth();
    const [editMode, setEditMode] = useState(false);
    const [tab, setTab] = useState(0);
    const [profileForm, setProfileForm] = useState({
        displayName: user.profile?.displayName || '',
        bio: user.profile?.bio || '',
        status: {
            text: user.profile?.status?.text || '',
            emoji: user.profile?.status?.emoji || ''
        },
        links: user.profile?.links || []
    });
    const [preferencesForm, setPreferencesForm] = useState({
        theme: user.preferences?.theme || 'system',
        messageColor: user.preferences?.messageColor || '#7C4DFF',
        bubbleStyle: user.preferences?.bubbleStyle || 'modern',
        notifications: {
            sound: user.preferences?.notifications?.sound ?? true,
            desktop: user.preferences?.notifications?.desktop ?? true,
            email: user.preferences?.notifications?.email ?? false
        },
        privacy: {
            showOnlineStatus: user.preferences?.privacy?.showOnlineStatus ?? true,
            allowFriendRequests: user.preferences?.privacy?.allowFriendRequests ?? true,
            allowMentions: user.preferences?.privacy?.allowMentions || 'everyone'
        }
    });

    const isOwnProfile = currentUser?.id === user.id;

    const handleSaveProfile = () => {
        onUpdateProfile(profileForm);
        setEditMode(false);
    };

    const handleSavePreferences = () => {
        onUpdatePreferences(preferencesForm);
    };

    const handleAvatarChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            onUpdateAvatar(file);
        }
    };

    return (
        <Box>
            <Paper
                elevation={3}
                sx={{
                    p: 3,
                    mb: 3,
                    borderRadius: 2,
                    background: 'linear-gradient(145deg, rgba(124,77,255,0.1), rgba(124,77,255,0.05))'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
                    <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        variant="dot"
                        color={user.isOnline ? 'success' : 'default'}
                    >
                        <Avatar
                            src={user.profile?.avatar?.url}
                            sx={{ width: 120, height: 120 }}
                        >
                            {user.username[0].toUpperCase()}
                        </Avatar>
                    </Badge>
                    <Box sx={{ ml: 3, flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Typography variant="h4">
                                {user.profile?.displayName || user.username}
                            </Typography>
                            {isOwnProfile && (
                                <IconButton
                                    onClick={() => setEditMode(!editMode)}
                                    sx={{ ml: 1 }}
                                >
                                    <EditIcon />
                                </IconButton>
                            )}
                        </Box>
                        <Typography variant="body1" color="text.secondary" gutterBottom>
                            @{user.username}
                        </Typography>
                        {user.profile?.status?.text && (
                            <Chip
                                icon={<EmojiIcon />}
                                label={`${user.profile.status.emoji} ${user.profile.status.text}`}
                                variant="outlined"
                                sx={{ mt: 1 }}
                            />
                        )}
                    </Box>
                </Box>

                <Tabs
                    value={tab}
                    onChange={(e, newValue) => setTab(newValue)}
                    sx={{ mb: 3 }}
                >
                    <Tab label="Profile" />
                    {isOwnProfile && <Tab label="Preferences" />}
                </Tabs>

                {tab === 0 ? (
                    <Box>
                        {editMode ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <TextField
                                        label="Display Name"
                                        fullWidth
                                        value={profileForm.displayName}
                                        onChange={(e) => setProfileForm({
                                            ...profileForm,
                                            displayName: e.target.value
                                        })}
                                    />
                                    <TextField
                                        label="Bio"
                                        fullWidth
                                        multiline
                                        rows={4}
                                        value={profileForm.bio}
                                        onChange={(e) => setProfileForm({
                                            ...profileForm,
                                            bio: e.target.value
                                        })}
                                    />
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <TextField
                                            label="Status"
                                            fullWidth
                                            value={profileForm.status.text}
                                            onChange={(e) => setProfileForm({
                                                ...profileForm,
                                                status: {
                                                    ...profileForm.status,
                                                    text: e.target.value
                                                }
                                            })}
                                        />
                                        <TextField
                                            label="Emoji"
                                            value={profileForm.status.emoji}
                                            onChange={(e) => setProfileForm({
                                                ...profileForm,
                                                status: {
                                                    ...profileForm.status,
                                                    emoji: e.target.value
                                                }
                                            })}
                                            sx={{ width: 100 }}
                                        />
                                    </Box>
                                    <Button
                                        variant="contained"
                                        onClick={handleSaveProfile}
                                        sx={{ alignSelf: 'flex-end' }}
                                    >
                                        Save Changes
                                    </Button>
                                </Box>
                            </motion.div>
                        ) : (
                            <Box>
                                <Typography variant="body1" paragraph>
                                    {user.profile?.bio || 'No bio provided'}
                                </Typography>
                                <Divider sx={{ my: 2 }} />
                                <List>
                                    {user.profile?.links?.map((link) => (
                                        <ListItem key={link.platform}>
                                            <ListItemIcon>
                                                {link.platform === 'github' && <GitHubIcon />}
                                                {link.platform === 'twitter' && <TwitterIcon />}
                                                {link.platform === 'linkedin' && <LinkedInIcon />}
                                                {link.platform === 'website' && <WebsiteIcon />}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={link.platform}
                                                secondary={link.url}
                                            />
                                        </ListItem>
                                    ))}
                                    <ListItem>
                                        <ListItemIcon>
                                            <TimeIcon />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Timezone"
                                            secondary={user.profile?.timezone || 'Not set'}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon>
                                            <TranslateIcon />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Language"
                                            secondary={user.profile?.language || 'English'}
                                        />
                                    </ListItem>
                                </List>
                            </Box>
                        )}
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                Appearance
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    select
                                    label="Theme"
                                    value={preferencesForm.theme}
                                    onChange={(e) => setPreferencesForm({
                                        ...preferencesForm,
                                        theme: e.target.value
                                    })}
                                    SelectProps={{
                                        native: true
                                    }}
                                >
                                    <option value="light">Light</option>
                                    <option value="dark">Dark</option>
                                    <option value="system">System</option>
                                </TextField>
                                <TextField
                                    label="Message Color"
                                    type="color"
                                    value={preferencesForm.messageColor}
                                    onChange={(e) => setPreferencesForm({
                                        ...preferencesForm,
                                        messageColor: e.target.value
                                    })}
                                    sx={{ width: 200 }}
                                />
                                <TextField
                                    select
                                    label="Bubble Style"
                                    value={preferencesForm.bubbleStyle}
                                    onChange={(e) => setPreferencesForm({
                                        ...preferencesForm,
                                        bubbleStyle: e.target.value
                                    })}
                                    SelectProps={{
                                        native: true
                                    }}
                                >
                                    <option value="modern">Modern</option>
                                    <option value="classic">Classic</option>
                                    <option value="minimal">Minimal</option>
                                </TextField>
                            </Box>
                        </Paper>

                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                Notifications
                            </Typography>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={preferencesForm.notifications.sound}
                                        onChange={(e) => setPreferencesForm({
                                            ...preferencesForm,
                                            notifications: {
                                                ...preferencesForm.notifications,
                                                sound: e.target.checked
                                            }
                                        })}
                                    />
                                }
                                label="Sound"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={preferencesForm.notifications.desktop}
                                        onChange={(e) => setPreferencesForm({
                                            ...preferencesForm,
                                            notifications: {
                                                ...preferencesForm.notifications,
                                                desktop: e.target.checked
                                            }
                                        })}
                                    />
                                }
                                label="Desktop Notifications"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={preferencesForm.notifications.email}
                                        onChange={(e) => setPreferencesForm({
                                            ...preferencesForm,
                                            notifications: {
                                                ...preferencesForm.notifications,
                                                email: e.target.checked
                                            }
                                        })}
                                    />
                                }
                                label="Email Notifications"
                            />
                        </Paper>

                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                Privacy
                            </Typography>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={preferencesForm.privacy.showOnlineStatus}
                                        onChange={(e) => setPreferencesForm({
                                            ...preferencesForm,
                                            privacy: {
                                                ...preferencesForm.privacy,
                                                showOnlineStatus: e.target.checked
                                            }
                                        })}
                                    />
                                }
                                label="Show Online Status"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={preferencesForm.privacy.allowFriendRequests}
                                        onChange={(e) => setPreferencesForm({
                                            ...preferencesForm,
                                            privacy: {
                                                ...preferencesForm.privacy,
                                                allowFriendRequests: e.target.checked
                                            }
                                        })}
                                    />
                                }
                                label="Allow Friend Requests"
                            />
                            <TextField
                                select
                                label="Allow Mentions From"
                                value={preferencesForm.privacy.allowMentions}
                                onChange={(e) => setPreferencesForm({
                                    ...preferencesForm,
                                    privacy: {
                                        ...preferencesForm.privacy,
                                        allowMentions: e.target.value
                                    }
                                })}
                                SelectProps={{
                                    native: true
                                }}
                                fullWidth
                                sx={{ mt: 2 }}
                            >
                                <option value="everyone">Everyone</option>
                                <option value="friends">Friends Only</option>
                                <option value="none">No One</option>
                            </TextField>
                        </Paper>

                        <Button
                            variant="contained"
                            onClick={handleSavePreferences}
                            sx={{ alignSelf: 'flex-end' }}
                        >
                            Save Preferences
                        </Button>
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

export default UserProfile; 