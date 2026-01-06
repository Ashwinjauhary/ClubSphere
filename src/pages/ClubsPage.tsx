import { useState, useEffect } from 'react';
import { ClubCard } from '../components/ClubCard';
import { Input } from '../components/ui/Input';
import { Search, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Club {
    id: string;
    name: string;
    slug: string;
    description: string;
    logo_url: string;
    category: string;
    founded_year: number;
    // member_count is not in the DB schema yet, we might need to join or mock it for now
    member_count: number;
}

export const ClubsPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [clubs, setClubs] = useState<Club[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchClubs();
    }, []);

    const fetchClubs = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('clubs')
                .select('*');

            if (error) throw error;

            // Transform data to match UI needs (e.g. adding mock member_count if missing)
            const formattedClubs = (data || []).map(club => ({
                ...club,
                member_count: Math.floor(Math.random() * 50) + 10 // Mock count for now as it's not in schema
            }));

            setClubs(formattedClubs);
        } catch (error) {
            console.error('Error fetching clubs:', error);
        } finally {
            setLoading(false);
        }
    };

    const categories = Array.from(new Set(clubs.map(c => c.category)));

    const filteredClubs = clubs.filter(club => {
        const matchesSearch = club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            club.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory ? club.category === selectedCategory : true;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Explore Clubs</h1>
                    <p className="text-gray-500 mt-1">Find your community and join the excitement.</p>
                </div>
                {/* <Button>Start a Club</Button> */} {/* Only for Admin? */}
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <Input
                        placeholder="Search clubs..."
                        icon={<Search className="h-5 w-5 text-gray-400" />}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="sm:w-48">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Filter className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                            className="block w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm appearance-none"
                            value={selectedCategory || ''}
                            onChange={(e) => setSelectedCategory(e.target.value || null)}
                        >
                            <option value="">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Club Grid */}
            {loading ? (
                <div className="text-center py-12">Loading clubs...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClubs.map(club => (
                        <ClubCard
                            key={club.id}
                            id={club.id}
                            name={club.name}
                            description={club.description}
                            category={club.category}
                            logoUrl={club.logo_url}
                            memberCount={club.member_count}
                        />
                    ))}

                    {filteredClubs.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            No clubs found matching your criteria.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
