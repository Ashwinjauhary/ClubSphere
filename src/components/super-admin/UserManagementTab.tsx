import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, Trash2, Search } from 'lucide-react';

interface Profile {
    id: string;
    email: string;
    full_name: string;
    role: 'student' | 'admin' | 'dean' | 'super_admin';
    created_at: string;
}

export const UserManagementTab = () => {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching users:', error);
        } else {
            setUsers(data || []);
        }
        setLoading(false);
    };

    const updateUserRole = async (userId: string, newRole: string) => {
        console.log('Attempting to update user:', userId, 'to role:', newRole);

        const { data, error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId)
            .select();

        if (error) {
            console.error('Error updating role:', error);
            alert(`Failed to update user role: ${error.message}`);
        } else {
            console.log('Update successful:', data);
            alert('User role updated successfully');
            fetchUsers();
        }
    };

    const deleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId);

        if (error) {
            console.error('Error deleting user:', error);
            alert('Failed to delete user');
        } else {
            alert('User deleted successfully');
            fetchUsers();
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const roleStats = {
        total: users.length,
        student: users.filter(u => u.role === 'student').length,
        admin: users.filter(u => u.role === 'admin').length,
        dean: users.filter(u => u.role === 'dean').length,
        super_admin: users.filter(u => u.role === 'super_admin').length,
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64">Loading users...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Users</p>
                            <p className="text-2xl font-bold text-gray-900">{roleStats.total}</p>
                        </div>
                        <Users className="h-8 w-8 text-brand-600" />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">Students</p>
                    <p className="text-2xl font-bold text-blue-600">{roleStats.student}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">Admins</p>
                    <p className="text-2xl font-bold text-purple-600">{roleStats.admin}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">Deans</p>
                    <p className="text-2xl font-bold text-green-600">{roleStats.dean}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">Super Admins</p>
                    <p className="text-2xl font-bold text-red-600">{roleStats.super_admin}</p>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    >
                        <option value="all">All Roles</option>
                        <option value="student">Students</option>
                        <option value="admin">Admins</option>
                        <option value="dean">Deans</option>
                        <option value="super_admin">Super Admins</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Joined
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center">
                                                <span className="text-brand-600 font-medium">
                                                    {user.full_name?.charAt(0) || user.email?.charAt(0) || '?'}
                                                </span>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {user.full_name || 'No name'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{user.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <select
                                            value={user.role}
                                            onChange={(e) => updateUserRole(user.id, e.target.value)}
                                            className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                        >
                                            <option value="student">Student</option>
                                            <option value="admin">Admin</option>
                                            <option value="dean">Dean</option>
                                            <option value="super_admin">Super Admin</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => deleteUser(user.id)}
                                            className="text-red-600 hover:text-red-900 flex items-center gap-1"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredUsers.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        No users found matching your criteria
                    </div>
                )}
            </div>
        </div>
    );
};
