import { NavLink } from 'react-router-dom';
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
    User,
    X,
    Shield
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { clsx } from 'clsx';
import { Notifications } from './Notifications';

interface SidebarLinkProps {
    to: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    onClose?: () => void;
}

const SidebarLink = ({ to, icon: Icon, label, onClose }: SidebarLinkProps) => (
    <NavLink
        to={to}
        onClick={onClose}
        className={({ isActive }) =>
            clsx(
                'group flex items-center px-4 py-3 text-sm font-medium rounded-r-full transition-all duration-200 mb-1 border-l-4',
                isActive
                    ? 'bg-blue-50 text-blue-600 border-blue-600'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 border-transparent'
            )
        }
    >
        <Icon className={clsx("mr-3 h-5 w-5 flex-shrink-0 transition-colors", ({ isActive }: any) => isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600")} />
        {label}
    </NavLink>
);

interface SidebarProps {
    onClose?: () => void;
}

export const Sidebar = ({ onClose }: SidebarProps) => {
    const { role, managedClubId, signOut } = useAuthStore();

    return (
        <div className="flex h-full w-full flex-col bg-white text-gray-900">
            {/* Header */}
            <div className="flex items-center justify-between h-20 px-6 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-blue-600 font-sans">
                        ClubSphere
                    </span>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
                        aria-label="Close menu"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-0 py-6 overflow-y-auto scrollbar-thin">
                {role === 'student' && (
                    <>
                        <div className="px-6 mb-3 mt-2">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">General Access</h3>
                        </div>
                        <SidebarLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" onClose={onClose} />
                        <SidebarLink to="/events" icon={Calendar} label="Events" onClose={onClose} />
                        <SidebarLink to="/clubs" icon={Users} label="Clubs" onClose={onClose} />
                        <SidebarLink to="/wall" icon={Users} label="Clubs Wall" onClose={onClose} />
                        <SidebarLink to="/analytics" icon={BarChart} label="Analytics" onClose={onClose} />
                    </>
                )}

                {(role === 'admin' || role === 'dean') && (
                    <>
                        <div className="px-6 mb-3 mt-2">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Overview</h3>
                        </div>
                        <SidebarLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" onClose={onClose} />
                        <SidebarLink to="/events" icon={Calendar} label="Events" onClose={onClose} />
                        <SidebarLink to="/clubs" icon={Users} label="Clubs" onClose={onClose} />
                        <SidebarLink to="/wall" icon={Users} label="Clubs Wall" onClose={onClose} />
                        <SidebarLink to="/analytics" icon={BarChart} label="Analytics" onClose={onClose} />
                    </>
                )}

                {role === 'admin' && (
                    <>
                        <div className="px-6 mb-3 mt-6">
                            <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest">Admin Operations</h3>
                        </div>
                        <SidebarLink to="/proposals" icon={FileText} label="Proposals" onClose={onClose} />
                        <SidebarLink to="/applications" icon={ClipboardList} label="Applications" onClose={onClose} />

                        {managedClubId ? (
                            <SidebarLink to={`/clubs/${managedClubId}`} icon={Building} label="My Club" onClose={onClose} />
                        ) : (
                            <SidebarLink to="/clubs" icon={Building} label="My Club (Unassigned)" onClose={onClose} />
                        )}
                        <SidebarLink to="/forms" icon={FileText} label="Forms" onClose={onClose} />
                        <SidebarLink to="/reports" icon={ClipboardList} label="Reports" onClose={onClose} />
                        <SidebarLink to="/members" icon={Users} label="Team" onClose={onClose} />
                    </>
                )}

                {role === 'dean' && (
                    <>
                        <div className="px-6 mb-3 mt-6">
                            <h3 className="text-xs font-bold text-purple-500 uppercase tracking-widest">Dean's Suite</h3>
                        </div>
                        <SidebarLink to="/approvals" icon={CheckSquare} label="Approvals" onClose={onClose} />
                        <SidebarLink to="/clubs/new" icon={Plus} label="Create Club" onClose={onClose} />
                        <SidebarLink to="/reports" icon={FileText} label="System Reports" onClose={onClose} />
                    </>
                )}

                {role === 'super_admin' && (
                    <>
                        <div className="px-6 mb-3 mt-2">
                            <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-1">
                                <Shield className="h-3 w-3" /> Super Admin
                            </h3>
                        </div>
                        <SidebarLink to="/super-admin" icon={CheckSquare} label="Super Admin Panel" onClose={onClose} />

                        <div className="px-6 mb-3 mt-6">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">General Access</h3>
                        </div>
                        <SidebarLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" onClose={onClose} />
                        <SidebarLink to="/events" icon={Calendar} label="Events" onClose={onClose} />
                        <SidebarLink to="/clubs" icon={Users} label="Clubs" onClose={onClose} />
                        <SidebarLink to="/wall" icon={Users} label="Clubs Wall" onClose={onClose} />
                        <SidebarLink to="/analytics" icon={BarChart} label="Analytics" onClose={onClose} />
                    </>
                )}
            </nav>

            {/* Footer */}
            <div className="mt-auto px-4 py-6 border-t border-gray-100 bg-gray-50/50">
                <SidebarLink to="/profile" icon={User} label="My Profile" onClose={onClose} />

                <div className="flex items-center justify-between px-4 py-2 mt-2">
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wide">ALERTS</span>
                    <Notifications />
                </div>

                <button
                    onClick={() => signOut()}
                    className="flex w-full items-center px-4 py-3 text-sm font-medium text-red-500 hover:text-red-700 hover:bg-red-50 rounded-r-full transition-colors mt-2"
                >
                    <LogOut className="mr-3 h-5 w-5" />
                    Sign Out
                </button>
            </div>
        </div>
    );
};
