import React, { useState } from 'react';
import {
    Box,
    Paper,
    Tabs,
    Tab,
    Grid,
    Card,
    CardMedia,
    CardContent,
    Typography,
    IconButton,
    Menu,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemSecondaryAction,
    Tooltip
} from '@mui/material';
import {
    Image as ImageIcon,
    Description as DocumentIcon,
    Movie as VideoIcon,
    AudioFile as AudioIcon,
    Download as DownloadIcon,
    Delete as DeleteIcon,
    MoreVert as MoreIcon,
    Share as ShareIcon,
    OpenInNew as OpenIcon,
    Close as CloseIcon
} from '@mui/icons-material';

// Utility functions
const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (type) => {
    if (type.startsWith('image/')) return <ImageIcon />;
    if (type.startsWith('video/')) return <VideoIcon />;
    if (type.startsWith('audio/')) return <AudioIcon />;
    return <DocumentIcon />;
};

const FileViewer = ({ files, onDelete, onDownload, onShare }) => {
    const [currentTab, setCurrentTab] = useState('all');
    const [viewMode, setViewMode] = useState('grid');
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [menuAnchorEl, setMenuAnchorEl] = useState(null);
    const [activeFile, setActiveFile] = useState(null);

    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
    };

    const handleMenuOpen = (event, file) => {
        setMenuAnchorEl(event.currentTarget);
        setActiveFile(file);
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
        setActiveFile(null);
    };

    const handlePreview = (file) => {
        setSelectedFile(file);
        setPreviewOpen(true);
        handleMenuClose();
    };

    const handleDelete = () => {
        onDelete(activeFile);
        handleMenuClose();
    };

    const handleDownload = () => {
        onDownload(activeFile);
        handleMenuClose();
    };

    const handleShare = () => {
        onShare(activeFile);
        handleMenuClose();
    };

    const filterFiles = () => {
        if (currentTab === 'all') return files;
        return files.filter(file => file.category === currentTab);
    };

    const renderFilePreview = (file) => {
        switch (file.category) {
            case 'image':
                return (
                    <CardMedia
                        component="img"
                        height="140"
                        image={file.thumbnailUrl || file.url}
                        alt={file.originalName}
                    />
                );
            case 'video':
                return (
                    <Box sx={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.200' }}>
                        <VideoIcon sx={{ fontSize: 48, color: 'action.active' }} />
                    </Box>
                );
            case 'audio':
                return (
                    <Box sx={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.200' }}>
                        <AudioIcon sx={{ fontSize: 48, color: 'action.active' }} />
                    </Box>
                );
            default:
                return (
                    <Box sx={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.200' }}>
                        <DocumentIcon sx={{ fontSize: 48, color: 'action.active' }} />
                    </Box>
                );
        }
    };

    const renderGridView = () => (
        <Grid container spacing={2}>
            {filterFiles().map((file) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={file.id}>
                    <Card>
                        {renderFilePreview(file)}
                        <CardContent>
                            <Typography noWrap variant="subtitle1">
                                {file.originalName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {formatFileSize(file.size)}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                                <IconButton size="small" onClick={(e) => handleMenuOpen(e, file)}>
                                    <MoreIcon />
                                </IconButton>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
    );

    const renderListView = () => (
        <List>
            {filterFiles().map((file) => (
                <ListItem key={file.id}>
                    <ListItemIcon>
                        {getFileIcon(file.mimetype)}
                    </ListItemIcon>
                    <ListItemText
                        primary={file.originalName}
                        secondary={`${formatFileSize(file.size)} • ${new Date(file.uploadedAt).toLocaleDateString()}`}
                    />
                    <ListItemSecondaryAction>
                        <IconButton onClick={(e) => handleMenuOpen(e, file)}>
                            <MoreIcon />
                        </IconButton>
                    </ListItemSecondaryAction>
                </ListItem>
            ))}
        </List>
    );

    return (
        <Box>
            <Paper sx={{ mb: 2 }}>
                <Tabs
                    value={currentTab}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    <Tab label="All Files" value="all" />
                    <Tab label="Images" value="image" />
                    <Tab label="Documents" value="document" />
                    <Tab label="Videos" value="video" />
                    <Tab label="Audio" value="audio" />
                </Tabs>
            </Paper>

            {viewMode === 'grid' ? renderGridView() : renderListView()}

            {/* File Actions Menu */}
            <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={() => handlePreview(activeFile)}>
                    <ListItemIcon>
                        <OpenIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Preview" />
                </MenuItem>
                <MenuItem onClick={handleDownload}>
                    <ListItemIcon>
                        <DownloadIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Download" />
                </MenuItem>
                <MenuItem onClick={handleShare}>
                    <ListItemIcon>
                        <ShareIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Share" />
                </MenuItem>
                <MenuItem onClick={handleDelete}>
                    <ListItemIcon>
                        <DeleteIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Delete" />
                </MenuItem>
            </Menu>

            {/* Preview Dialog */}
            <Dialog
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>
                    {selectedFile?.originalName}
                    <IconButton
                        onClick={() => setPreviewOpen(false)}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    {selectedFile?.category === 'image' && (
                        <Box
                            component="img"
                            src={selectedFile.url}
                            alt={selectedFile.originalName}
                            sx={{
                                width: '100%',
                                height: 'auto',
                                maxHeight: '80vh',
                                objectFit: 'contain'
                            }}
                        />
                    )}
                    {selectedFile?.category === 'video' && (
                        <Box
                            component="video"
                            src={selectedFile.url}
                            controls
                            sx={{
                                width: '100%',
                                maxHeight: '80vh'
                            }}
                        />
                    )}
                    {selectedFile?.category === 'audio' && (
                        <Box
                            component="audio"
                            src={selectedFile.url}
                            controls
                            sx={{ width: '100%' }}
                        />
                    )}
                    {selectedFile?.category === 'document' && (
                        <iframe
                            src={selectedFile.url}
                            width="100%"
                            height="600px"
                            title={selectedFile.originalName}
                        />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDownload} startIcon={<DownloadIcon />}>
                        Download
                    </Button>
                    <Button onClick={handleShare} startIcon={<ShareIcon />}>
                        Share
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default FileViewer; 