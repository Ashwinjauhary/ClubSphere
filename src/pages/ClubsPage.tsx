import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ClubCard } from '../components/ClubCard';
import { Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface Club {
    id: string;
    name: string;
    slug: string;
    description: string;
    logo_url: string;
    banner_url: string;
    category: string;
    founded_year: number;
    admin_id: string;
    created_at: string;
}

export const ClubsPage = () => {
    const [clubs, setClubs] = useState<Club[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const { role } = useAuthStore();

    useEffect(() => {
        fetchClubs();
    }, []);

    const fetchClubs = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('clubs')
            .select('*')
            .order('name');

        if (error) {
            console.error('Error fetching clubs:', error);
        } else {
            setClubs(data || []);
        }
        setLoading(false);
    };

    const filteredClubs = clubs.filter(club =>
        club.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        club.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        club.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading clubs...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">All Clubs</h1>
                    <p className="text-gray-600 mt-2">Discover and join student clubs</p>
                </div>
                {(role === 'dean' || role === 'super_admin') && (
                    <button
                        onClick={() => navigate('/clubs/new')}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 transition-colors"
                    >
                        <Plus className="h-5 w-5" />
                        Create Club
                    </button>
                )}
            </div>

            {/* Search */}
            <div className="mb-8">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search clubs by name, category, or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Clubs Grid */}
            {filteredClubs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClubs.map((club) => (
                        <ClubCard key={club.id} club={club} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">
                        {searchTerm ? 'No clubs found matching your search' : 'No clubs available yet'}
                    </p>
                </div>
            )}
        </div>
    );
};
