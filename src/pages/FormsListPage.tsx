import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { toast } from 'sonner';
import {
    Plus,
    FileText,
    Trash2,
    Eye,
    BarChart3,
    Loader2,
    Pencil,
    Share2,
    Copy,
    Download,
    X,
    QrCode
} from 'lucide-react';
import { format } from 'date-fns';
import QRCode from 'qrcode';

interface Form {
    id: string;
    event_id: string;
    title: string;
    description: string;
    created_at: string;
    is_active: boolean; // Changed from is_published to match DB schema if needed, checking... actually DB has is_active
    _count?: {
        responses: number;
    }
}

export const FormsListPage = () => {
    const navigate = useNavigate();
    const [forms, setForms] = useState<Form[]>([]);
    const [loading, setLoading] = useState(true);
    const [shareModalForm, setShareModalForm] = useState<Form | null>(null);
    const [qrDataUrl, setQrDataUrl] = useState<string>('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchForms();
    }, []);

    useEffect(() => {
        if (shareModalForm) {
            generateQRCode(shareModalForm.id);
        }
    }, [shareModalForm]);

    const fetchForms = async () => {
        try {
            // Fetch forms created by current admin
            const { data, error } = await supabase
                .from('feedback_forms')
                .select('*, feedback_responses(count)')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Format data to include response count
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const formatted = data.map((f: any) => ({
                ...f,
                _count: { responses: f.feedback_responses[0]?.count || 0 }
            }));

            setForms(formatted);
        } catch (error: any) {
            console.error('Error fetching forms:', error);
            toast.error('Failed to load forms');
        } finally {
            setLoading(false);
        }
    };

    const deleteForm = async (id: string) => {
        if (!confirm('Are you sure you want to delete this form?')) return;

        try {
            const { error } = await supabase.from('feedback_forms').delete().eq('id', id);
            if (error) throw error;
            setForms(forms.filter(f => f.id !== id));
            toast.success('Form deleted successfully');
        } catch (error: any) {
            console.error('Error deleting form:', error);
            toast.error('Failed to delete form');
        }
    };

    const generateQRCode = async (formId: string) => {
        const formUrl = `https://clubsphere.in/f/${formId}`;
        try {
            const dataUrl = await QRCode.toDataURL(formUrl, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
            setQrDataUrl(dataUrl);
        } catch (error: any) {
            console.error('Error generating QR code:', error);
            toast.error('Failed to generate QR code');
        }
    };

    const copyToClipboard = (formId: string) => {
        const formUrl = `https://clubsphere.in/f/${formId}`;
        navigator.clipboard.writeText(formUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success('Link copied to clipboard');
    };

    const downloadQRCode = () => {
        if (!qrDataUrl || !shareModalForm) return;
        const link = document.createElement('a');
        link.href = qrDataUrl;
        link.download = `${shareModalForm.title.replace(/\s+/g, '_')}_QR.png`;
        link.click();
    };

    const openShareModal = (form: Form) => {
        setShareModalForm(form);
        setCopied(false);
    };

    const closeShareModal = () => {
        setShareModalForm(null);
        setQrDataUrl('');
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-brand-600" /></div>;

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <PageHeader
                        title="My Forms"
                        description="Create, manage, and analyze your forms."
                        action={
                            <Button onClick={() => navigate('/forms/new')}>
                                <Plus className="h-4 w-4 mr-2" />
                                Create New Form
                            </Button>
                        }
                    />
                </div>

                {forms.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No forms yet</h3>
                        <p className="text-gray-500 mb-6">Create your first AI-powered form in seconds.</p>
                        <Button onClick={() => navigate('/forms/new')}>Create Generic Form</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {forms.map((form) => (
                            <div key={form.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                const newStatus = !form.is_active;
                                                // Optimistic update
                                                setForms(forms.map(f => f.id === form.id ? { ...f, is_active: newStatus } : f));
                                                try {
                                                    const { error } = await supabase.from('feedback_forms').update({ is_active: newStatus }).eq('id', form.id);
                                                    if (error) throw error;
                                                    toast.success(newStatus ? 'Form published' : 'Form unpublished');
                                                } catch (error: any) {
                                                    toast.error('Failed to update status');
                                                    // Revert
                                                    setForms(forms.map(f => f.id === form.id ? { ...f, is_active: !newStatus } : f));
                                                }
                                            }}
                                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${form.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                        >
                                            {form.is_active ? 'Published' : 'Draft'}
                                        </button>
                                        <button onClick={() => deleteForm(form.id)} className="text-gray-400 hover:text-red-500">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <h3
                                        className="text-lg font-bold text-gray-900 mb-1 hover:text-brand-600 cursor-pointer truncate"
                                        onClick={() => navigate(`/events/${form.event_id}/feedback-builder`)} // Edit link -> builder
                                    >
                                        {form.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-4 line-clamp-2 h-10">
                                        {form.description || 'No description provided'}
                                    </p>

                                    <div className="flex items-center text-xs text-gray-400 mb-4">
                                        <span>Created {format(new Date(form.created_at), 'MMM d, yyyy')}</span>
                                        <span className="mx-2">•</span>
                                        <span>{form._count?.responses || 0} Responses</span>
                                    </div>

                                    <div className="grid grid-cols-4 gap-2 pt-4 border-t border-gray-100">
                                        <button
                                            onClick={() => navigate(`/f/${form.id}`)}
                                            className="flex flex-col items-center justify-center p-2 rounded hover:bg-gray-50 text-gray-600"
                                            title="View Form"
                                        >
                                            <Eye className="h-4 w-4 mb-1" />
                                            <span className="text-xs">View</span>
                                        </button>
                                        <button
                                            onClick={() => navigate(`/events/${form.event_id}/feedback-stats`)}
                                            className="flex flex-col items-center justify-center p-2 rounded hover:bg-gray-50 text-gray-600"
                                            title="Analytics"
                                        >
                                            <BarChart3 className="h-4 w-4 mb-1" />
                                            <span className="text-xs">Stats</span>
                                        </button>
                                        <button
                                            onClick={() => navigate(`/events/${form.event_id}/feedback-builder`)}
                                            className="flex flex-col items-center justify-center p-2 rounded hover:bg-gray-50 text-gray-600"
                                            title="Edit"
                                        >
                                            <Pencil className="h-4 w-4 mb-1" />
                                            <span className="text-xs">Edit</span>
                                        </button>
                                        <button
                                            onClick={() => openShareModal(form)}
                                            className="flex flex-col items-center justify-center p-2 rounded hover:bg-gray-50 text-brand-600"
                                            title="Share"
                                        >
                                            <Share2 className="h-4 w-4 mb-1" />
                                            <span className="text-xs">Share</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Share Modal */}
            {shareModalForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
                        <button
                            onClick={closeShareModal}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="text-center mb-6">
                            <div className="bg-brand-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                                <QrCode className="h-6 w-6 text-brand-600" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Share Form</h2>
                            <p className="text-sm text-gray-500 mt-1">{shareModalForm.title}</p>
                        </div>

                        {/* QR Code */}
                        <div className="bg-gray-50 rounded-xl p-6 mb-6 flex justify-center">
                            {qrDataUrl ? (
                                <img loading="lazy" decoding="async" src={qrDataUrl} alt="QR Code" className="w-48 h-48" />
                            ) : (
                                <Loader2 className="h-12 w-12 animate-spin text-brand-600" />
                            )}
                        </div>

                        {/* Share Link */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Shareable Link</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={`https://clubsphere.in/f/${shareModalForm.id}`}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                                />
                                <Button
                                    onClick={() => copyToClipboard(shareModalForm.id)}
                                    variant="secondary"
                                    className="flex items-center gap-2"
                                >
                                    <Copy className="h-4 w-4" />
                                    {copied ? 'Copied!' : 'Copy'}
                                </Button>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <Button
                                onClick={downloadQRCode}
                                variant="secondary"
                                className="flex-1"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Download QR
                            </Button>
                            <Button
                                onClick={() => navigate(`/f/${shareModalForm.id}`)}
                                className="flex-1"
                            >
                                <Eye className="h-4 w-4 mr-2" />
                                Preview Form
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
