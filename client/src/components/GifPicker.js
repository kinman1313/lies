import React, { useState, useEffect } from 'react';
import {
    Box,
    TextField,
    IconButton,
    Paper,
    Typography,
    CircularProgress,
    ImageList,
    ImageListItem,
    InputAdornment,
    Tabs,
    Tab
} from '@mui/material';
import { Search as SearchIcon, Gif as GifIcon, TrendingUp as TrendingIcon } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { searchGifs, getTrendingGifs } from '../utils/giphy';

const GifPicker = ({ onSelect, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [gifs, setGifs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState(0);
    const [debounceTimeout, setDebounceTimeout] = useState(null);

    useEffect(() => {
        loadTrendingGifs();
    }, []);

    const loadTrendingGifs = async () => {
        setLoading(true);
        const trendingGifs = await getTrendingGifs();
        setGifs(trendingGifs);
        setLoading(false);
    };

    const handleSearch = async (query) => {
        if (debounceTimeout) {
            clearTimeout(debounceTimeout);
        }

        setDebounceTimeout(
            setTimeout(async () => {
                if (query.trim()) {
                    setLoading(true);
                    const searchResults = await searchGifs(query);
                    setGifs(searchResults);
                    setLoading(false);
                } else {
                    loadTrendingGifs();
                }
            }, 500)
        );
    };

    const handleGifSelect = (gif) => {
        onSelect({
            url: gif.images.fixed_height.url,
            width: gif.images.fixed_height.width,
            height: gif.images.fixed_height.height
        });
        onClose();
    };

    return (
        <Paper
            sx={{
                width: '100%',
                maxWidth: 500,
                maxHeight: '70vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative'
            }}
        >
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6" gutterBottom>
                    Select a GIF
                </Typography>
                <TextField
                    fullWidth
                    placeholder="Search GIFs..."
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        handleSearch(e.target.value);
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        )
                    }}
                />
                <Tabs
                    value={tab}
                    onChange={(e, newValue) => {
                        setTab(newValue);
                        if (newValue === 1) {
                            loadTrendingGifs();
                            setSearchQuery('');
                        }
                    }}
                    sx={{ mt: 1 }}
                >
                    <Tab icon={<GifIcon />} label="Search" />
                    <Tab icon={<TrendingIcon />} label="Trending" />
                </Tabs>
            </Box>

            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={searchQuery}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ImageList cols={2} gap={8}>
                                {gifs.map((gif) => (
                                    <ImageListItem
                                        key={gif.id}
                                        component={motion.div}
                                        layoutId={gif.id}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        sx={{ cursor: 'pointer' }}
                                        onClick={() => handleGifSelect(gif)}
                                    >
                                        <img
                                            src={gif.images.fixed_height.url}
                                            alt={gif.title}
                                            loading="lazy"
                                            style={{
                                                borderRadius: 1,
                                                width: '100%',
                                                height: 'auto'
                                            }}
                                        />
                                    </ImageListItem>
                                ))}
                            </ImageList>
                        </motion.div>
                    </AnimatePresence>
                )}
            </Box>
        </Paper>
    );
};

export default GifPicker; 