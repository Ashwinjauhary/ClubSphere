import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Navigate } from 'react-router-dom';
import { Users, Building2, Calendar, FileText, ClipboardList, BarChart, Settings } from 'lucide-react';
import { UserManagementTab } from '../components/super-admin/UserManagementTab';
import { ClubManagementTab } from '../components/super-admin/ClubManagementTab';
import { EventManagementTab } from '../components/super-admin/EventManagementTab';
import { ReportsManagementTab } from '../components/super-admin/ReportsManagementTab';
import { ApplicationsManagementTab } from '../components/super-admin/ApplicationsManagementTab';
import { SystemOverviewTab } from '../components/super-admin/SystemOverviewTab';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '../components/ui/PageHeader';

type TabType = 'overview' | 'users' | 'clubs' | 'events' | 'reports' | 'applications';

export const SuperAdminPage = () => {
    const { role } = useAuthStore();
    const [activeTab, setActiveTab] = useState<TabType>('overview');

    // Redirect if not super admin
    if (role !== 'super_admin') {
        return <Navigate to="/dashboard" replace />;
    }

    const tabs = [
        { id: 'overview' as TabType, label: 'Overview', icon: BarChart },
        { id: 'users' as TabType, label: 'Users', icon: Users },
        { id: 'clubs' as TabType, label: 'Clubs', icon: Building2 },
        { id: 'events' as TabType, label: 'Events', icon: Calendar },
        { id: 'reports' as TabType, label: 'Reports', icon: FileText },
        { id: 'applications' as TabType, label: 'Apps', icon: ClipboardList },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview': return <SystemOverviewTab />;
            case 'users': return <UserManagementTab />;
            case 'clubs': return <ClubManagementTab />;
            case 'events': return <EventManagementTab />;
            case 'reports': return <ReportsManagementTab />;
            case 'applications': return <ApplicationsManagementTab />;
            default: return <SystemOverviewTab />;
        }
    };

    return (
        <div className="min-h-screen pb-20">
            <div className="max-w-7xl mx-auto p-6 sm:p-8">
                <PageHeader
                    title="Super Admin"
                    description="System Control Center"
                    action={
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-2 text-[10px] sm:text-xs font-mono uppercase tracking-widest text-violet-600 bg-violet-100/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-violet-200 shadow-sm whitespace-nowrap"
                        >
                            <Settings className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin-slow" /> Root Access
                        </motion.div>
                    }
                />

                {/* Glass Tabs Navigation */}
                <div className="sticky top-4 z-40 mt-8 mb-8">
                    <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-glass rounded-2xl p-1.5 mx-auto max-w-fit flex space-x-1 overflow-x-auto no-scrollbar">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        relative group flex items-center gap-2 py-2.5 px-5 rounded-xl text-sm font-medium transition-all duration-300 outline-none select-none
                                        ${isActive ? 'text-white shadow-lg' : 'text-gray-500 hover:text-gray-800 hover:bg-white/50'}
                                    `}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="admin-tab"
                                            className="absolute inset-0 bg-gradient-to-r from-violet-600 to-brand-600 rounded-xl"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <span className="relative z-10 flex items-center gap-2">
                                        <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-violet-500 transition-colors'}`} />
                                        {tab.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tab Content */}
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.98 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="glass-card p-1 min-h-[500px]"
                    >
                        {renderTabContent()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};
