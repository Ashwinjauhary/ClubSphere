import React from 'react';
import { Calendar, MapPin, Clock, ArrowRight } from 'lucide-react';
import { Button } from './ui/Button';
import { Link, useNavigate } from 'react-router-dom';

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

    return (
        <div
            onClick={handleClick}
            onKeyPress={handleKeyPress}
            tabIndex={0}
            role="button"
            aria-label={`View details for ${title} event`}
            className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md hover:border-brand-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
        >
            <div className="relative h-48 w-full bg-gray-200 overflow-hidden">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-brand-50 text-brand-300">
                        <Calendar className="h-16 w-16" />
                    </div>
                )}
                <div className="absolute top-3 right-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-brand-700 backdrop-blur-sm shadow-sm uppercase tracking-wider">
                    {status}
                </div>
            </div>

            <div className="flex flex-1 flex-col p-5">
                <div className="mb-2 text-xs font-semibold text-brand-600 uppercase tracking-wide">
                    {clubName}
                </div>
                <h3 className="mb-3 text-xl font-bold text-gray-900 leading-tight">
                    {title}
                </h3>

                <div className="space-y-2 mb-6">
                    <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                        <span>{date}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                        <Clock className="mr-2 h-4 w-4 text-gray-400" />
                        <span>{time}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                        <span>{location}</span>
                    </div>
                </div>

                <div className="mt-auto">
                    <Link to={`/events/${id}`} className="w-full">
                        <Button variant="outline" className="w-full justify-between group-hover:bg-brand-50 group-hover:text-brand-700 group-hover:border-brand-200">
                            View Details
                            <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
};
