import { NavLink, useNavigate } from 'react-router-dom';
import {
    Box,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    IconButton,
    Typography,
    Divider,
    Avatar,
    useTheme
} from '@mui/material';
import {
    LayoutDashboard,
    Users,
    Calendar,
    FileText,
    LogOut,
    Building,
    BarChart,
    ClipboardList,
    CheckSquare,
    Plus,
    Shield,
    ChevronLeft,
    ChevronRight,
    Search,
    BrainCircuit,
    Trophy
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Notifications } from './Notifications';
import { useEffect, useRef } from 'react';

// Removed default drawerWidth constant as it's passed via props now
const collapsedDrawerWidth = 80;

interface ModernSidebarProps {
    mobileOpen: boolean;
    onMobileClose: () => void;
    isCollapsed: boolean;
    onCollapseToggle: () => void;
    width: number;
    onWidthChange: (width: number) => void;
}

export const ModernSidebar = ({
    mobileOpen,
    onMobileClose,
    isCollapsed,
    onCollapseToggle,
    width,
    onWidthChange
}: ModernSidebarProps) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { role, managedClubId, signOut, user } = useAuthStore();
    const isResizing = useRef(false);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing.current) return;

            let newWidth = e.clientX;
            // Constraints
            if (newWidth < 240) newWidth = 240; // Increased min
            if (newWidth > 600) newWidth = 600; // Increased max

            onWidthChange(newWidth);
        };

        const handleMouseUp = () => {
            isResizing.current = false;
            document.body.style.cursor = 'default';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [onWidthChange]);

    const handleMouseDown = () => {
        isResizing.current = true;
        document.body.style.cursor = 'col-resize';
    };

    const handleSignOut = () => {
        signOut();
        navigate('/login');
    };

    const renderLink = (to: string, icon: React.ElementType, label: string) => {
        return (
            <ListItem disablePadding sx={{ display: 'block', mb: 0.5 }}>
                <ListItemButton
                    component={NavLink}
                    to={to}
                    onClick={onMobileClose}
                    sx={{
                        minHeight: 48,
                        justifyContent: isCollapsed ? 'center' : 'initial',
                        px: 2.5,
                        mx: 1.5,
                        borderRadius: 2,
                        '&.active': {
                            backgroundColor: theme.palette.primary.main + '15', // 15% opacity
                            color: 'primary.main',
                            '& .lucide': {
                                color: 'primary.main',
                            },
                        },
                        '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                        }
                    }}
                >
                    <ListItemIcon
                        sx={{
                            minWidth: 0,
                            mr: isCollapsed ? 0 : 2,
                            justifyContent: 'center',
                            color: 'text.secondary',
                        }}
                    >
                        <Box component={icon} size={isCollapsed ? 24 : 20} className="lucide" />
                    </ListItemIcon>
                    <ListItemText
                        primary={label}
                        primaryTypographyProps={{
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            letterSpacing: '0.01em'
                        }}
                        sx={{ opacity: isCollapsed ? 0 : 1, display: isCollapsed ? 'none' : 'block' }}
                    />
                </ListItemButton>
            </ListItem>
        );
    };

    const renderSectionHeader = (title: string) => {
        if (isCollapsed) return <Divider sx={{ my: 2, mx: 2 }} />;
        return (
            <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{
                    px: 4,
                    mt: 3,
                    mb: 1,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                }}
            >
                {title}
            </Typography>
        );
    };

    const drawerContent = (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#ffffff' }}>
            {/* Header */}
            <Box sx={{
                p: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                height: 80,
            }}>
                <Box
                    component="img"
                    src="/logo.png"
                    alt="ClubSphere Logo"
                    sx={{
                        width: 42,
                        height: 42,
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 4px 8px rgba(14, 165, 233, 0.25))', // Soft glow
                        flexShrink: 0
                    }}
                />

                {!isCollapsed && (
                    <Box sx={{ ml: 2, overflow: 'hidden' }}>
                        <Typography variant="h6" fontWeight="800" color="text.primary" sx={{ lineHeight: 1, letterSpacing: '-0.5px' }}>
                            ClubSphere
                        </Typography>
                        <Typography variant="caption" color="primary.main" fontWeight="600" sx={{ letterSpacing: '0.5px' }}>
                            MANAGEMENT
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* Content */}
            < List sx={{ flexGrow: 1, overflowY: 'auto', px: 0 }} className="scrollbar-hide" >
                {/* Search Bar Placeholder - Visual only as per design */}
                {
                    !isCollapsed && (
                        <Box sx={{ px: 3, mb: 2 }}>
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                px: 1.5,
                                py: 1,
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: 'divider',
                                bgcolor: 'background.default',
                                color: 'text.secondary',
                                gap: 1
                            }}>
                                <Search size={16} />
                                <Typography variant="body2" color="text.secondary">Search</Typography>
                            </Box>
                        </Box>
                    )
                }


                {/* Default/Student Links */}
                {
                    role === 'student' && (
                        <>
                            {renderSectionHeader('General Access')}
                            {renderLink('/dashboard', LayoutDashboard, 'Dashboard')}
                            {renderLink('/daily-quiz', BrainCircuit, 'Daily Quiz')}
                            {renderLink('/leaderboard', Trophy, 'Leaderboard')}
                            {renderLink('/events', Calendar, 'Events')}
                            {renderLink('/clubs', Users, 'Clubs')}
                            {renderLink('/wall', Users, 'Clubs Wall')}
                            {renderLink('/analytics', BarChart, 'Analytics')}
                        </>
                    )
                }

                {/* Admin/Dean Overview */}
                {
                    (role === 'admin' || role === 'dean') && (
                        <>
                            {renderSectionHeader('Overview')}
                            {renderLink('/dashboard', LayoutDashboard, 'Dashboard')}
                            {renderLink('/daily-quiz', BrainCircuit, 'Daily Quiz')}
                            {renderLink('/leaderboard', Trophy, 'Leaderboard')}
                            {renderLink('/events', Calendar, 'Events')}
                            {renderLink('/clubs', Users, 'Clubs')}
                            {renderLink('/wall', Users, 'Clubs Wall')}
                            {renderLink('/analytics', BarChart, 'Analytics')}
                        </>
                    )
                }

                {/* Admin Specific */}
                {
                    role === 'admin' && (
                        <>
                            {renderSectionHeader('Admin Operations')}
                            {renderLink('/proposals', FileText, 'Proposals')}
                            {renderLink('/applications', ClipboardList, 'Applications')}
                            {managedClubId ?
                                renderLink(`/clubs/${managedClubId}`, Building, 'My Club') :
                                renderLink('/clubs', Building, 'My Club (Unassigned)')
                            }
                            {renderLink('/forms', FileText, 'Forms')}
                            {renderLink('/reports', ClipboardList, 'Reports')}
                            {renderLink('/members', Users, 'Team')}
                        </>
                    )
                }

                {/* Dean Specific */}
                {
                    role === 'dean' && (
                        <>
                            {renderSectionHeader("Dean's Suite")}
                            {renderLink('/approvals', CheckSquare, 'Approvals')}
                            {renderLink('/clubs/new', Plus, 'Create Club')}
                            {renderLink('/reports', FileText, 'System Reports')}
                        </>
                    )
                }

                {/* Super Admin */}
                {
                    role === 'super_admin' && (
                        <>
                            {renderSectionHeader('Super Admin')}
                            {renderLink('/super-admin', Shield, 'Super Admin Panel')}

                            {renderSectionHeader('General Access')}
                            {renderLink('/dashboard', LayoutDashboard, 'Dashboard')}
                            {renderLink('/daily-quiz', BrainCircuit, 'Daily Quiz')}
                            {renderLink('/leaderboard', Trophy, 'Leaderboard')}
                            {renderLink('/events', Calendar, 'Events')}
                            {renderLink('/clubs', Users, 'Clubs')}
                            {renderLink('/wall', Users, 'Clubs Wall')}
                            {renderLink('/analytics', BarChart, 'Analytics')}
                        </>
                    )
                }
            </List >

            {/* Footer */}
            < Box sx={{ p: isCollapsed ? 1 : 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <ListItem disablePadding sx={{ display: 'block' }}>
                    <ListItemButton
                        component={NavLink}
                        to="/profile"
                        sx={{
                            borderRadius: 2,
                            justifyContent: isCollapsed ? 'center' : 'initial',
                            px: 1,
                        }}
                    >
                        <Avatar
                            src={user?.user_metadata?.avatar_url || ''}
                            sx={{
                                width: 36,
                                height: 36,
                                mr: isCollapsed ? 0 : 2,
                                bgcolor: 'secondary.main',
                                fontSize: '0.9rem'
                            }}
                        >
                            {user?.user_metadata?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                        </Avatar>
                        {!isCollapsed && (
                            <Box sx={{ overflow: 'hidden' }}>
                                <Typography variant="subtitle2" noWrap>
                                    {user?.user_metadata?.full_name || 'User'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" noWrap display="block">
                                    {user?.email}
                                </Typography>
                            </Box>
                        )}
                        {!isCollapsed && (
                            <Box sx={{ ml: 'auto' }}>
                                <IconButton size="small" onClick={(e) => { e.preventDefault(); handleSignOut(); }}>
                                    <LogOut size={16} />
                                </IconButton>
                            </Box>
                        )}
                    </ListItemButton>
                </ListItem>
                {/* Notifications handled inline in profile or separate ? - Existing sidebar had it separate */}
                {
                    !isCollapsed && (
                        <Box sx={{ mt: 1, px: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" fontWeight="bold" color="text.secondary">ALERTS</Typography>
                            <Notifications />
                        </Box>
                    )
                }
            </Box >
        </Box >
    );

    return (
        <Box
            component="nav"
            sx={{ width: { lg: isCollapsed ? collapsedDrawerWidth : width }, flexShrink: { lg: 0 }, transition: isResizing.current ? 'none' : 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
            aria-label="mailbox folders"
        >
            {/* Mobile Drawer */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={onMobileClose}
                ModalProps={{
                    keepMounted: true, // Better open performance on mobile.
                }}
                sx={{
                    display: { xs: 'block', lg: 'none' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: width },
                }}
            >
                {drawerContent}
            </Drawer>

            {/* Desktop Drawer */}
            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', lg: 'block' },
                    '& .MuiDrawer-paper': {
                        boxSizing: 'border-box',
                        width: isCollapsed ? collapsedDrawerWidth : width,
                        borderRight: '1px solid',
                        borderColor: 'divider',
                        transition: isResizing.current ? 'none' : 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        overflow: 'visible'
                    },
                }}
                open
            >
                {drawerContent}
                {/* Collapse Toggle Button */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 24,
                        right: -16, // Increased negative margin
                        zIndex: 1200,
                        backgroundColor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: '50%',
                        width: 32, // Increased from 24
                        height: 32, // Increased from 24
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: 1, // Added shadow for better visibility
                        transition: 'all 0.2s',
                        '&:hover': {
                            bgcolor: 'primary.main',
                            color: 'white',
                            borderColor: 'primary.main',
                            transform: 'scale(1.1)'
                        }
                    }}
                    onClick={onCollapseToggle}
                >
                    {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </Box>

                {/* Drag Handle */}
                {!isCollapsed && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: 4,
                            height: '100%',
                            cursor: 'col-resize',
                            zIndex: 1100,
                            '&:hover': {
                                backgroundColor: 'primary.main',
                            },
                        }}
                        onMouseDown={handleMouseDown}
                    />
                )}
            </Drawer>
        </Box>
    );
};
