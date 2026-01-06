import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';

interface ClubCardProps {
    id: string;
    name: string;
    description: string;
    logoUrl?: string;
    category: string;
    memberCount?: number; // Mock data for now
}

export const ClubCard: React.FC<ClubCardProps> = ({
    id,
    name,
    description,
    logoUrl,
    category,
    memberCount = 0
}) => {
    return (
        <Link to={`/clubs/${id}`} className="group flex flex-col overflow-hidden rounded-lg bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md border border-gray-100">
            <div className="h-40 w-full bg-gray-200 relative overflow-hidden">
                {logoUrl ? (
                    <img
                        src={logoUrl}
                        alt={name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-brand-50 text-brand-300">
                        <Users className="h-16 w-16" />
                    </div>
                )}
                <div className="absolute top-2 right-2 rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-gray-700 backdrop-blur-sm">
                    {category}
                </div>
            </div>

            <div className="flex flex-1 flex-col p-4">
                <h3 className="mb-2 text-lg font-bold text-gray-900 group-hover:text-brand-600">{name}</h3>
                <p className="mb-4 text-sm text-gray-500 line-clamp-2 flex-1">
                    {description}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-3">
                    <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{memberCount} members</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="font-medium text-brand-600">View Details &rarr;</span>
                    </div>
                </div>
            </div>
        </Link>
    );
};
