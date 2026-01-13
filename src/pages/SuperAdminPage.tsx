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
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto p-6 sm:p-8 pb-0">
                <PageHeader
                    title="Super Admin"
                    description="System Control Center"
                    action={
                        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-gray-500 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                            <Settings className="h-3 w-3" /> Root Access
                        </div>
                    }
                />
            </div>

            {/* Tabs Navigation */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
                    <nav className="flex space-x-1 overflow-x-auto p-2 scrollbar-none" aria-label="Tabs">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        relative group flex items-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 outline-none
                                        ${isActive ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}
                                    `}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="admin-tab"
                                            className="absolute inset-0 bg-white shadow-sm ring-1 ring-gray-200 rounded-lg"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <span className="relative z-10 flex items-center gap-2">
                                        <Icon className={`h-4 w-4 ${isActive ? 'text-brand-600' : 'text-gray-400 group-hover:text-gray-500'}`} />
                                        {tab.label}
                                    </span>
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Tab Content */}
            <div className="max-w-7xl mx-auto p-6 sm:p-8">
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white/50 backdrop-blur-xl rounded-2xl shadow-sm border border-white/60 p-1"
                    >
                        {renderTabContent()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};
