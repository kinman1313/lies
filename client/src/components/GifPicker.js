import React, { useState, useEffect } from 'react';
import {
    Box,
    TextField,
    ImageList,
    ImageListItem,
    Typography,
    CircularProgress,
    InputAdornment,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button
} from '@mui/material';
import {
    Search as SearchIcon
} from '@mui/icons-material';

const GIPHY_API_KEY = 'DO7ARGJtRRks2yxeAvolAIBFJqM74EPV';
const GIPHY_API_URL = 'https://api.giphy.com/v1/gifs';

const GifPicker = ({ onSelect, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [gifs, setGifs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchGifs = async (endpoint, params) => {
        try {
            setLoading(true);
            setError(null);
            console.log('Fetching GIFs...');

            const queryParams = new URLSearchParams({
                api_key: GIPHY_API_KEY,
                limit: 20,
                rating: 'g',
                ...params
            });

            const url = `${GIPHY_API_URL}/${endpoint}?${queryParams}`;
            console.log('Fetching from URL:', url);

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch GIFs: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Received GIF data:', data);

            if (!data.data || !Array.isArray(data.data)) {
                throw new Error('Invalid response format from Giphy API');
            }

            setGifs(data.data.map(gif => ({
                id: gif.id,
                url: gif.images.fixed_height.url,
                width: parseInt(gif.images.fixed_height.width),
                height: parseInt(gif.images.fixed_height.height),
                title: gif.title
            })));
        } catch (err) {
            console.error('Error fetching GIFs:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        console.log('GifPicker mounted, fetching trending GIFs...');
        fetchGifs('trending');
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            console.log('Searching for GIFs:', searchQuery);
            fetchGifs('search', { q: searchQuery.trim() });
        }
    };

    const handleGifSelect = (gif) => {
        console.log('Selected GIF:', gif);
        onSelect({
            type: 'gif',
            content: gif.url,
            metadata: {
                width: gif.width,
                height: gif.height,
                title: gif.title
            }
        });
        onClose();
    };

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            maxHeight: '60vh',
            width: '100%',
            maxWidth: '500px',
            margin: '0 auto'
        }}>
            <DialogTitle>Select a GIF</DialogTitle>
            <DialogContent dividers>
                <Box sx={{ mb: 2 }}>
                    <form onSubmit={handleSearch}>
                        <TextField
                            fullWidth
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search GIFs..."
                            variant="outlined"
                            size="small"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                )
                            }}
                        />
                    </form>
                </Box>

                <Box sx={{
                    height: '400px',
                    overflow: 'auto'
                }}>
                    {error ? (
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '100%'
                        }}>
                            <Typography color="error">{error}</Typography>
                        </Box>
                    ) : loading ? (
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '100%'
                        }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <ImageList cols={2} gap={8}>
                            {gifs.map((gif) => (
                                <ImageListItem
                                    key={gif.id}
                                    onClick={() => handleGifSelect(gif)}
                                    sx={{
                                        cursor: 'pointer',
                                        overflow: 'hidden',
                                        borderRadius: 1,
                                        '&:hover': {
                                            opacity: 0.8,
                                            transform: 'scale(0.98)',
                                            transition: 'all 0.2s ease-in-out'
                                        }
                                    }}
                                >
                                    <img
                                        src={gif.url}
                                        alt={gif.title}
                                        loading="lazy"
                                        style={{
                                            width: '100%',
                                            height: 'auto',
                                            objectFit: 'cover'
                                        }}
                                    />
                                </ImageListItem>
                            ))}
                        </ImageList>
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
            </DialogActions>
        </Box>
    );
};

export default GifPicker; 