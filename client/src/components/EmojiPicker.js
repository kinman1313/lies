import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';

const EMOJI_LIST = [
    '👍', '❤️', '😂', '😮', '😢', '😡',
    '🎉', '👏', '🙏', '🤔', '👌', '🔥'
];

const EmojiPicker = ({ onSelect }) => {
    return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {EMOJI_LIST.map((emoji, index) => (
                <Tooltip key={index} title={`React with ${emoji}`}>
                    <IconButton
                        size="small"
                        onClick={() => onSelect(emoji)}
                        sx={{
                            fontSize: '1.2rem',
                            padding: '4px',
                            '&:hover': {
                                backgroundColor: 'action.hover'
                            }
                        }}
                    >
                        {emoji}
                    </IconButton>
                </Tooltip>
            ))}
        </Box>
    );
};

export default EmojiPicker; 