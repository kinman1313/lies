import React, { useState, useEffect } from 'react';
import {
    Box,
    TextField,
    ImageList,
    ImageListItem,
    Typography,
    CircularProgress,
    InputAdornment
} from '@mui/material';
import {
    Search as SearchIcon
} from '@mui/icons-material';

const GIPHY_API_KEY = process.env.REACT_APP_GIPHY_API_KEY;
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
            console.log('Fetching GIFs with API key:', GIPHY_API_KEY);

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
                const errorData = await response.json();
                console.error('Giphy API error:', errorData);
                throw new Error(`Failed to fetch GIFs: ${errorData.message || response.statusText}`);
            }

            const data = await response.json();
            console.log('Received GIF data:', data);

            if (!data.data || !Array.isArray(data.data)) {
                throw new Error('Invalid response format from Giphy API');
            }

            setGifs(data.data);
        } catch (err) {
            console.error('Error in fetchGifs:', err);
            setError(err.message || 'Failed to load GIFs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGifs('trending');
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            fetchGifs('search', { q: searchQuery.trim() });
        }
    };

    const handleGifSelect = (gif) => {
        if (!gif.images?.fixed_height?.url) {
            console.error('Invalid GIF data:', gif);
            return;
        }

        onSelect({
            url: gif.images.fixed_height.url,
            width: gif.images.fixed_height.width,
            height: gif.images.fixed_height.height,
            title: gif.title
        });
    };

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            maxHeight: '60vh',
            overflow: 'hidden'
        }}>
            <Box sx={{
                p: 2,
                borderBottom: 1,
                borderColor: 'divider'
            }}>
                <form onSubmit={handleSearch} style={{ width: '100%' }}>
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
                flex: 1,
                overflow: 'auto',
                p: 2
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
                    <ImageList
                        cols={2}
                        gap={8}
                        sx={{
                            m: 0,
                            width: '100%',
                            height: '100%'
                        }}
                    >
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
                                    src={gif.images.fixed_height.url}
                                    alt={gif.title}
                                    loading="lazy"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                    }}
                                />
                            </ImageListItem>
                        ))}
                    </ImageList>
                )}
            </Box>
        </Box>
    );
};

export default GifPicker; 