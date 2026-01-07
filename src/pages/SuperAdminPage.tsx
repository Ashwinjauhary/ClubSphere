import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Navigate } from 'react-router-dom';
import { Shield, Users, Building2, Calendar, FileText, ClipboardList, BarChart } from 'lucide-react';
import { UserManagementTab } from '../components/super-admin/UserManagementTab';
import { ClubManagementTab } from '../components/super-admin/ClubManagementTab';
import { EventManagementTab } from '../components/super-admin/EventManagementTab';
import { ReportsManagementTab } from '../components/super-admin/ReportsManagementTab';
import { ApplicationsManagementTab } from '../components/super-admin/ApplicationsManagementTab';
import { SystemOverviewTab } from '../components/super-admin/SystemOverviewTab';

type TabType = 'overview' | 'users' | 'clubs' | 'events' | 'reports' | 'applications';

export const SuperAdminPage = () => {
    const { role } = useAuthStore();
    const [activeTab, setActiveTab] = useState<TabType>('overview');

    // Redirect if not super admin
    if (role !== 'super_admin') {
        return <Navigate to="/dashboard" replace />;
    }

    const tabs = [
        { id: 'overview' as TabType, label: 'System Overview', icon: BarChart },
        { id: 'users' as TabType, label: 'User Management', icon: Users },
        { id: 'clubs' as TabType, label: 'Club Management', icon: Building2 },
        { id: 'events' as TabType, label: 'Event Management', icon: Calendar },
        { id: 'reports' as TabType, label: 'Reports', icon: FileText },
        { id: 'applications' as TabType, label: 'Applications', icon: ClipboardList },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return <SystemOverviewTab />;
            case 'users':
                return <UserManagementTab />;
            case 'clubs':
                return <ClubManagementTab />;
            case 'events':
                return <EventManagementTab />;
            case 'reports':
                return <ReportsManagementTab />;
            case 'applications':
                return <ApplicationsManagementTab />;
            default:
                return <SystemOverviewTab />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center gap-3">
                        <Shield className="h-8 w-8" />
                        <div>
                            <h1 className="text-3xl font-bold">Super Admin Panel</h1>
                            <p className="text-red-100 text-sm">Complete system control and management</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
                    <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto scrollbar-hide py-2" aria-label="Tabs">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        flex items-center gap-2 py-3 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors
                                        ${activeTab === tab.id
                                            ? 'border-red-600 text-red-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }
                                    `}
                                >
                                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                    <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Tab Content */}
            <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
                {renderTabContent()}
            </div>
        </div>
    );
};
