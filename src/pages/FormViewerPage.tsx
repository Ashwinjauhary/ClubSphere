import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Loader2, CheckCircle, AlertCircle, Upload, File as FileIcon, X } from 'lucide-react';
import { uploadFile } from '../services/storageService';
import { toast } from 'sonner';

const THEME_STYLES: Record<string, { bg: string, border: string, button: string, light: string }> = {
    'classic-blue': { bg: 'bg-blue-600', border: 'border-blue-800', button: 'bg-blue-600 hover:bg-blue-700', light: 'bg-blue-50' },
    'modern-purple': { bg: 'bg-purple-600', border: 'border-purple-800', button: 'bg-purple-600 hover:bg-purple-700', light: 'bg-purple-50' },
    'fresh-green': { bg: 'bg-emerald-600', border: 'border-emerald-800', button: 'bg-emerald-600 hover:bg-emerald-700', light: 'bg-emerald-50' },
    'warm-orange': { bg: 'bg-orange-500', border: 'border-orange-700', button: 'bg-orange-500 hover:bg-orange-600', light: 'bg-orange-50' },
    'professional-gray': { bg: 'bg-gray-700', border: 'border-gray-900', button: 'bg-gray-700 hover:bg-gray-800', light: 'bg-gray-100' },
    'elegant-pink': { bg: 'bg-pink-600', border: 'border-pink-800', button: 'bg-pink-600 hover:bg-pink-700', light: 'bg-pink-50' },
};

export interface FormQuestion {
    id: string;
    type: string;
    title: string;
    label?: string;
    description?: string;
    required?: boolean;
    options?: string[];
}

export interface FormSchema {
    id: string;
    title: string;
    header_image_url?: string;
    description?: string;
    theme?: string;
    settings?: {
        limit_one_response_per_user?: boolean;
        accepting_responses?: boolean;
        thank_you_message?: string;
    };
    questions: FormQuestion[];
}

export const FormViewerPage = () => {
    const { id: formId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [form, setForm] = useState<FormSchema | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [hasResponded, setHasResponded] = useState(false);

    const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm();

    // Helper to normalize options - ensures they're always strings for rendering
    const normalizeOption = (opt: any): string => {
        if (typeof opt === 'string') return opt;
        if (typeof opt === 'object' && opt !== null) {
            const o = opt as any; return (o.label as string) || (o.value as string) || String(opt);
        }
        return String(opt);
    };

    useEffect(() => {
        if (formId) fetchForm();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formId, user]);

    const fetchForm = async () => {
        try {
            // First try to fetch form by ID (RLS handles visibility - creators can see their own drafts)
            let { data, error } = await supabase
                .from('forms')
                .select('*')
                .eq('id', formId)
                .maybeSingle();

            if (error) throw error;
            if (!data) {
                setError('Form not found or not available.');
                return;
            }

            // If form is not published and user is not the creator, block access
            if (!data.is_published && (!user || data.created_by !== user.id)) {
                setError('This form is not yet published.');
                return;
            }

            // Normalize options in questions to fix any corrupted data
            const normalizedForm = {
                ...data,
                questions: data.questions.map((q: FormQuestion) => ({
                    ...q,
                    options: q.options ? q.options.map((opt: any) => normalizeOption(opt)) : q.options
                }))
            };

            setForm(normalizedForm);

            // Check settings
            if (data.settings?.limit_one_response_per_user && user) {
                const { count } = await supabase
                    .from('form_responses')
                    .select('*', { count: 'exact', head: true })
                    .eq('form_id', formId)
                    .eq('user_id', user.id);

                if (count && count > 0) {
                    setHasResponded(true);
                }
            } else if (data.settings?.limit_one_response_per_user && !user) {
                // Determine if we should block or just verify on submit (better to warn early)
                // For now, allow viewing but they will need to login? Or maybe redirect to login?
                // Let's create a visual warning.
            }

        } catch (error) {
            console.error(error);
            setError('Failed to load form.');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (file: File) => {
        try {
            const url = await uploadFile(file, 'form-uploads', `responses/${formId}`);
            return url;
        } catch (e) {
            console.error(e);
            throw new Error('Upload failed');
        }
    };

    const onSubmit = async (formData: any) => {
        if (!form) return;

        // Final check for log in requirements
        if (form.settings?.limit_one_response_per_user && !user) {
            toast.error("You must be logged in to submit this form.");
            navigate('/login?redirect=/f/' + formId);
            return;
        }

        setSubmitting(true);
        try {
            // Process file uploads if any (logic handled in components or pre-process here?)
            // Actually, for file inputs handled via Controller/register, we might get FileList.
            // We need to upload them one by one. But `uploadFile` is async.
            // Let's assume the Controller handled upload OR we handle it here.
            // Better UX: Upload immediately on selection, or upload on submit.
            // Start simple: Upload on visual selection (below) returns URL.
            // So formData should already contain URLs if we separate the component.
            // BUT standard file input gives FileList.
            // Let's iterate formData and upload files.

            const processedData = { ...formData };

            // This loop is a bit naive, ideally we know which fields are files.
            // But we can check for File objects.
            for (const key in processedData) {
                if (processedData[key] instanceof FileList && processedData[key].length > 0) {
                    const file = processedData[key][0];
                    const url = await handleFileUpload(file);
                    processedData[key] = url;
                } else if (processedData[key] instanceof File) {
                    const url = await handleFileUpload(processedData[key]);
                    processedData[key] = url;
                }
            }

            const { error } = await supabase
                .from('form_responses')
                .insert({
                    form_id: form.id,
                    user_id: user?.id || null,
                    answers: processedData
                });

            if (error) throw error;
            setSubmitted(true);
        } catch (err) {
            console.error(err);
            toast.error("Submission failed. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-brand-600" /></div>;

    if (submitted) return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
            <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full border border-green-100">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
                <p className="text-gray-600 mb-8">{(form?.settings?.thank_you_message as string) || "Your response has been recorded."}</p>
                <Button onClick={() => navigate(user ? '/dashboard' : '/')} className="w-full">Return Home</Button>
            </div>
        </div>
    );

    if (hasResponded) return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
            <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
                <AlertCircle className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Already Responded</h2>
                <p className="text-gray-600 mb-6">You have already submitted a response to this form.</p>
                <Button onClick={() => navigate('/dashboard')} variant="outline">Back to Dashboard</Button>
            </div>
        </div>
    );

    if (error || !form) return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Form Unavailable</h2>
            <p className="text-gray-600 mb-4">{error}</p>
        </div>
    );

    const theme = THEME_STYLES[form.theme || 'classic-blue'] || THEME_STYLES['classic-blue'];

    return (
        <div className={`min-h-screen ${theme.light} py-12 px-4 sm:px-6 lg:px-8 pb-24`}>
            {form.header_image_url && (
                <div className="max-w-xl mx-auto mb-6 rounded-xl overflow-hidden shadow-lg">
                    <img src={form.header_image_url} alt="Header" className="w-full h-48 object-cover" />
                </div>
            )}

            <div className="max-w-xl mx-auto bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className={`${theme.bg} px-6 py-8 text-white border-t-8 ${theme.border}`}>
                    <h1 className="text-3xl font-bold">{form.title}</h1>
                    {form.description && <p className="mt-2 text-white/90 whitespace-pre-line">{form.description}</p>}
                    {Boolean(form?.settings?.limit_one_response_per_user) && !user && (
                        <div className="mt-4 p-3 bg-white/20 rounded-md text-sm backdrop-blur-sm">
                            ⚠️ You must be logged in to submit this form. <a href={`/login?redirect=/f/${formId}`} className="underline font-bold hover:text-white">Log in here</a>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
                    {form.questions.map((q: FormQuestion) => (
                        <div key={q.id} className="space-y-2">
                            {q.type !== 'description' && (
                                <label className="block text-base font-medium text-gray-900">
                                    {q.label} {q.required && <span className="text-red-500">*</span>}
                                </label>
                            )}

                            {q.type === 'description' && (
                                <div className="text-gray-700 whitespace-pre-line prose">
                                    {q.description}
                                </div>
                            )}

                            {q.type === 'image' && (
                                <div className="rounded-lg overflow-hidden border border-gray-200">
                                    {/* Placeholder for static image question type logic */}
                                    {q.description && <img src={q.description} alt="Form Image" className="w-full h-auto" />}
                                </div>
                            )}

                            {(q.type === 'text' || q.type === 'email') && (
                                <input {...register(q.id, { required: q.required })} type={q.type} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-3 border" />
                            )}

                            {q.type === 'textarea' && (
                                <textarea {...register(q.id, { required: q.required })} rows={3} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-3 border" />
                            )}

                            {q.type === 'dropdown' && (
                                <select {...register(q.id, { required: q.required })} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-3 border">
                                    <option value="">Select an option</option>
                                    {(q.options || []).map((opt: any, idx: number) => {
                                        const optValue = normalizeOption(opt);
                                        return <option key={`${q.id}-opt-${idx}`} value={optValue}>{optValue}</option>;
                                    })}
                                </select>
                            )}

                            {q.type === 'date' && (
                                <input {...register(q.id, { required: q.required })} type="date" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-3 border" />
                            )}

                            {q.type === 'rating' && (
                                <div className="flex gap-4">
                                    {[1, 2, 3, 4, 5].map((val) => (
                                        <label key={val} className="flex flex-col items-center cursor-pointer">
                                            <input
                                                type="radio"
                                                value={val}
                                                {...register(q.id, { required: q.required })}
                                                className={`h-5 w-5 focus:ring-brand-500 border-gray-300 ${theme.bg.replace('bg-', 'text-')}`}
                                            />
                                            <span className="text-xs mt-1 text-gray-500">{val}</span>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {q.type === 'single_choice' && (
                                <div className="space-y-2">
                                    {(q.options || []).map((opt: any, idx: number) => {
                                        const optValue = normalizeOption(opt);
                                        return (
                                            <label key={`${q.id}-opt-${idx}`} className="flex items-center space-x-3">
                                                <input
                                                    type="radio"
                                                    value={optValue}
                                                    {...register(q.id, { required: q.required })}
                                                    className={`h-4 w-4 focus:ring-brand-500 border-gray-300 ${theme.bg.replace('bg-', 'text-')}`}
                                                />
                                                <span className="text-gray-700">{optValue}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}

                            {(q.type === 'multiple_choice' || q.type === 'checkboxes') && (
                                <div className="space-y-2">
                                    {(q.options || []).map((opt: any, idx: number) => {
                                        const optValue = normalizeOption(opt);
                                        return (
                                            <label key={`${q.id}-opt-${idx}`} className="flex items-center space-x-3">
                                                <input
                                                    type="checkbox"
                                                    value={optValue}
                                                    {...register(q.id, { required: q.required })}
                                                    className={`h-4 w-4 focus:ring-brand-500 border-gray-300 rounded ${theme.bg.replace('bg-', 'text-')}`}
                                                />
                                                <span className="text-gray-700">{optValue}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}

                            {q.type === 'file_upload' && (
                                <Controller
                                    name={q.id}
                                    control={control}
                                    rules={{ required: q.required }}
                                    render={({ field: { onChange, value } }) => (
                                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md relative hover:bg-gray-50">
                                            {!value ? (
                                                <div className="space-y-1 text-center">
                                                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                                    <div className="flex text-sm text-gray-600 justify-center">
                                                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-brand-600 hover:text-brand-500 focus-within:outline-none">
                                                            <span>Upload a file</span>
                                                            <input
                                                                type="file"
                                                                className="sr-only"
                                                                onChange={(e) => {
                                                                    if (e.target.files?.[0]) {
                                                                        // Store the File object to be uploaded on submit
                                                                        onChange(e.target.files[0]);
                                                                    }
                                                                }}
                                                            />
                                                        </label>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-sm text-green-600">
                                                    <FileIcon className="h-5 w-5" />
                                                    <span>{value.name}</span>
                                                    <button type="button" onClick={() => onChange(null)} className="text-red-500 ml-2"><X className="h-4 w-4" /></button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                />
                            )}

                            {errors[q.id] && <p className="text-red-500 text-xs">This field is required</p>}
                        </div>
                    ))}

                    <div className="pt-6">
                        <Button
                            type="submit"
                            loading={submitting || isSubmitting}
                            disabled={!form?.settings?.accepting_responses || (Boolean(form?.settings?.limit_one_response_per_user) && !user)}
                            className={`w-full h-12 text-lg ${theme.button}`}
                        >
                            {!form.settings?.accepting_responses ? 'Not Accepting Responses' : 'Submit'}
                        </Button>
                    </div>
                </form>
            </div>
            <div className="text-center mt-8 text-gray-400 text-sm">
                Powered by ClubSphere AI Forms
            </div>
        </div>
    );
};

