import { createTheme } from '@mui/material/styles';

// Create a theme instance.
const theme = createTheme({
    palette: {
        primary: {
            light: '#38bdf8', // brand-400
            main: '#0ea5e9', // brand-500
            dark: '#0284c7', // brand-600
            contrastText: '#ffffff',
        },
        secondary: {
            light: '#7dd3fc', // brand-300
            main: '#0369a1', // brand-700
            dark: '#0c4a6e', // brand-900
            contrastText: '#ffffff',
        },
        background: {
            default: '#f9fafb', // gray-50
            paper: '#ffffff',
        },
        text: {
            primary: '#111827', // gray-900
            secondary: '#4b5563', // gray-600
        }
    },
    typography: {
        fontFamily: [
            'Inter',
            'system-ui',
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
        ].join(','),
        h1: {
            fontWeight: 800,
            letterSpacing: '-0.025em',
        },
        h2: {
            fontWeight: 800,
            letterSpacing: '-0.025em',
        },
        button: {
            textTransform: 'none',
            fontWeight: 600,
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '0.5rem', // rounded-lg
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                }
            }
        }
    },
});

export default theme;
