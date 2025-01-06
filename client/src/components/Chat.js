import React, { useState } from 'react';
import {
    Box,
    Drawer,
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Avatar,
    Badge,
    Divider,
    useTheme,
    useMediaQuery
} from '@mui/material';
import {
    Menu as MenuIcon,
    ExitToApp as LogoutIcon,
    Settings as SettingsIcon,
    Chat as ChatIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import ChatRoom from './ChatRoom';
import ChatLobby from './ChatLobby';
import UserProfile from './UserProfile';

const DRAWER_WIDTH = 240;

const Chat = () => {
    const { user, logout } = useAuth();
    const { socket } = useSocket();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [mobileOpen, setMobileOpen] = useState(false);
    const [activeRoom, setActiveRoom] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    const [rooms, setRooms] = useState([]);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleCreateRoom = () => {
        // Implement room creation logic
    };

    const handleJoinRoom = (roomId) => {
        setActiveRoom(roomId);
        if (isMobile) {
            setMobileOpen(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const drawer = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* User Profile Section */}
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    variant="dot"
                    color="success"
                >
                    <Avatar src={user?.profile?.avatar?.url}>
                        {user?.username ? user.username[0].toUpperCase() : '?'}
                    </Avatar>
                </Badge>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" noWrap>
                        {user?.username}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                        Online
                    </Typography>
                </Box>
            </Box>

            <Divider />

            {/* Navigation List */}
            <List sx={{ flex: 1, overflow: 'auto' }}>
                <ListItem button onClick={() => setActiveRoom(null)}>
                    <ListItemIcon>
                        <ChatIcon />
                    </ListItemIcon>
                    <ListItemText primary="General Lobby" />
                </ListItem>
                {rooms.map((room) => (
                    <ListItem
                        key={room.id}
                        button
                        selected={activeRoom === room.id}
                        onClick={() => handleJoinRoom(room.id)}
                    >
                        <ListItemIcon>
                            <Avatar sx={{ width: 32, height: 32 }}>
                                {room.name[0].toUpperCase()}
                            </Avatar>
                        </ListItemIcon>
                        <ListItemText
                            primary={room.name}
                            secondary={`${room.members.length} members`}
                            primaryTypographyProps={{ noWrap: true }}
                            secondaryTypographyProps={{ noWrap: true }}
                        />
                    </ListItem>
                ))}
            </List>

            <Divider />

            {/* Bottom Actions */}
            <List>
                <ListItem button onClick={() => setShowSettings(true)}>
                    <ListItemIcon>
                        <SettingsIcon />
                    </ListItemIcon>
                    <ListItemText primary="Settings" />
                </ListItem>
                <ListItem button onClick={handleLogout}>
                    <ListItemIcon>
                        <LogoutIcon />
                    </ListItemIcon>
                    <ListItemText primary="Logout" />
                </ListItem>
            </List>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', height: '100vh' }}>
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
                    ml: { sm: `${DRAWER_WIDTH}px` }
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div">
                        {activeRoom ? 'Chat Room' : 'General Lobby'}
                    </Typography>
                </Toolbar>
            </AppBar>

            <Box
                component="nav"
                sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}
            >
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: DRAWER_WIDTH
                        }
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: DRAWER_WIDTH
                        }
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 0,
                    width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    pt: { xs: 7, sm: 8 }
                }}
            >
                {activeRoom ? (
                    <ChatRoom
                        roomId={activeRoom}
                        socket={socket}
                        onClose={() => setActiveRoom(null)}
                    />
                ) : (
                    <ChatLobby
                        socket={socket}
                        onCreateRoom={handleCreateRoom}
                        onJoinRoom={handleJoinRoom}
                        onOpenSettings={() => setShowSettings(true)}
                    />
                )}
            </Box>

            {/* Settings Dialog */}
            {showSettings && (
                <UserProfile
                    user={user}
                    onClose={() => setShowSettings(false)}
                    onUpdateProfile={(profile) => {
                        // Implement profile update
                    }}
                    onUpdatePreferences={(preferences) => {
                        // Implement preferences update
                    }}
                    onUpdateAvatar={(avatar) => {
                        // Implement avatar update
                    }}
                />
            )}
        </Box>
    );
};

export default Chat; 