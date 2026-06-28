import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ClubCard } from '../components/ClubCard';
import { Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';
import { SkeletonList } from '../components/ui/Skeleton';
import { PageHeader } from '../components/ui/PageHeader';

interface Club {
    id: string;
    name: string;
    slug: string;
    description: string;
    logo_url: string;
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
        // eslint-disable-next-line react-hooks/immutability
        fetchClubs();
    }, []);

    const fetchClubs = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('clubs')
            .select('*')
            .order('name');

        let fetchedClubs = data || [];

        if (error) {
            console.error('Error fetching clubs:', error);
            fetchedClubs = [];
        }

        setClubs(fetchedClubs);
        setLoading(false);
    };

    const filteredClubs = clubs.filter(club =>
        club.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        club.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        club.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 p-6 sm:p-8">
            <PageHeader
                title="Student Clubs"
                description="Discover your tribe. Join the movement."
                action={(role === 'dean' || role === 'super_admin') && (
                    <button
                        onClick={() => navigate('/clubs/new')}
                        className="flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl shadow-lg shadow-brand-500/30 hover:bg-brand-700 transition-all font-medium"
                    >
                        <Plus className="h-5 w-5" />
                        Start a New Club
                    </button>
                )}
            />

            {/* Glass Search Bar */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="relative group"
            >
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                </div>
                <input
                    type="text"
                    placeholder="Search for clubs, categories, or interests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-11 pr-4 py-4 glass rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all"
                />
            </motion.div>

            {/* Content Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <SkeletonList count={6} />
                </div>
            ) : filteredClubs.length > 0 ? (
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {filteredClubs.map((club) => (
                        <motion.div key={club.id} variants={item} layout>
                            <ClubCard club={club} />
                        </motion.div>
                    ))}
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-20 glass rounded-3xl"
                >
                    <p className="text-gray-500 text-lg">
                        {searchTerm ? 'No clubs found matching your search.' : 'No clubs available yet.'}
                    </p>
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="mt-4 text-brand-600 hover:text-brand-700 font-medium"
                        >
                            Clear search
                        </button>
                    )}
                </motion.div>
            )}
        </div>
    );
};
