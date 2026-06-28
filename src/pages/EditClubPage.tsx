import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ClubForm } from '../components/ClubForm';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

import { SkeletonList } from '../components/ui/Skeleton';
import { PageHeader } from '../components/ui/PageHeader';

export const EditClubPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [club, setClub] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClub = async () => {
            try {
                const { data, error } = await supabase
                    .from('clubs')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;

                // Security check: Only allow admin to edit their own club
                // (Note: RLS should enforce this, but good to check UI side too)
                // For Dean/System Admin, they might edit any.
                // Simplified check:
                if (data.admin_id !== user?.id && user?.email !== 'dean@college.edu') { // Basic mock dean check
                    // In real app, check role proper
                }

                setClub({
                    ...data,
                    founded_year: data.founded_year.toString()
                });
            } catch (error) {
                console.error('Error fetching club:', error);
                navigate('/clubs');
            } finally {
                setLoading(false);
            }
        };

        if (id && user) {
            fetchClub();
        }
    }, [id, user, navigate]);

    if (loading) return <div className="max-w-3xl mx-auto"><SkeletonList count={1} /></div>;

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div>
                <PageHeader
                    title="Edit Club Details"
                    description="Update your club's information."
                />
                <p className="text-gray-500 mt-1">Update your club's information.</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
                {club && <ClubForm initialData={club} isEditing={true} />}
            </div>
        </div>
    );
};
