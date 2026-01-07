import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { useState } from 'react';
import { Menu } from 'lucide-react';

export const DashboardLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar - Hidden on mobile by default, shown when sidebarOpen is true */}
            <div
                className={`
                    fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out
                    lg:relative lg:translate-x-0
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                <Sidebar onClose={() => setSidebarOpen(false)} />
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile header with hamburger */}
                <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                        aria-label="Open menu"
                    >
                        <Menu className="h-6 w-6 text-gray-600" />
                    </button>
                    <span className="text-lg font-bold text-brand-600">ClubSphere</span>
                    <div className="w-10" /> {/* Spacer for centering */}
                </div>

                {/* Scrollable content area */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};
