import React, { useState, useEffect, useRef } from 'react';
import { Box, Drawer, useMediaQuery, useTheme, IconButton, Divider } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import RoomList from './RoomList';
import ChatRoom from './ChatRoom';
import UserProfile from './UserProfile';

const Chat = () => {
    const { socket } = useSocket();
    const { user } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [rooms, setRooms] = useState([]);
    const [currentRoomId, setCurrentRoomId] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(!isMobile);
    const [error, setError] = useState('');

    useEffect(() => {
        if (socket) {
            loadRooms();

            socket.on('roomListUpdate', loadRooms);
            socket.on('roomDeleted', handleRoomDeleted);

            return () => {
                socket.off('roomListUpdate');
                socket.off('roomDeleted');
            };
        }
    }, [socket]);

    const loadRooms = async () => {
        socket.emit('getRooms', (response) => {
            if (response.success) {
                setRooms(response.rooms);
                // If no room is selected and rooms exist, select the first one
                if (!currentRoomId && response.rooms.length > 0) {
                    setCurrentRoomId(response.rooms[0]._id);
                }
            } else {
                setError('Failed to load rooms');
            }
        });
    };

    const handleRoomSelect = (roomId) => {
        setCurrentRoomId(roomId);
        if (isMobile) {
            setDrawerOpen(false);
        }
    };

    const handleRoomDeleted = ({ roomId }) => {
        if (currentRoomId === roomId) {
            setCurrentRoomId(null);
        }
    };

    const handleLeaveRoom = () => {
        setCurrentRoomId(null);
        if (isMobile) {
            setDrawerOpen(true);
        }
    };

    const drawerContent = (
        <Box sx={{ width: 320, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <UserProfile />
            <Divider />
            <RoomList
                rooms={rooms}
                onRoomSelect={handleRoomSelect}
                socket={socket}
            />
        </Box>
    );

    return (
        <Box sx={{ height: '100vh', display: 'flex' }}>
            {/* Room List Drawer */}
            {isMobile ? (
                <Drawer
                    open={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                    sx={{
                        '& .MuiDrawer-paper': {
                            width: 320,
                            boxSizing: 'border-box'
                        }
                    }}
                >
                    {drawerContent}
                </Drawer>
            ) : (
                <Box sx={{
                    width: 320,
                    flexShrink: 0,
                    borderRight: 1,
                    borderColor: 'divider'
                }}>
                    {drawerContent}
                </Box>
            )}

            {/* Chat Area */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                {isMobile && (
                    <IconButton
                        sx={{ position: 'absolute', top: 8, left: 8, zIndex: 1 }}
                        onClick={() => setDrawerOpen(true)}
                    >
                        <MenuIcon />
                    </IconButton>
                )}

                {currentRoomId ? (
                    <ChatRoom
                        roomId={currentRoomId}
                        onLeaveRoom={handleLeaveRoom}
                        socket={socket}
                    />
                ) : (
                    <Box
                        sx={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        Select a room or create a new one to start chatting
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default Chat; 