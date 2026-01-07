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
    X
} from 'lucide-react';
import { Notifications } from './Notifications';
import { useAuthStore } from '../store/authStore';
import { clsx } from 'clsx';

interface SidebarLinkProps {
    to: string;
    icon: React.ElementType;
    label: string;
}

const SidebarLink = ({ to, icon: Icon, label }: SidebarLinkProps) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            clsx(
                'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )
        }
    >
        <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
        {label}
    </NavLink>
);

interface SidebarProps {
    onClose?: () => void;
}

export const Sidebar = ({ onClose }: SidebarProps) => {
    const { role, managedClubId, signOut } = useAuthStore();

    return (
        <div className="flex h-screen w-64 flex-col bg-white border-r border-gray-200">
            <div className="flex items-center justify-between h-16 border-b border-gray-200 px-4">
                <span className="text-xl font-bold text-brand-600">ClubSphere</span>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
                        aria-label="Close menu"
                    >
                        <X className="h-5 w-5 text-gray-600" />
                    </button>
                )}
            </div>

            <nav className="flex-1 space-y-1 px-2 py-4">
                {role === 'student' && (
                    <>
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-4 pl-3">
                            Student
                        </div>
                        <SidebarLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                        <SidebarLink to="/clubs" icon={Users} label="Clubs" />
                        <SidebarLink to="/wall" icon={Users} label="Clubs Wall" />
                        <SidebarLink to="/events" icon={Calendar} label="Events" />
                        <SidebarLink to="/applications" icon={FileText} label="My Applications" />
                    </>
                )}

                {(role === 'admin' || role === 'dean') && (
                    <>
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-4 pl-3">
                            General
                        </div>
                        <SidebarLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                        <SidebarLink to="/events" icon={Calendar} label="Events" />
                        <SidebarLink to="/clubs" icon={Users} label="Clubs" />
                        <SidebarLink to="/wall" icon={Users} label="Clubs Wall" />
                        <SidebarLink to="/analytics" icon={BarChart} label="Analytics" />
                    </>
                )}

                {role === 'admin' && (
                    <>
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-4 pl-3">
                            Admin
                        </div>
                        <SidebarLink to="/proposals" icon={FileText} label="Proposals" />
                        <SidebarLink to="/applications" icon={ClipboardList} label="Applications" />

                        {managedClubId ? (
                            <SidebarLink to={`/clubs/${managedClubId}`} icon={Building} label="My Club" />
                        ) : (
                            // Fallback if they are admin but not assigned yet
                            <SidebarLink to="/clubs" icon={Building} label="My Club (Unassigned)" />
                        )}
                        <SidebarLink to="/reports" icon={ClipboardList} label="Event Reports" />
                        <SidebarLink to="/members" icon={Users} label="Manage Team" />
                    </>
                )}

                {role === 'dean' && (
                    <>
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-4 pl-3">
                            Dean's Desk
                        </div>
                        <SidebarLink to="/approvals" icon={CheckSquare} label="Approvals" />
                        <SidebarLink to="/clubs/new" icon={Plus} label="Create Club" />
                        <SidebarLink to="/analytics" icon={BarChart} label="Analytics" />
                        <SidebarLink to="/reports" icon={FileText} label="System Reports" />
                    </>
                )}

                {role === 'super_admin' && (
                    <>
                        <div className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2 mt-4 pl-3">
                            🔒 Super Admin
                        </div>
                        <SidebarLink to="/super-admin" icon={CheckSquare} label="Super Admin Panel" />
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-4 pl-3">
                            General Access
                        </div>
                        <SidebarLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                        <SidebarLink to="/events" icon={Calendar} label="Events" />
                        <SidebarLink to="/clubs" icon={Users} label="Clubs" />
                        <SidebarLink to="/wall" icon={Users} label="Clubs Wall" />
                        <SidebarLink to="/analytics" icon={BarChart} label="Analytics" />
                    </>
                )}
            </nav>



            <div className="mt-auto pt-4 border-t border-gray-200 p-4 space-y-2">
                <SidebarLink to="/profile" icon={User} label="My Profile" />

                <div className="flex items-center justify-between px-2 pt-2">
                    <span className="text-xs text-gray-400 uppercase font-semibold">Alerts</span>
                    <Notifications />
                </div>
                <button
                    onClick={() => signOut()}
                    className="flex w-full items-center px-2 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50"
                >
                    <LogOut className="mr-3 h-5 w-5" />
                    Sign Out
                </button>
            </div>
        </div>
    );
};
