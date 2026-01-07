import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AlignLeft, Image as ImageIcon, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { generateClubBio } from '../services/aiService';
import { Sparkles } from 'lucide-react';
import { useState } from 'react';

const clubSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    description: z.string().min(20, 'Description must be detailed (min 20 chars)'),
    category: z.string().min(3, 'Category is required'),
    logo_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    banner_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    founded_year: z.string().refine((val) => !isNaN(parseInt(val)), 'Must be a valid year'),
    admin_email: z.string().email('Invalid email').optional().or(z.literal('')), // New field for Dean
});

type ClubFormData = z.infer<typeof clubSchema>;

interface ClubFormProps {
    initialData?: ClubFormData & { id?: string, admin_id?: string };
    isEditing?: boolean;
}

export const ClubForm = ({ initialData, isEditing = false }: ClubFormProps) => {
    const navigate = useNavigate();
    const { user, role } = useAuthStore();
    const [generating, setGenerating] = useState(false);
    const { register, handleSubmit, setError, setValue, watch, formState: { errors, isSubmitting } } = useForm<ClubFormData>({
        resolver: zodResolver(clubSchema),
        defaultValues: initialData || { founded_year: new Date().getFullYear().toString() }
    });

    const handleEnhanceBio = async () => {
        const name = watch('name');
        const category = watch('category');

        if (!name || !category) {
            alert("Please fill in Club Name and Category first.");
            return;
        }

        setGenerating(true);
        try {
            const bio = await generateClubBio(name, category, "To foster excellence and community engagement.");
            setValue('description', bio);
        } catch (e) {
            console.error(e);
        } finally {
            setGenerating(false);
        }
    };

    const onSubmit = async (data: ClubFormData) => {
        try {
            let newAdminId = initialData?.admin_id;

            // If Dean provided an email, look up the user
            if (role === 'dean' && data.admin_email) {
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('email', data.admin_email)
                    .single();

                if (profileError || !profileData) {
                    setError('admin_email', { message: 'User not found. They must register first.' });
                    return;
                }
                newAdminId = profileData.id;

                // Optional: Auto-promote to admin role if they are student
                await supabase.from('profiles').update({ role: 'admin' }).eq('id', newAdminId);
            }

            const clubPayload = {
                name: data.name,
                description: data.description,
                category: data.category,
                logo_url: data.logo_url,
                banner_url: data.banner_url,
                founded_year: parseInt(data.founded_year),
                admin_id: isEditing ? newAdminId : (newAdminId || user?.id), // Use looked-up ID, or current user
            };

            if (isEditing && initialData?.id) {
                const { error } = await supabase
                    .from('clubs')
                    .update(clubPayload)
                    .eq('id', initialData.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('clubs')
                    .insert({
                        ...clubPayload,
                        slug: data.name.toLowerCase().replace(/ /g, '-'),
                    });
                if (error) throw error;
            }
            navigate('/clubs');
        } catch (error) {
            console.error('Error saving club:', error);
            alert('Failed to save club details.');
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
                label="Club Name"
                placeholder="e.g. Coding Club"
                error={errors.name?.message}
                {...register('name')}
            />

            <div className="space-y-1">
                <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <button
                        type="button"
                        onClick={handleEnhanceBio}
                        disabled={generating}
                        className="text-xs flex items-center text-brand-600 hover:text-brand-700 font-medium disabled:opacity-50"
                    >
                        <Sparkles className="h-3 w-3 mr-1" />
                        {generating ? 'Enhancing...' : 'Enhance Bio with AI'}
                    </button>
                </div>
                <div className="relative">
                    <div className="absolute top-3 left-3 text-gray-400 pointer-events-none">
                        <AlignLeft className="h-5 w-5" />
                    </div>
                    <textarea
                        className={`block w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm h-32 ${errors.description ? 'border-red-500' : ''}`}
                        placeholder="Describe the club's mission and activities..."
                        {...register('description')}
                    />
                </div>
                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
            </div>

            {/* Admin Assignment Field - Only for Dean */}
            {role === 'dean' && (
                <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
                    <h3 className="text-sm font-medium text-yellow-800 mb-2">Assign Faculty Coordinator</h3>
                    <Input
                        label="Faculty Email"
                        placeholder="faculty@college.edu"
                        icon={<UserCheck className="h-5 w-5 text-gray-400" />}
                        error={errors.admin_email?.message}
                        {...register('admin_email')}
                    />
                    <p className="text-xs text-yellow-600 mt-1">
                        Enter the email of the Faculty Member you want to assign as the coordinator for this club.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Input
                    label="Category"
                    placeholder="e.g. Technical"
                    error={errors.category?.message}
                    {...register('category')}
                />
                <Input
                    label="Founded Year"
                    placeholder="2024"
                    type="number"
                    error={errors.founded_year?.message}
                    {...register('founded_year')}
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Input
                    label="Logo URL"
                    placeholder="https://..."
                    icon={<ImageIcon className="h-5 w-5 text-gray-400" />}
                    error={errors.logo_url?.message}
                    {...register('logo_url')}
                />
                <Input
                    label="Banner URL"
                    placeholder="https://..."
                    icon={<ImageIcon className="h-5 w-5 text-gray-400" />}
                    error={errors.banner_url?.message}
                    {...register('banner_url')}
                />
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
                <Button type="submit" loading={isSubmitting}>
                    {isEditing ? 'Update Club' : 'Create Club'}
                </Button>
            </div>
        </form>
    );
};
