import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { User, Mail, Hash, Briefcase, Camera, Shield } from 'lucide-react';
import { SkeletonList } from '../components/ui/Skeleton';
import { PageHeader } from '../components/ui/PageHeader';
import { toast } from 'sonner';
import { ImageUpload } from '../components/ui/ImageUpload';

interface Profile {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string;
    role: 'student' | 'admin' | 'dean';
    roll_number?: string;
    branch?: string;
    year?: string;
    section?: string;
    employee_id?: string;
    department?: string;
    designation?: string;
    office_location?: string;
}

interface ClubMembership {
    id: string;
    designation: string;
    joined_at: string;
    clubs: {
        id: string;
        name: string;
        logo_url: string;
    };
}

export const ProfilePage = () => {
    const { user, checkUser } = useAuthStore();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [memberships, setMemberships] = useState<ClubMembership[]>([]);
    const [managedClub, setManagedClub] = useState<{ id: string, name: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    // Form State - Common
    const [fullName, setFullName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');

    // Form State - Student
    const [rollNo, setRollNo] = useState('');
    const [branch, setBranch] = useState('');
    const [year, setYear] = useState('');
    const [section, setSection] = useState('');

    // Form State - Dean/Admin
    const [employeeId, setEmployeeId] = useState('');
    const [department, setDepartment] = useState('');
    const [designation, setDesignation] = useState('');
    const [officeLocation, setOfficeLocation] = useState('');

    useEffect(() => {
        if (user) {
            fetchProfileData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const fetchProfileData = async () => {
        try {
            setLoading(true);
            if (!user) return;

            // 1. Fetch Profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileError) throw profileError;
            if (profileData) {
                setProfile(profileData as Profile);
                setFullName(profileData.full_name || '');
                setRollNo(profileData.roll_number || '');
                setAvatarUrl(profileData.avatar_url || '');
                setBranch(profileData.branch || '');
                setYear(profileData.year || '');
                setSection(profileData.section || '');
                setEmployeeId(profileData.employee_id || '');
                setDepartment(profileData.department || '');
                setDesignation(profileData.designation || '');
                setOfficeLocation(profileData.office_location || '');
            }

            // 2. Fetch Memberships
            const { data: memberData, error: memberError } = await supabase
                .from('club_members')
                .select(`
                    id, 
                    designation, 
                    joined_at,
                    clubs ( id, name, logo_url )
                `)
                .eq('user_id', user.id);

            if (memberError) console.error('Error fetching memberships:', memberError);
            setMemberships(memberData as unknown as ClubMembership[]);

            // 3. Fetch Managed Club (if Admin)
            if (profileData.role === 'admin') {
                const { data: clubData, error: clubError } = await supabase
                    .from('clubs')
                    .select('id, name')
                    .eq('admin_id', user.id)
                    .maybeSingle();

                if (!clubError && clubData) {
                    setManagedClub(clubData);
                }
            }

        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async () => {
        try {
            setUpdating(true);
            if (!user) return;

            // Build update object based on role
            const updates: any = {
                full_name: fullName,
                avatar_url: avatarUrl,
                updated_at: new Date().toISOString(),
            };

            // Add role-specific fields
            if (profile?.role === 'student') {
                updates.roll_number = rollNo;
                updates.branch = branch;
                updates.year = year;
                updates.section = section;
            } else if (profile?.role === 'dean' || profile?.role === 'admin') {
                updates.employee_id = employeeId;
                updates.department = department;
                updates.designation = designation;
                if (profile?.role === 'dean') {
                    updates.office_location = officeLocation;
                }
            }

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id);

            if (error) throw error;

            // Also update Auth metadata so the sidebar picks it up immediately
            await supabase.auth.updateUser({
                data: {
                    full_name: fullName,
                    avatar_url: avatarUrl,
                }
            });

            await checkUser();

            toast.success('Profile updated successfully!');
            fetchProfileData();

        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile.');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <div className="max-w-4xl mx-auto py-12"><SkeletonList count={4} /></div>;
    if (!profile) return <div className="text-center py-12">Profile not found.</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 p-6 sm:p-8">
            <PageHeader title="My Profile" description="Manage your personal information and preferences." />

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 md:p-8 space-y-8">

                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                        <div className="relative">
                            {avatarUrl ? (
                                <img loading="lazy" decoding="async" src={avatarUrl} alt="Avatar" className="w-32 h-32 rounded-full object-cover border-4 border-gray-100 shadow-sm" />
                            ) : (
                                <div className="w-32 h-32 rounded-full bg-brand-100 flex items-center justify-center border-4 border-white shadow-sm">
                                    <User className="w-16 h-16 text-brand-500" />
                                </div>
                            )}
                            <div className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md border border-gray-100 text-gray-400 hover:text-brand-600 cursor-pointer">
                                <Camera className="w-4 h-4" />
                            </div>
                        </div>

                        <div className="flex-1 text-center md:text-left space-y-2">
                            <h2 className="text-2xl font-bold text-gray-900">{profile.full_name || 'No Name Set'}</h2>
                            <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-center md:items-start text-sm text-gray-500">
                                <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {profile.email}</span>
                                <span className="flex items-center gap-1 capitalize px-2 py-0.5 bg-gray-100 rounded-full text-gray-700">
                                    <Shield className="w-3 h-3" /> {profile.role}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Edit Form */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Edit Details</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border p-2"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>

                                {/* Role-based fields */}
                                {profile?.role === 'student' ? (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Hash className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input type="text" value={rollNo} onChange={(e) => setRollNo(e.target.value)} className="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border p-2" placeholder="2101330100123" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                                            <select value={branch} onChange={(e) => setBranch(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border p-2">
                                                <option value="">Select Branch</option>
                                                <option value="BCA">BCA (Bachelor of Computer Applications)</option>
                                                <option value="BBA">BBA (Bachelor of Business Administration)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                                            <select value={year} onChange={(e) => setYear(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border p-2">
                                                <option value="">Select Year</option>
                                                <option value="1st Year">1st Year</option>
                                                <option value="2nd Year">2nd Year</option>
                                                <option value="3rd Year">3rd Year</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                                            <input type="text" value={section} onChange={(e) => setSection(e.target.value.toUpperCase())} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border p-2" placeholder="A" maxLength={1} />
                                        </div>
                                    </>
                                ) : (profile?.role === 'dean' || profile?.role === 'admin') ? (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Hash className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input type="text" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border p-2" placeholder="EMP001" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Briefcase className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} className="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border p-2" placeholder="Computer Science" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                                            <input type="text" value={designation} onChange={(e) => setDesignation(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border p-2" placeholder="Dean, HOD" />
                                        </div>
                                        {profile?.role === 'dean' && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Office Location</label>
                                                <input type="text" value={officeLocation} onChange={(e) => setOfficeLocation(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border p-2" placeholder="Admin Block, Room 201" />
                                            </div>
                                        )}
                                    </>
                                ) : null}

                                <div>
                                    <ImageUpload
                                        label="Profile Picture (Avatar)"
                                        value={avatarUrl}
                                        onChange={(url) => setAvatarUrl(url)}
                                        bucket="avatars"
                                    />
                                </div>

                                <div className="pt-2">
                                    <Button onClick={handleUpdateProfile} loading={updating} className="w-full">
                                        Save Changes
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Associations */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">My Associations</h3>

                            {managedClub && (
                                <div className="bg-brand-50 border border-brand-100 rounded-lg p-4">
                                    <h4 className="flex items-center gap-2 text-brand-800 font-semibold mb-2">
                                        <Briefcase className="w-4 h-4" /> Faculty Coordinator
                                    </h4>
                                    <p className="text-sm text-brand-600">
                                        You are the admin for <span className="font-bold">{managedClub.name}</span>.
                                    </p>
                                </div>
                            )}

                            {profile?.role === 'student' && (
                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Club Memberships</h4>
                                    {memberships.length === 0 ? (
                                        <p className="text-sm text-gray-500 italic">You haven't joined any clubs yet.</p>
                                    ) : (
                                        memberships.map(m => (
                                            <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                                                {m.clubs.logo_url ? (
                                                    <img loading="lazy" decoding="async" src={m.clubs.logo_url} alt={m.clubs.name} className="h-10 w-10 rounded-full object-cover flex-shrink-0 border border-gray-200" />
                                                ) : (
                                                    <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 text-lg">
                                                        {m.clubs.name.charAt(0)}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium text-gray-900">{m.clubs.name}</p>
                                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                                        <span className="bg-gray-200 px-1.5 rounded text-[10px] text-gray-700 uppercase">{m.designation || 'Member'}</span>
                                                        <span>• Joined {new Date(m.joined_at).getFullYear()}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
