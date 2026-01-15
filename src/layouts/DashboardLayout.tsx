import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { AppUpdater } from '../components/AppUpdater';
import { ParticlesBackground } from '../components/ui/ParticlesBackground';

export const DashboardLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen w-full overflow-hidden bg-gray-50 font-sans text-gray-900 relative">
            {/* Global Particles Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <ParticlesBackground />
            </div>

            <AppUpdater />
            {/* Mobile sidebar backdrop */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Container */}
            <div className={`
                fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1)
                lg:relative lg:translate-x-0 h-full
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="h-full bg-white flex flex-col">
                    <Sidebar onClose={() => setSidebarOpen(false)} />
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Mobile header */}
                <div className="lg:hidden bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between sticky top-0 z-30">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 -ml-2 rounded-md hover:bg-gray-50 active:scale-95 transition-all text-gray-600"
                        aria-label="Open menu"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <span className="text-lg font-bold text-gray-900 font-display">
                        CLUBSPHERE
                    </span>
                    <div className="w-10" />
                </div>

                <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-8 scrollbar-thin">
                    <div className="max-w-[1600px] mx-auto pb-24 lg:pb-10">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};
