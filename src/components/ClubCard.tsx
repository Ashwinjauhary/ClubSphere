import { useNavigate } from 'react-router-dom';
import { Users, Calendar, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Club {
    id: string;
    name: string;
    slug: string;
    description: string;
    logo_url?: string;
    banner_url?: string;
    category?: string;
    founded_year?: number;
}

interface ClubCardProps {
    club: Club;
}

export const ClubCard = ({ club }: ClubCardProps) => {
    const navigate = useNavigate();
    const [memberCount, setMemberCount] = useState<number>(0);

    useEffect(() => {
         
        fetchMemberCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [club.id]);

    const fetchMemberCount = async () => {
        const { count, error } = await supabase
            .from('club_members')
            .select('*', { count: 'exact', head: true })
            .eq('club_id', club.id);

        if (!error && count !== null) {
            setMemberCount(count);
        }
    };

    return (
        <div
            onClick={() => navigate(`/clubs/${club.id}`)}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-brand-300 transition-all duration-300 cursor-pointer group"
        >
            {/* Content */}
            <div className="p-6 flex flex-col items-center text-center h-full relative z-10">
                {/* Decorative Background Blob */}
                <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-brand-50/80 to-transparent -z-10" />

                {/* Club Logo */}
                <div className="h-28 w-28 rounded-full bg-white shadow-md p-1.5 ring-4 ring-white mb-5 transition-transform duration-300 group-hover:scale-105">
                    <div className="h-full w-full rounded-full overflow-hidden bg-gray-50 flex items-center justify-center border border-gray-100">
                        {club.logo_url ? (
                            <img loading="lazy" decoding="async"
                                src={club.logo_url}
                                alt={`${club.name} logo`}
                                className="w-full h-full object-contain p-1"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                                <span className="text-white text-3xl font-bold">
                                    {club.name.charAt(0)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Name & Category */}
                <div className="w-full mb-3">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-brand-600 transition-colors mb-2 line-clamp-1">
                        {club.name}
                    </h3>
                    {club.category && (
                        <span className="inline-flex px-3 py-1 text-xs font-semibold bg-brand-50 text-brand-700 rounded-full border border-brand-100">
                            {club.category}
                        </span>
                    )}
                </div>

                {/* Description */}
                <p className="text-gray-500 text-sm line-clamp-2 mb-6 flex-grow">
                    {club.description || 'No description available'}
                </p>

                {/* Footer Stats - Compact */}
                <div className="w-full pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                            <span>{club.founded_year || '2024'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 text-gray-400" />
                            <span>{memberCount}</span>
                        </div>
                    </div>

                    <span className="text-brand-600 flex items-center gap-1 group-hover:underline">
                        Visit <ArrowRight className="h-3 w-3" />
                    </span>
                </div>
            </div>
        </div>
    );
};
