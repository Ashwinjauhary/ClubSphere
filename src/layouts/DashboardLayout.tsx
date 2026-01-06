import { Sidebar } from '../components/Sidebar';
import { Outlet } from 'react-router-dom';

export const DashboardLayout = () => {
    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-8">
                <Outlet />
            </main>
        </div>
    );
};
