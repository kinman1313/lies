import React, { useState, useEffect } from 'react';
import {
    Box,
    TextField,
    IconButton,
    ImageList,
    ImageListItem,
    Paper,
    Typography,
    CircularProgress
} from '@mui/material';
import {
    Search as SearchIcon,
    Close as CloseIcon
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
            const queryParams = new URLSearchParams({
                api_key: GIPHY_API_KEY,
                limit: 20,
                ...params
            });
            const response = await fetch(`${GIPHY_API_URL}/${endpoint}?${queryParams}`);
            const data = await response.json();
            setGifs(data.data);
        } catch (err) {
            setError('Failed to load GIFs');
            console.error('Error fetching GIFs:', err);
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
            fetchGifs('search', { q: searchQuery });
        }
    };

    return (
        <Paper
            elevation={3}
            sx={{
                p: 2,
                maxHeight: 400,
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex', gap: 8 }}>
                    <TextField
                        fullWidth
                        size="small"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search GIFs..."
                        variant="outlined"
                    />
                    <IconButton type="submit" color="primary">
                        <SearchIcon />
                    </IconButton>
                </form>
                <IconButton onClick={onClose}>
                    <CloseIcon />
                </IconButton>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Typography color="error" align="center">
                    {error}
                </Typography>
            ) : (
                <Box sx={{ overflow: 'auto' }}>
                    <ImageList cols={3} gap={8}>
                        {gifs.map((gif) => (
                            <ImageListItem
                                key={gif.id}
                                sx={{
                                    cursor: 'pointer',
                                    '&:hover': {
                                        opacity: 0.8
                                    }
                                }}
                                onClick={() => onSelect(gif.images.fixed_height)}
                            >
                                <img
                                    src={gif.images.fixed_height.url}
                                    alt={gif.title}
                                    loading="lazy"
                                    style={{
                                        borderRadius: 4,
                                        maxHeight: 150,
                                        width: '100%',
                                        objectFit: 'cover'
                                    }}
                                />
                            </ImageListItem>
                        ))}
                    </ImageList>
                </Box>
            )}
        </Paper>
    );
};

export default GifPicker; 