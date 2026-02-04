import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { ArrowLeft, Plus, Pencil, Trash2, Users } from 'lucide-react';
import { motion } from 'framer-motion';

interface Ambassador {
    name: string;
    role: string;
    email: string;
}

interface CommitteeMember {
    name: string;
    role: string;
    details: string;
    email: string;
}

type TeamMemberType = 'ambassador' | 'committee';

export const ClubTeamManagementPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, role } = useAuthStore();

    const [clubName, setClubName] = useState('');
    const [clubAdminId, setClubAdminId] = useState('');
    const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
    const [committee, setCommittee] = useState<CommitteeMember[]>([]);
    const [activeTab, setActiveTab] = useState<TeamMemberType>('ambassador');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        details: '',
        email: ''
    });

    useEffect(() => {
        fetchClubData();
    }, [id]);

    const fetchClubData = async () => {
        try {
            const { data, error } = await supabase
                .from('clubs')
                .select('name, admin_id, ambassadors, core_committee')
                .eq('id', id)
                .single();

            if (error) throw error;

            setClubName(data.name);
            setClubAdminId(data.admin_id);
            setAmbassadors(data.ambassadors || []);
            setCommittee(data.core_committee || []);
        } catch (error) {
            console.error('Error fetching club:', error);
        } finally {
            setLoading(false);
        }
    };

    const isAuthorized = () => {
        if (!user) return false;
        return role === 'dean' || role === 'super_admin' || user.id === clubAdminId;
    };

    const handleAdd = () => {
        setEditingIndex(null);
        setFormData({ name: '', role: '', details: '', email: '' });
        setShowModal(true);
    };

    const handleEdit = (index: number) => {
        setEditingIndex(index);
        if (activeTab === 'ambassador') {
            const member = ambassadors[index];
            setFormData({ name: member.name, role: member.role, details: '', email: member.email || '' });
        } else {
            const member = committee[index];
            setFormData({ name: member.name, role: member.role, details: member.details, email: member.email || '' });
        }
        setShowModal(true);
    };

    const handleDelete = async (index: number) => {
        if (!confirm('Are you sure you want to delete this team member?')) return;

        try {
            let updatedData;
            if (activeTab === 'ambassador') {
                updatedData = ambassadors.filter((_, i) => i !== index);
                setAmbassadors(updatedData);
                await supabase
                    .from('clubs')
                    .update({ ambassadors: updatedData })
                    .eq('id', id);
            } else {
                updatedData = committee.filter((_, i) => i !== index);
                setCommittee(updatedData);
                await supabase
                    .from('clubs')
                    .update({ core_committee: updatedData })
                    .eq('id', id);
            }
            alert('Team member deleted successfully!');
        } catch (error) {
            console.error('Error deleting:', error);
            alert('Failed to delete team member.');
        }
    };

    const handleSave = async () => {
        if (!formData.name || !formData.role || !formData.email) {
            alert('Please fill in all required fields.');
            return;
        }

        if (activeTab === 'committee' && !formData.details) {
            alert('Please provide details for committee member.');
            return;
        }

        try {
            if (activeTab === 'ambassador') {
                const newMember: Ambassador = {
                    name: formData.name,
                    role: formData.role,
                    email: formData.email
                };

                let updatedAmbassadors;
                if (editingIndex !== null) {
                    updatedAmbassadors = [...ambassadors];
                    updatedAmbassadors[editingIndex] = newMember;
                } else {
                    updatedAmbassadors = [...ambassadors, newMember];
                }

                await supabase
                    .from('clubs')
                    .update({ ambassadors: updatedAmbassadors })
                    .eq('id', id);

                setAmbassadors(updatedAmbassadors);
            } else {
                const newMember: CommitteeMember = {
                    name: formData.name,
                    role: formData.role,
                    details: formData.details,
                    email: formData.email
                };

                let updatedCommittee;
                if (editingIndex !== null) {
                    updatedCommittee = [...committee];
                    updatedCommittee[editingIndex] = newMember;
                } else {
                    updatedCommittee = [...committee, newMember];
                }

                await supabase
                    .from('clubs')
                    .update({ core_committee: updatedCommittee })
                    .eq('id', id);

                setCommittee(updatedCommittee);
            }

            setShowModal(false);
            setFormData({ name: '', role: '', details: '', email: '' });
            alert('Team member saved successfully!');
        } catch (error) {
            console.error('Error saving:', error);
            alert('Failed to save team member.');
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!isAuthorized()) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600">You don't have permission to manage this club's team.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate(`/clubs/${id}`)}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        Back to Club
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">{clubName}</h1>
                    <p className="text-gray-600 mt-1">Team Management</p>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 mb-6 flex gap-4">
                    <button
                        onClick={() => setActiveTab('ambassador')}
                        className={`flex-1 px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'ambassador'
                            ? 'bg-brand-600 text-white shadow-md'
                            : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        Ambassadors ({ambassadors.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('committee')}
                        className={`flex-1 px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'committee'
                            ? 'bg-brand-600 text-white shadow-md'
                            : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        Core Committee ({committee.length})
                    </button>
                </div>

                {/* Add Button */}
                <div className="mb-6">
                    <button
                        onClick={handleAdd}
                        className="flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl shadow-lg shadow-brand-500/30 hover:bg-brand-700 transition-all font-medium"
                    >
                        <Plus className="h-5 w-5" />
                        Add New {activeTab === 'ambassador' ? 'Ambassador' : 'Committee Member'}
                    </button>
                </div>

                {/* Team Members List */}
                <div className="space-y-4">
                    {activeTab === 'ambassador' ? (
                        ambassadors.length > 0 ? (
                            ambassadors.map((member, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className="h-12 w-12 rounded-full bg-brand-50 flex items-center justify-center text-brand-600">
                                                <Users className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
                                                <p className="text-sm text-gray-500 font-medium">{member.role}</p>
                                                {member.email && <p className="text-xs text-gray-400 mt-1">{member.email}</p>}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEdit(index)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <Pencil className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(index)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                                <p className="text-gray-500">No ambassadors added yet.</p>
                            </div>
                        )
                    ) : committee.length > 0 ? (
                        committee.map((member, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="h-12 w-12 rounded-full bg-brand-50 flex items-center justify-center text-brand-600">
                                            <Users className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
                                            <p className="text-sm text-brand-600 font-bold uppercase tracking-wider mb-1">
                                                {member.role}
                                            </p>
                                            <p className="text-xs text-gray-500 font-mono">{member.details}</p>
                                            {member.email && <p className="text-xs text-gray-400 mt-1">{member.email}</p>}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(index)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            <Pencil className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(index)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                            <p className="text-gray-500">No committee members added yet.</p>
                        </div>
                    )}
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
                        >
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                {editingIndex !== null ? 'Edit' : 'Add'}{' '}
                                {activeTab === 'ambassador' ? 'Ambassador' : 'Committee Member'}
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                                        placeholder="Enter name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Role *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                                        placeholder={
                                            activeTab === 'ambassador'
                                                ? 'e.g., Associate Professor'
                                                : 'e.g., PRESIDENT'
                                        }
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                                        placeholder="e.g., member@example.com"
                                    />
                                </div>

                                {activeTab === 'committee' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Details *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.details}
                                            onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                                            placeholder="e.g., PSITCHE-BCA-II-B | 24116002159"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex-1 px-6 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium shadow-lg shadow-brand-500/30"
                                >
                                    Save
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
};
