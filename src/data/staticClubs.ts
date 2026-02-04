import { CODESTER_CLUB_DATA } from './codesterData';
import { LOGIX_CLUB_DATA } from './logixData';
import { STELLAR_CLUB_DATA } from './stellarData';
import { PRAYAS_CLUB_DATA } from './prayasData';

// Interface matching the structure of our static data
export interface StaticClubData {
    id: string;
    name: string;
    slug: string;
    description: string;
    category: string;
    founded_year: number;
    logo_url: string;
    banner_url: string;
    vision?: string;
    mission?: string[];
    ambassadors?: { name: string; role: string }[];
    core_committee?: { name: string; role: string; details: string }[];
    admin_id: string;
    created_at: string;
}

export const STATIC_CLUBS: StaticClubData[] = [
    CODESTER_CLUB_DATA,
    LOGIX_CLUB_DATA,
    STELLAR_CLUB_DATA,
    PRAYAS_CLUB_DATA
];

export const getStaticClub = (idOrSlug: string): StaticClubData | undefined => {
    return STATIC_CLUBS.find(club => club.id === idOrSlug || club.slug === idOrSlug);
};
