import React from 'react';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface EventCardProps {
    id: string;
    title: string;
    clubName: string;
    date: string;
    time: string;
    location: string;
    imageUrl?: string;
    status?: 'upcoming' | 'past' | 'live';
}

export const EventCard = ({
    id,
    title,
    clubName,
    date,
    time,
    location,
    imageUrl,
    status = 'upcoming'
}: EventCardProps) => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/events/${id}`);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
        }
    };

    const isLive = status === 'live';
    const isPast = status === 'past';

    return (
        <div
            onClick={handleClick}
            onKeyPress={handleKeyPress}
            tabIndex={0}
            role="button"
            aria-label={`View details for ${title} event`}
            className="group flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-xl hover:translate-y-[-4px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 w-full break-inside-avoid"
        >
            {/* Image Section */}
            <div className="relative w-full bg-gray-100 rounded-t-2xl overflow-hidden">
                {imageUrl ? (
                    <img loading="lazy" decoding="async"
                        src={imageUrl}
                        alt={title}
                        className="w-full h-auto object-contain block"
                    />
                ) : (
                    <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-brand-50 to-purple-50">
                        <Calendar className="h-12 w-12 text-brand-200" />
                    </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                    <span className={`
                        inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm backdrop-blur-md
                        ${isLive ? 'bg-red-500/90 text-white animate-pulse' : ''}
                        ${isPast ? 'bg-gray-500/90 text-white' : ''}
                        ${!isLive && !isPast ? 'bg-white/90 text-brand-700' : ''}
                    `}>
                        {status}
                    </span>
                </div>

                {/* Date Overlay (Optional design choice for "structure") */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-white text-xs font-medium truncate">{clubName}</p>
                </div>
            </div>

            {/* Content Section */}
            <div className="flex flex-1 flex-col p-5">
                <div className="mb-1">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-brand-50 text-brand-600 mb-2">
                        {clubName}
                    </span>
                </div>

                <h3 className="mb-4 text-lg font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-brand-600 transition-colors">
                    {title}
                </h3>

                <div className="space-y-3 mt-auto">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 p-1.5 rounded-md bg-gray-50 text-gray-400 group-hover:text-brand-500 group-hover:bg-brand-50 transition-colors">
                            <Calendar className="h-3.5 w-3.5" />
                        </div>
                        <div className="text-sm text-gray-600">
                            <p className="font-medium text-gray-900">{date}</p>
                            <p className="text-xs text-gray-500">{time}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-md bg-gray-50 text-gray-400 group-hover:text-brand-500 group-hover:bg-brand-50 transition-colors">
                            <MapPin className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-sm text-gray-600 line-clamp-1">{location}</span>
                    </div>
                </div>
            </div>

            {/* Footer / Action */}
            <div className="p-4 pt-0 mt-2">
                <div className="w-full py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-center text-sm font-medium text-gray-600 group-hover:bg-brand-600 group-hover:text-white group-hover:border-brand-600 transition-all duration-300 flex items-center justify-center gap-2">
                    View Details
                    <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
        </div>
    );
};
