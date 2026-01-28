import { Outlet } from 'react-router-dom';
import { ModernSidebar } from '../components/ModernSidebar';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { AppUpdater } from '../components/AppUpdater';
import { ParticlesBackground } from '../components/ui/ParticlesBackground';
import { Box, IconButton, Typography, useTheme, useMediaQuery } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

export const DashboardLayout = () => {
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleCollapseToggle = () => {
        setIsCollapsed(!isCollapsed);
    };

    // Initialize width from localStorage or default
    const [sidebarWidth, setSidebarWidth] = useState(() => {
        const saved = localStorage.getItem('sidebarWidth');
        return saved ? parseInt(saved, 10) : 320; // Increased default from 280 to 320
    });

    const handleWidthChange = (newWidth: number) => {
        setSidebarWidth(newWidth);
        localStorage.setItem('sidebarWidth', newWidth.toString());
    };


    const collapsedDrawerWidth = 80;

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.50' }}>
            {/* Global Particles Background - moved to a lower z-index via CSS in component or wrapper */}
            <div className="absolute inset-0 z-0 pointer-events-none fixed">
                <ParticlesBackground />
            </div>

            <AppUpdater />

            <ModernSidebar
                mobileOpen={mobileOpen}
                onMobileClose={handleDrawerToggle}
                isCollapsed={isCollapsed}
                onCollapseToggle={handleCollapseToggle}
                width={sidebarWidth}
                onWidthChange={handleWidthChange}
            />

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { lg: `calc(100% - ${isCollapsed ? collapsedDrawerWidth : sidebarWidth}px)` },
                    transition: theme.transitions.create(['width', 'margin'], {
                        easing: theme.transitions.easing.easeInOut, // Smoother easing
                        duration: 300, // Slightly longer duration for smoothness
                    }),
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '100vh',
                    position: 'relative',
                    zIndex: 1
                }}
            >
                {/* Mobile Header */}
                {!isDesktop && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, mt: 1 }}>
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{ mr: 2, display: { lg: 'none' } }}
                        >
                            <Menu />
                        </IconButton>
                        <Typography variant="h6" noWrap component="div" fontWeight="bold">
                            ClubSphere
                        </Typography>
                    </Box>
                )}

                <div className="max-w-[1600px] mx-auto w-full pb-4 flex-grow">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            style={{ width: '100%', height: '100%' }}
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </Box>
        </Box>
    );
};
