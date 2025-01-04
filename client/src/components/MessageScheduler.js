import React, { useState } from 'react';
import {
    Box,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Tooltip,
    Paper,
    Switch,
    FormControlLabel,
    Divider
} from '@mui/material';
import {
    Schedule as ScheduleIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    CalendarToday as CalendarIcon,
    AccessTime as TimeIcon,
    Repeat as RepeatIcon
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { motion, AnimatePresence } from 'framer-motion';

const MessageScheduler = ({
    onSchedule,
    onEdit,
    onDelete,
    scheduledMessages = []
}) => {
    const [open, setOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [message, setMessage] = useState('');
    const [repeat, setRepeat] = useState({
        enabled: false,
        interval: 'daily',
        endDate: null
    });
    const [editingMessage, setEditingMessage] = useState(null);

    const handleOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setMessage('');
        setSelectedDate(new Date());
        setRepeat({
            enabled: false,
            interval: 'daily',
            endDate: null
        });
        setEditingMessage(null);
    };

    const handleSchedule = () => {
        const scheduleData = {
            message,
            scheduledFor: selectedDate,
            repeat: repeat.enabled ? repeat : null,
            id: editingMessage ? editingMessage.id : Date.now()
        };

        if (editingMessage) {
            onEdit(scheduleData);
        } else {
            onSchedule(scheduleData);
        }

        handleClose();
    };

    const handleEdit = (message) => {
        setEditingMessage(message);
        setMessage(message.message);
        setSelectedDate(new Date(message.scheduledFor));
        setRepeat(message.repeat || {
            enabled: false,
            interval: 'daily',
            endDate: null
        });
        setOpen(true);
    };

    const formatDateTime = (date) => {
        return new Date(date).toLocaleString();
    };

    const getRepeatText = (repeat) => {
        if (!repeat || !repeat.enabled) return '';
        return `Repeats ${repeat.interval}${repeat.endDate ? ` until ${formatDateTime(repeat.endDate)}` : ''}`;
    };

    return (
        <>
            <Tooltip title="Schedule Message">
                <IconButton onClick={handleOpen} color="primary">
                    <ScheduleIcon />
                </IconButton>
            </Tooltip>

            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    component: motion.div,
                    initial: { y: 20, opacity: 0 },
                    animate: { y: 0, opacity: 1 },
                    exit: { y: 20, opacity: 0 }
                }}
            >
                <DialogTitle>
                    {editingMessage ? 'Edit Scheduled Message' : 'Schedule Message'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
                        <TextField
                            label="Message"
                            multiline
                            rows={4}
                            fullWidth
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />

                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DateTimePicker
                                label="Schedule For"
                                value={selectedDate}
                                onChange={(newValue) => setSelectedDate(newValue)}
                                renderInput={(params) => <TextField {...params} />}
                                minDateTime={new Date()}
                            />
                        </LocalizationProvider>

                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={repeat.enabled}
                                        onChange={(e) => setRepeat({
                                            ...repeat,
                                            enabled: e.target.checked
                                        })}
                                    />
                                }
                                label="Repeat Message"
                            />

                            {repeat.enabled && (
                                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <TextField
                                        select
                                        label="Repeat Interval"
                                        value={repeat.interval}
                                        onChange={(e) => setRepeat({
                                            ...repeat,
                                            interval: e.target.value
                                        })}
                                        SelectProps={{
                                            native: true
                                        }}
                                    >
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </TextField>

                                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                                        <DateTimePicker
                                            label="End Date (Optional)"
                                            value={repeat.endDate}
                                            onChange={(newValue) => setRepeat({
                                                ...repeat,
                                                endDate: newValue
                                            })}
                                            renderInput={(params) => <TextField {...params} />}
                                            minDateTime={selectedDate}
                                        />
                                    </LocalizationProvider>
                                </Box>
                            )}
                        </Paper>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button
                        onClick={handleSchedule}
                        variant="contained"
                        disabled={!message.trim() || !selectedDate}
                    >
                        {editingMessage ? 'Update' : 'Schedule'}
                    </Button>
                </DialogActions>
            </Dialog>

            <AnimatePresence>
                {scheduledMessages.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <Paper
                            variant="outlined"
                            sx={{ mt: 2, overflow: 'hidden' }}
                        >
                            <List dense>
                                {scheduledMessages.map((msg, index) => (
                                    <React.Fragment key={msg.id}>
                                        <ListItem>
                                            <ListItemText
                                                primary={msg.message}
                                                secondary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <CalendarIcon fontSize="small" />
                                                        <Typography variant="caption">
                                                            {formatDateTime(msg.scheduledFor)}
                                                        </Typography>
                                                        {msg.repeat?.enabled && (
                                                            <>
                                                                <RepeatIcon fontSize="small" />
                                                                <Typography variant="caption">
                                                                    {getRepeatText(msg.repeat)}
                                                                </Typography>
                                                            </>
                                                        )}
                                                    </Box>
                                                }
                                            />
                                            <ListItemSecondaryAction>
                                                <IconButton
                                                    edge="end"
                                                    onClick={() => handleEdit(msg)}
                                                    sx={{ mr: 1 }}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton
                                                    edge="end"
                                                    onClick={() => onDelete(msg.id)}
                                                    color="error"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                        {index < scheduledMessages.length - 1 && <Divider />}
                                    </React.Fragment>
                                ))}
                            </List>
                        </Paper>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default MessageScheduler; 