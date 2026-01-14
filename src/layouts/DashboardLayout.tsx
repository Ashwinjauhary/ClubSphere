import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { AppUpdater } from '../components/AppUpdater';

export const DashboardLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen lg:h-[100dvh] overflow-hidden bg-transparent"> {/* bg-transparent to show body gradient */}
            <AppUpdater />
            {/* Mobile sidebar backdrop */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar - Floating Glass Style */}
            <div className={`
                fixed inset-y-0 left-0 z-50 w-72 p-4 transform transition-transform duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)]
                lg:relative lg:translate-x-0
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="h-full glass rounded-2xl shadow-2xl ring-1 ring-white/40">
                    <Sidebar onClose={() => setSidebarOpen(false)} />
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden relative scrollbar-thin">
                {/* Mobile header with hamburger */}
                <div className="lg:hidden glass border-b border-white/20 px-4 py-3 flex items-center justify-between sticky top-0 z-30 mx-4 mt-4 rounded-xl">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                        aria-label="Open menu"
                    >
                        <Menu className="h-6 w-6 text-brand-700" />
                    </button>
                    <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-purple-600">
                        ClubSphere
                    </span>
                    <div className="w-10" />
                </div>

                <main className="flex-1 p-4 lg:p-6 lg:pt-8 w-full max-w-[1920px] mx-auto pb-24 lg:pb-10">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
