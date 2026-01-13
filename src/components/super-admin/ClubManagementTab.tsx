import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Building2, Edit, Trash2, UserPlus, Search, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { SkeletonList } from '../ui/Skeleton';

interface Club {
    id: string;
    name: string;
    slug: string;
    description: string;
    category: string;
    admin_id: string;
    created_at: string;
    admin_name?: string;
}

export const ClubManagementTab = () => {
    const [clubs, setClubs] = useState<Club[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchClubs();
    }, []);

    const fetchClubs = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('clubs')
            .select(`
                *,
                profiles:admin_id (full_name)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching clubs:', error);
        } else {
            const clubsWithAdmin = data?.map(club => ({
                ...club,
                admin_name: (club.profiles as any)?.full_name || 'No admin'
            })) || [];
            setClubs(clubsWithAdmin);
        }
        setLoading(false);
    };

    const deleteClub = async (clubId: string, clubName: string) => {
        if (!confirm(`Are you sure you want to delete "${clubName}"? This will also delete all associated events, members, and data.`)) {
            return;
        }

        const { error } = await supabase
            .from('clubs')
            .delete()
            .eq('id', clubId);

        if (error) {
            console.error('Error deleting club:', error);
            alert('Failed to delete club');
        } else {
            alert('Club deleted successfully');
            fetchClubs();
        }
    };

    const filteredClubs = clubs.filter(club =>
        club.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        club.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <SkeletonList count={6} />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Club Management</h2>
                    <p className="text-gray-600">Total Clubs: {clubs.length}</p>
                </div>
                <button
                    onClick={() => navigate('/clubs/new')}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700"
                >
                    <Plus className="h-5 w-5" />
                    Create New Club
                </button>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search clubs by name or category..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Clubs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClubs.map((club) => (
                    <div key={club.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-lg bg-brand-100 flex items-center justify-center">
                                    <Building2 className="h-6 w-6 text-brand-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{club.name}</h3>
                                    <p className="text-sm text-gray-500">{club.category}</p>
                                </div>
                            </div>
                        </div>

                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                            {club.description || 'No description'}
                        </p>

                        <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
                            <UserPlus className="h-4 w-4" />
                            <span>Admin: {club.admin_name}</span>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => navigate(`/clubs/${club.id}`)}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-brand-50 text-brand-600 rounded-md hover:bg-brand-100"
                            >
                                <Edit className="h-4 w-4" />
                                View
                            </button>
                            <button
                                onClick={() => navigate(`/clubs/${club.id}/edit`)}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
                            >
                                <Edit className="h-4 w-4" />
                                Edit
                            </button>
                            <button
                                onClick={() => deleteClub(club.id, club.name)}
                                className="px-3 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredClubs.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                    <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No clubs found matching your criteria</p>
                </div>
            )}
        </div>
    );
};
