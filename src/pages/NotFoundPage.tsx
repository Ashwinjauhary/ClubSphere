import { Box, Typography, Button } from '@mui/material';
import { Home, ArrowLeft, SearchX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '../components/SEO';

export const NotFoundPage = () => {
    const navigate = useNavigate();

    return (
        <>
            <SEO 
                title="Page Not Found — ClubSphere" 
                description="The page you're looking for doesn't exist." 
            />
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
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mx: 'auto',
                            mb: 3,
                        }}
                    >
                        <SearchX size={40} color="white" />
                    </Box>
                    <Typography
                        variant="h2"
                        sx={{
                            color: '#f8fafc',
                            fontWeight: 800,
                            mb: 1,
                            fontFamily: "'Inter', sans-serif",
                            fontSize: { xs: '3rem', sm: '4rem' },
                            background: 'linear-gradient(135deg, #0ea5e9, #6366f1, #8b5cf6)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        404
                    </Typography>
                    <Typography
                        variant="h5"
                        sx={{ color: '#f8fafc', fontWeight: 700, mb: 1.5, fontFamily: "'Inter', sans-serif" }}
                    >
                        Page Not Found
                    </Typography>
                    <Typography
                        sx={{ color: '#94a3b8', mb: 4, fontSize: '0.95rem', lineHeight: 1.6 }}
                    >
                        The page you're looking for doesn't exist or has been moved. 
                        Let's get you back on track.
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Button
                            onClick={() => navigate(-1)}
                            variant="outlined"
                            startIcon={<ArrowLeft size={18} />}
                            sx={{
                                borderColor: 'rgba(255,255,255,0.2)',
                                color: '#e2e8f0',
                                borderRadius: '12px',
                                px: 3,
                                textTransform: 'none',
                                '&:hover': { borderColor: '#0ea5e9', color: '#0ea5e9' },
                            }}
                        >
                            Go Back
                        </Button>
                        <Button
                            onClick={() => navigate('/dashboard')}
                            variant="contained"
                            startIcon={<Home size={18} />}
                            sx={{
                                background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
                                borderRadius: '12px',
                                px: 3,
                                textTransform: 'none',
                                fontWeight: 600,
                                '&:hover': { background: 'linear-gradient(135deg, #0284c7 0%, #4f46e5 100%)' },
                            }}
                        >
                            Dashboard
                        </Button>
                    </Box>
                </Box>
            </Box>
        </>
    );
};
