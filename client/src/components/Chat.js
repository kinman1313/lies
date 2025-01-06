import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import EncryptionService from '../services/EncryptionService';
import RoomList from './RoomList';
import ChatRoom from './ChatRoom';
import UserProfile from './UserProfile';
import ThemeMenu from './ThemeMenu';
import './Chat.css';

const Chat = ({ user, onLogout }) => {
    const { socket } = useSocket();
    const [currentRoom, setCurrentRoom] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [showProfile, setShowProfile] = useState(false);
    const [showThemeMenu, setShowThemeMenu] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        // Initialize encryption service
        const initializeEncryption = async () => {
            try {
                await EncryptionService.initialize(user._id);
            } catch (error) {
                console.error('Failed to initialize encryption:', error);
                setError('Failed to initialize secure messaging');
            }
        };

        initializeEncryption();

        return () => {
            EncryptionService.cleanup();
        };
    }, [user, navigate]);

    useEffect(() => {
        if (socket) {
            // Load user's rooms
            socket.emit('getRooms', {}, async (response) => {
                if (response.success) {
                    setRooms(response.rooms);
                    if (response.rooms.length > 0) {
                        setCurrentRoom(response.rooms[0]);
                    }
                } else {
                    setError('Failed to load rooms');
                }
            });

            // Handle new messages
            socket.on('newMessage', async (message) => {
                try {
                    // Decrypt the message
                    const decryptedContent = await EncryptionService.decryptMessage(
                        message.senderId,
                        message.encryptedContent
                    );

                    // Update the room's messages
                    setRooms(prevRooms => {
                        const updatedRooms = prevRooms.map(room => {
                            if (room._id === message.roomId) {
                                return {
                                    ...room,
                                    messages: [...(room.messages || []), {
                                        ...message,
                                        content: decryptedContent
                                    }]
                                };
                            }
                            return room;
                        });
                        return updatedRooms;
                    });

                    scrollToBottom();
                } catch (error) {
                    console.error('Error handling new message:', error);
                }
            });

            // Handle message updates
            socket.on('messageUpdated', async (data) => {
                try {
                    const { messageId, roomId, encryptedContent } = data;
                    const decryptedContent = await EncryptionService.decryptMessage(
                        data.senderId,
                        encryptedContent
                    );

                    setRooms(prevRooms => {
                        const updatedRooms = prevRooms.map(room => {
                            if (room._id === roomId) {
                                const updatedMessages = room.messages.map(msg => {
                                    if (msg._id === messageId) {
                                        return {
                                            ...msg,
                                            content: decryptedContent,
                                            editedAt: data.editedAt
                                        };
                                    }
                                    return msg;
                                });
                                return { ...room, messages: updatedMessages };
                            }
                            return room;
                        });
                        return updatedRooms;
                    });
                } catch (error) {
                    console.error('Error handling message update:', error);
                }
            });

            // Handle message deletions
            socket.on('messageDeleted', (data) => {
                const { messageId, roomId } = data;
                setRooms(prevRooms => {
                    const updatedRooms = prevRooms.map(room => {
                        if (room._id === roomId) {
                            const updatedMessages = room.messages.filter(
                                msg => msg._id !== messageId
                            );
                            return { ...room, messages: updatedMessages };
                        }
                        return room;
                    });
                    return updatedRooms;
                });
            });

            // Handle room updates
            socket.on('roomUpdated', (room) => {
                setRooms(prevRooms => {
                    const updatedRooms = prevRooms.map(r => {
                        if (r._id === room._id) {
                            return { ...r, ...room };
                        }
                        return r;
                    });
                    return updatedRooms;
                });
            });

            return () => {
                socket.off('newMessage');
                socket.off('messageUpdated');
                socket.off('messageDeleted');
                socket.off('roomUpdated');
            };
        }
    }, [socket]);

    const handleSendMessage = async (roomId, content, type = 'text') => {
        if (!socket || !content.trim()) return;

        try {
            // Get all room members
            const room = rooms.find(r => r._id === roomId);
            if (!room) return;

            // Encrypt message for each member
            const encryptedMessages = {};
            for (const memberId of room.members) {
                if (memberId !== user._id) {
                    const encrypted = await EncryptionService.encryptMessage(
                        memberId,
                        { content, type }
                    );
                    encryptedMessages[memberId] = encrypted;
                }
            }

            // Send encrypted message
            socket.emit('sendMessage', {
                roomId,
                type,
                encryptedMessages
            }, (response) => {
                if (!response.success) {
                    setError('Failed to send message');
                }
            });
        } catch (error) {
            console.error('Error sending message:', error);
            setError('Failed to send message');
        }
    };

    const handleCreateRoom = (name) => {
        if (!socket) return;

        socket.emit('createRoom', { name }, (response) => {
            if (response.success) {
                setRooms(prevRooms => [...prevRooms, response.room]);
                setCurrentRoom(response.room);
            } else {
                setError('Failed to create room');
            }
        });
    };

    const handleJoinRoom = (roomId) => {
        if (!socket) return;

        socket.emit('joinRoom', { roomId }, (response) => {
            if (response.success) {
                setCurrentRoom(response.room);
            } else {
                setError('Failed to join room');
            }
        });
    };

    const handleLeaveRoom = (roomId) => {
        if (!socket) return;

        socket.emit('leaveRoom', { roomId }, (response) => {
            if (response.success) {
                setRooms(prevRooms => prevRooms.filter(r => r._id !== roomId));
                setCurrentRoom(null);
            } else {
                setError('Failed to leave room');
            }
        });
    };

    const handleDeleteRoom = (roomId) => {
        if (!socket) return;

        socket.emit('deleteRoom', { roomId }, (response) => {
            if (response.success) {
                setRooms(prevRooms => prevRooms.filter(r => r._id !== roomId));
                setCurrentRoom(null);
            } else {
                setError('Failed to delete room');
            }
        });
    };

    const handleInviteUser = (roomId, email) => {
        if (!socket) return;

        socket.emit('inviteToRoom', { roomId, email }, (response) => {
            if (!response.success) {
                setError('Failed to send invite');
            }
        });
    };

    const handleUpdateProfile = async (updates) => {
        try {
            const response = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(updates)
            });

            if (response.ok) {
                const updatedUser = await response.json();
                // Update user context/state
                onUpdateUser(updatedUser);
                setShowProfile(false);
            } else {
                setError('Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            setError('Failed to update profile');
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="chat-container">
            <div className="sidebar">
                <div className="user-controls">
                    <button onClick={() => setShowProfile(true)}>Profile</button>
                    <button onClick={() => setShowThemeMenu(true)}>Theme</button>
                    <button onClick={onLogout}>Logout</button>
                </div>
                <RoomList
                    rooms={rooms}
                    currentRoom={currentRoom}
                    onCreateRoom={handleCreateRoom}
                    onJoinRoom={handleJoinRoom}
                    onLeaveRoom={handleLeaveRoom}
                    onDeleteRoom={handleDeleteRoom}
                />
            </div>
            <div className="chat-main">
                {currentRoom ? (
                    <ChatRoom
                        room={currentRoom}
                        user={user}
                        onSendMessage={handleSendMessage}
                        onInviteUser={handleInviteUser}
                        messagesEndRef={messagesEndRef}
                    />
                ) : (
                    <div className="no-room-selected">
                        Select a room to start chatting
                    </div>
                )}
            </div>
            {showProfile && (
                <UserProfile
                    user={user}
                    onClose={() => setShowProfile(false)}
                    onUpdate={handleUpdateProfile}
                />
            )}
            {showThemeMenu && (
                <ThemeMenu
                    onClose={() => setShowThemeMenu(false)}
                />
            )}
            {error && (
                <div className="error-message">
                    {error}
                    <button onClick={() => setError(null)}>Dismiss</button>
                </div>
            )}
        </div>
    );
};

export default Chat; 