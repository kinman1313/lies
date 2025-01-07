import { createTheme, alpha } from '@mui/material';

export const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#7C4DFF',
            light: '#B47CFF',
            dark: '#5C35CC',
            gradient: 'linear-gradient(135deg, #7C4DFF 0%, #00E5FF 100%)'
        },
        secondary: {
            main: '#00E5FF',
            light: '#6EFFFF',
            dark: '#00B2CC'
        },
        background: {
            default: '#0A1929',
            paper: 'rgba(19, 47, 76, 0.4)',
            gradient: 'linear-gradient(135deg, rgba(19,47,76,0.95) 0%, rgba(10,25,41,0.95) 100%)',
            overlay: 'linear-gradient(180deg, rgba(10,25,41,0.8) 0%, rgba(19,47,76,0.8) 100%)',
            highlight: 'rgba(124, 77, 255, 0.08)'
        },
        text: {
            primary: '#FFFFFF',
            secondary: 'rgba(255, 255, 255, 0.7)',
            disabled: 'rgba(255, 255, 255, 0.4)'
        },
        divider: 'rgba(255, 255, 255, 0.08)'
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    background: '#0A1929',
                    minHeight: '100vh',
                    backgroundImage: `
                        radial-gradient(at 40% 20%, rgba(124, 77, 255, 0.15) 0px, transparent 50%),
                        radial-gradient(at 80% 0%, rgba(0, 229, 255, 0.1) 0px, transparent 50%),
                        radial-gradient(at 0% 50%, rgba(124, 77, 255, 0.1) 0px, transparent 50%)
                    `,
                    backgroundAttachment: 'fixed'
                }
            }
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    backgroundColor: 'rgba(19, 47, 76, 0.4)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: `
                        0 4px 30px rgba(0, 0, 0, 0.1),
                        inset 0 0 0 1px rgba(255, 255, 255, 0.05)
                    `,
                    '&:hover': {
                        boxShadow: `
                            0 4px 30px rgba(0, 0, 0, 0.15),
                            inset 0 0 0 1px rgba(255, 255, 255, 0.08)
                        `
                    }
                }
            }
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    background: 'rgba(19, 47, 76, 0.8)',
                    backdropFilter: 'blur(20px)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
                }
            }
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontWeight: 600,
                    transition: 'all 0.2s ease-in-out'
                },
                contained: {
                    background: 'linear-gradient(135deg, #7C4DFF 0%, #00E5FF 100%)',
                    boxShadow: '0 4px 20px rgba(124, 77, 255, 0.25)',
                    '&:hover': {
                        background: 'linear-gradient(135deg, #B47CFF 0%, #6EFFFF 100%)',
                        boxShadow: '0 4px 25px rgba(124, 77, 255, 0.35)',
                        transform: 'translateY(-1px)'
                    },
                    '&:active': {
                        transform: 'translateY(0)'
                    }
                },
                outlined: {
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    '&:hover': {
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        background: 'rgba(255, 255, 255, 0.05)'
                    }
                }
            }
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '12px',
                        transition: 'all 0.2s ease-in-out',
                        '& fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                            transition: 'all 0.2s ease-in-out'
                        },
                        '&:hover fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.2)'
                        },
                        '&.Mui-focused': {
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            '& fieldset': {
                                borderColor: '#7C4DFF',
                                borderWidth: '2px'
                            }
                        }
                    }
                }
            }
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    background: 'rgba(19, 47, 76, 0.95)',
                    backdropFilter: 'blur(20px)',
                    borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '4px 0 30px rgba(0, 0, 0, 0.1)'
                }
            }
        },
        MuiListItem: {
            styleOverrides: {
                root: {
                    borderRadius: '12px',
                    margin: '4px 8px',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                        backgroundColor: 'rgba(124, 77, 255, 0.08)',
                        transform: 'translateX(4px)'
                    }
                }
            }
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: '16px',
                    background: 'rgba(19, 47, 76, 0.4)',
                    backdropFilter: 'blur(20px)',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)'
                    }
                }
            }
        },
        MuiIconButton: {
            styleOverrides: {
                root: {
                    borderRadius: '12px',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                        background: 'rgba(124, 77, 255, 0.08)',
                        transform: 'translateY(-1px)'
                    }
                }
            }
        }
    },
    shape: {
        borderRadius: 12
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontWeight: 700,
            letterSpacing: '-0.02em'
        },
        h2: {
            fontWeight: 700,
            letterSpacing: '-0.01em'
        },
        h3: {
            fontWeight: 700,
            letterSpacing: '-0.01em'
        },
        h4: {
            fontWeight: 600,
            letterSpacing: '-0.01em'
        },
        h5: {
            fontWeight: 600
        },
        h6: {
            fontWeight: 600
        },
        subtitle1: {
            fontWeight: 500,
            letterSpacing: '0.01em'
        },
        subtitle2: {
            fontWeight: 500,
            letterSpacing: '0.01em'
        },
        body1: {
            letterSpacing: '0.01em'
        },
        body2: {
            letterSpacing: '0.01em'
        }
    }
}); 