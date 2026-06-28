import { Component, type ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '100vh',
                        p: 4,
                        textAlign: 'center',
                        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    }}
                >
                    <Box
                        sx={{
                            background: 'rgba(255,255,255,0.05)',
                            backdropFilter: 'blur(20px)',
                            borderRadius: '24px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            p: 5,
                            maxWidth: 480,
                            width: '100%',
                        }}
                    >
                        <Box
                            sx={{
                                width: 72,
                                height: 72,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mx: 'auto',
                                mb: 3,
                            }}
                        >
                            <AlertTriangle size={36} color="white" />
                        </Box>
                        <Typography
                            variant="h5"
                            sx={{ color: '#f8fafc', fontWeight: 700, mb: 1.5, fontFamily: "'Inter', sans-serif" }}
                        >
                            Something Went Wrong
                        </Typography>
                        <Typography
                            sx={{ color: '#94a3b8', mb: 4, fontSize: '0.95rem', lineHeight: 1.6 }}
                        >
                            An unexpected error occurred. Don't worry — your data is safe. 
                            Try refreshing the page or going back.
                        </Typography>

                        {import.meta.env.DEV && this.state.error && (
                            <Box
                                sx={{
                                    background: 'rgba(239,68,68,0.1)',
                                    border: '1px solid rgba(239,68,68,0.3)',
                                    borderRadius: '12px',
                                    p: 2,
                                    mb: 3,
                                    textAlign: 'left',
                                }}
                            >
                                <Typography sx={{ color: '#fca5a5', fontSize: '0.8rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                    {this.state.error.message}
                                </Typography>
                            </Box>
                        )}

                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                            <Button
                                onClick={this.handleReset}
                                variant="outlined"
                                sx={{
                                    borderColor: 'rgba(255,255,255,0.2)',
                                    color: '#e2e8f0',
                                    borderRadius: '12px',
                                    px: 3,
                                    textTransform: 'none',
                                    '&:hover': { borderColor: '#0ea5e9', color: '#0ea5e9' },
                                }}
                            >
                                Try Again
                            </Button>
                            <Button
                                onClick={this.handleReload}
                                variant="contained"
                                startIcon={<RefreshCw size={18} />}
                                sx={{
                                    background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
                                    borderRadius: '12px',
                                    px: 3,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    '&:hover': { background: 'linear-gradient(135deg, #0284c7 0%, #4f46e5 100%)' },
                                }}
                            >
                                Reload Page
                            </Button>
                        </Box>
                    </Box>
                </Box>
            );
        }

        return this.props.children;
    }
}
