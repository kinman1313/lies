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
    const [activeTab, setActiveTab] = useState('profile');

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Avatar
                    src={user?.profile?.avatar?.url}
                    sx={{ width: 80, height: 80, mx: 'auto', mb: 1 }}
                >
                    {user?.username ? user.username[0].toUpperCase() : '?'}
                </Avatar>
                <Typography variant="h6" gutterBottom>
                    {user?.username || 'Unknown User'}
                </Typography>
                {user?.profile?.status?.text && (
                    <Typography variant="body2" color="text.secondary">
                        {user.profile.status.text}
                    </Typography>
                )}
            </Box>

            <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                variant="fullWidth"
                sx={{ mb: 2 }}
            >
                <Tab label="Profile" value="profile" />
                <Tab label="Settings" value="settings" />
            </Tabs>

            {activeTab === 'profile' && (
                <Box>
                    {user?.profile?.bio && (
                        <Typography variant="body2" paragraph>
                            {user.profile.bio}
                        </Typography>
                    )}

                    <List dense>
                        {user?.profile?.timezone && (
                            <ListItem>
                                <ListItemIcon>
                                    <TimeIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Timezone"
                                    secondary={user.profile.timezone}
                                />
                            </ListItem>
                        )}
                        {user?.profile?.language && (
                            <ListItem>
                                <ListItemIcon>
                                    <TranslateIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Language"
                                    secondary={user.profile.language}
                                />
                            </ListItem>
                        )}
                    </List>
                </Box>
            )}

            {activeTab === 'settings' && (
                <List dense>
                    <ListItem>
                        <ListItemIcon>
                            <PaletteIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                            primary="Theme"
                            secondary={user?.preferences?.theme || 'System'}
                        />
                    </ListItem>
                    <ListItem>
                        <ListItemIcon>
                            <NotificationsIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                            primary="Notifications"
                            secondary={user?.preferences?.notifications?.sound ? 'On' : 'Off'}
                        />
                    </ListItem>
                    <ListItem>
                        <ListItemIcon>
                            <LockIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                            primary="Privacy"
                            secondary={user?.preferences?.privacy?.showOnlineStatus ? 'Public' : 'Private'}
                        />
                    </ListItem>
                </List>
            )}
        </Box>
    );
};

export default UserProfile; 