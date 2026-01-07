import { useNavigate } from 'react-router-dom';
import { Building2, Users, Calendar, ArrowRight } from 'lucide-react';

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

    return (
        <div
            onClick={() => navigate(`/clubs/${club.id}`)}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-brand-300 transition-all duration-300 cursor-pointer group"
        >
            {/* Banner Image */}
            <div className="h-40 bg-gradient-to-r from-brand-500 to-brand-600 relative overflow-hidden">
                {club.banner_url ? (
                    <img
                        src={club.banner_url}
                        alt={`${club.name} banner`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-400 via-brand-500 to-brand-600">
                        <Building2 className="h-20 w-20 text-white opacity-30" />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-6">
                {/* Club Logo and Name */}
                <div className="flex items-start gap-4 mb-4">
                    <div className="h-16 w-16 rounded-lg border-2 border-gray-200 bg-white shadow-md overflow-hidden flex-shrink-0">
                        {club.logo_url ? (
                            <img
                                src={club.logo_url}
                                alt={`${club.name} logo`}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                                <span className="text-white text-xl font-bold">
                                    {club.name.charAt(0)}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-brand-600 transition-colors mb-1 truncate">
                            {club.name}
                        </h3>
                        {club.category && (
                            <span className="inline-block px-2 py-1 text-xs font-medium bg-brand-100 text-brand-700 rounded-full">
                                {club.category}
                            </span>
                        )}
                    </div>
                </div>

                {/* Description */}
                <p className="text-gray-600 text-sm line-clamp-3 mb-4 min-h-[3rem]">
                    {club.description || 'No description available'}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                        {club.founded_year && (
                            <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{club.founded_year}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>Members</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 text-brand-600 font-medium text-sm group-hover:gap-2 transition-all">
                        <span>View</span>
                        <ArrowRight className="h-4 w-4" />
                    </div>
                </div>
            </div>
        </div>
    );
};
