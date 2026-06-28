import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { Users, Save, Trash2, Edit2, X } from 'lucide-react';
import { SkeletonList } from '../components/ui/Skeleton';
import { PageHeader } from '../components/ui/PageHeader';

interface ClubMember {
    id: string;
    user_id: string;
    designation: string;
    joined_at: string;
    profile: {
        full_name: string;
        email: string;
        avatar_url: string | null;
        roll_number?: string;
    };
}

export const ClubMembersPage = () => {
    const { managedClubId } = useAuthStore();
    const [members, setMembers] = useState<ClubMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [tempDesignation, setTempDesignation] = useState('');

    // Add Member State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberRollNo, setNewMemberRollNo] = useState('');
    const [newMemberDesignation, setNewMemberDesignation] = useState('');
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        if (managedClubId) {
            fetchMembers();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [managedClubId]);

    const fetchMembers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('club_members')
                .select(`
                    id,
                    user_id,
                    designation,
                    joined_at,
                    profile:profiles!user_id (
                        full_name,
                        email,
                        avatar_url,
                        roll_number
                    )
                `)
                .eq('club_id', managedClubId);

            if (error) throw error;

            setMembers((data as unknown as ClubMember[]) || []);
        } catch (error) {
            console.error('Error fetching members:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMember = async () => {
        if (!newMemberEmail || !newMemberDesignation) {
            alert('Please fill in Email and Designation.');
            return;
        }

        try {
            setAdding(true);

            // 1. Find User by Email
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id, full_name, roll_number')
                .eq('email', newMemberEmail)
                .single();

            if (profileError || !profile) {
                alert('User not found. They must register first.');
                return;
            }

            // 2. Update Name/Roll Number if provided
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const updates: any = {};
            if (newMemberRollNo && profile.roll_number !== newMemberRollNo) {
                updates.roll_number = newMemberRollNo;
            }
            if (newMemberName && profile.full_name !== newMemberName) {
                updates.full_name = newMemberName;
            }

            if (Object.keys(updates).length > 0) {
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update(updates)
                    .eq('id', profile.id);

                if (updateError) {
                    console.error('Error updating profile details:', updateError);
                    // We continue even if profile update fails, or should we stop? 
                    // Let's warn but try to add member.
                }
            }

            // 3. Add to Club Members
            const { error: insertError } = await supabase
                .from('club_members')
                .insert([{
                    club_id: managedClubId,
                    user_id: profile.id,
                    designation: newMemberDesignation,
                    role: 'member'
                }]);

            if (insertError) {
                if (insertError.code === '23505') { // Unique violation
                    alert('User is already a member of this club.');
                } else {
                    throw insertError;
                }
                return;
            }

            // 4. Refresh List
            await fetchMembers();
            setIsAddModalOpen(false);
            setNewMemberEmail('');
            setNewMemberName('');
            setNewMemberRollNo('');
            setNewMemberDesignation('');
            alert('Member added successfully!');

        } catch (error) {
            console.error('Error adding member:', error);
            alert('Failed to add member.');
        } finally {
            setAdding(false);
        }
    };

    const handleEdit = (member: ClubMember) => {
        setEditingId(member.id);
        setTempDesignation(member.designation || 'Member');
    };

    const handleSave = async (id: string) => {
        try {
            const { error } = await supabase
                .from('club_members')
                .update({ designation: tempDesignation })
                .eq('id', id);

            if (error) throw error;

            setMembers(members.map(m =>
                m.id === id ? { ...m, designation: tempDesignation } : m
            ));
            setEditingId(null);
        } catch (error) {
            console.error('Error updating member:', error);
            alert('Failed to update designation.');
        }
    };

    const handleRemove = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to remove ${name} from the club?`)) return;

        try {
            const { error } = await supabase
                .from('club_members')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setMembers(members.filter(m => m.id !== id));
        } catch (error) {
            console.error('Error removing member:', error);
            alert('Failed to remove member.');
        }
    };

    if (!managedClubId) return <div className="p-8 text-center text-gray-500">You are not assigned to manage any club.</div>;
    if (loading) return <div className="space-y-6"><SkeletonList count={5} /></div>;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Manage Team"
                description="Customize designations and manage your club members."
                action={
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
                    >
                        <Users className="h-4 w-4 mr-2" /> Add Member
                    </button>
                }
            />

            {/* Add Member Modal */}
            {
                isAddModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-900">Add New Member</h3>
                                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Student Email</label>
                                    <input
                                        type="email"
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-2"
                                        placeholder="student@college.edu"
                                        value={newMemberEmail}
                                        onChange={(e) => setNewMemberEmail(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name (Optional)</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-2"
                                        placeholder="Update Name"
                                        value={newMemberName}
                                        onChange={(e) => setNewMemberName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number (Optional)</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-2"
                                        placeholder="e.g. 2023CSB101"
                                        value={newMemberRollNo}
                                        onChange={(e) => setNewMemberRollNo(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-2"
                                        placeholder="e.g. Logistics Head"
                                        value={newMemberDesignation}
                                        onChange={(e) => setNewMemberDesignation(e.target.value)}
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddMember}
                                        disabled={adding}
                                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50"
                                    >
                                        {adding ? 'Adding...' : 'Add Member'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Member
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Designation
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Email
                                </th>
                                <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {members.map((member) => (
                                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 flex-shrink-0">
                                                {member.profile.avatar_url ? (
                                                    <img loading="lazy" decoding="async" className="h-10 w-10 rounded-full object-cover" src={member.profile.avatar_url} alt="" />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                        <Users className="h-5 w-5 text-gray-400" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{member.profile.full_name}</div>
                                                <div className="text-xs text-gray-500">Joined {new Date(member.joined_at).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {editingId === member.id ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={tempDesignation}
                                                    onChange={(e) => setTempDesignation(e.target.value)}
                                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm px-2 py-1 border"
                                                />
                                            </div>
                                        ) : (
                                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                                                {member.designation || 'Member'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {member.profile.email}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {editingId === member.id ? (
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleSave(member.id)} className="text-green-600 hover:text-green-900">
                                                    <Save className="h-5 w-5" />
                                                </button>
                                                <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-500">
                                                    <X className="h-5 w-5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex justify-end gap-3">
                                                <button onClick={() => handleEdit(member)} className="text-brand-600 hover:text-brand-900">
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => handleRemove(member.id, member.profile.full_name)} className="text-red-600 hover:text-red-900">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
};
