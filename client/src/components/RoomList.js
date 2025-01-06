import React, { useState } from 'react';
import {
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    ListItemSecondaryAction,
    Avatar,
    IconButton,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Tooltip,
    Badge
} from '@mui/material';
import {
    Add as AddIcon,
    Group as GroupIcon,
    Notifications as NotificationIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const RoomList = ({ rooms, onRoomSelect, socket }) => {
    const { user } = useAuth();
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');
    const [error, setError] = useState('');

    const handleCreateRoom = () => {
        if (socket && newRoomName.trim()) {
            socket.emit('createRoom', {
                name: newRoomName.trim(),
                ownerId: user.id
            }, (response) => {
                if (response.success) {
                    setCreateDialogOpen(false);
                    setNewRoomName('');
                } else {
                    setError(response.error || 'Failed to create room');
                }
            });
        }
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <Typography variant="h6">Chat Rooms</Typography>
                <Tooltip title="Create Room">
                    <IconButton onClick={() => setCreateDialogOpen(true)}>
                        <AddIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            <List sx={{ width: '100%' }}>
                {rooms.map((room) => (
                    <ListItem
                        key={room.id}
                        button
                        onClick={() => onRoomSelect(room.id)}
                        sx={{
                            '&:hover': {
                                backgroundColor: 'action.hover'
                            }
                        }}
                    >
                        <ListItemAvatar>
                            <Avatar>
                                <GroupIcon />
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                            primary={room.name}
                            secondary={`${room.memberCount} members`}
                        />
                        {room.unreadCount > 0 && (
                            <ListItemSecondaryAction>
                                <Badge badgeContent={room.unreadCount} color="primary">
                                    <NotificationIcon color="action" />
                                </Badge>
                            </ListItemSecondaryAction>
                        )}
                    </ListItem>
                ))}
            </List>

            {/* Create Room Dialog */}
            <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
                <DialogTitle>Create New Room</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Room Name"
                        type="text"
                        fullWidth
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateRoom} variant="contained">
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default RoomList; 