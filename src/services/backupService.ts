import { supabase } from '../lib/supabase';
import { saveAs } from 'file-saver';

export const fetchFullBackup = async () => {
    try {
        const timestamp = new Date().toISOString();

        // Fetch data from all major tables in parallel
        const [
            { data: profiles },
            { data: clubs },
            { data: clubMembers },
            { data: events },
            { data: clubApplications },
            { data: reports },
            { data: notifications }
        ] = await Promise.all([
            supabase.from('profiles').select('*'),
            supabase.from('clubs').select('*'),
            supabase.from('club_members').select('*'),
            supabase.from('events').select('*'),
            supabase.from('club_applications').select('*'),
            supabase.from('reports').select('*'),
            supabase.from('notifications').select('*')
        ]);

        const backupData = {
            metadata: {
                timestamp,
                version: '1.0',
                appName: 'ClubSphere',
            },
            data: {
                profiles: profiles || [],
                clubs: clubs || [],
                club_members: clubMembers || [],
                events: events || [],
                club_applications: clubApplications || [],
                reports: reports || [],
                notifications: notifications || []
            }
        };

        return backupData;
    } catch (error) {
        console.error('Error creating backup:', error);
        throw error;
    }
};

export const downloadBackup = (data: any) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const fileName = `clubsphere_backup_${new Date().toISOString().split('T')[0]}.json`;
    saveAs(blob, fileName);
};
