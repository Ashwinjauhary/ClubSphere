import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export const FormViewerPage = () => {
    const { id: formId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [form, setForm] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const { register, handleSubmit, formState: { errors } } = useForm();

    useEffect(() => {
        if (formId) fetchForm();
    }, [formId]);

    const fetchForm = async () => {
        try {
            const { data, error } = await supabase
                .from('forms')
                .select('*')
                .eq('id', formId)
                .eq('is_published', true)
                .maybeSingle();

            if (error) throw error;
            if (!data) setError('Form invalid or not published.');
            else setForm(data);
        } catch (error) {
            console.error(error);
            setError('Failed to load form.');
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: any) => {
        if (!form) return;
        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('form_responses')
                .insert({
                    form_id: form.id,
                    user_id: user?.id || null,
                    answers: data
                });

            if (error) throw error;
            setSubmitted(true);
        } catch (err) {
            console.error(err);
            alert("Submission failed. Please try again.");
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
                <p className="text-gray-600 mb-8">Your response has been recorded.</p>
                <Button onClick={() => navigate(user ? '/dashboard' : '/')} className="w-full">Return Home</Button>
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

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl mx-auto bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-brand-600 px-6 py-8 text-white border-t-8 border-brand-800">
                    <h1 className="text-3xl font-bold">{form.title}</h1>
                    {form.description && <p className="mt-2 text-brand-100 whitespace-pre-line">{form.description}</p>}
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
                    {form.questions.map((q: any) => (
                        <div key={q.id} className="space-y-2">
                            <label className="block text-base font-medium text-gray-900">
                                {q.label} {q.required && <span className="text-red-500">*</span>}
                            </label>

                            {q.type === 'text' && (
                                <input {...register(q.id, { required: q.required })} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-3 border" />
                            )}

                            {q.type === 'textarea' && (
                                <textarea {...register(q.id, { required: q.required })} rows={3} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-3 border" />
                            )}

                            {q.type === 'rating' && (
                                <div className="flex gap-4">
                                    {[1, 2, 3, 4, 5].map((val) => (
                                        <label key={val} className="flex flex-col items-center cursor-pointer">
                                            <input
                                                type="radio"
                                                value={val}
                                                {...register(q.id, { required: q.required })}
                                                className="h-5 w-5 text-brand-600 focus:ring-brand-500 border-gray-300"
                                            />
                                            <span className="text-xs mt-1 text-gray-500">{val}</span>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {q.type === 'single_choice' && (
                                <div className="space-y-2">
                                    {(q.options || []).map((opt: string) => (
                                        <label key={opt} className="flex items-center space-x-3">
                                            <input
                                                type="radio"
                                                value={opt}
                                                {...register(q.id, { required: q.required })}
                                                className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300"
                                            />
                                            <span className="text-gray-700">{opt}</span>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {q.type === 'multiple_choice' && (
                                <div className="space-y-2">
                                    {(q.options || []).map((opt: string) => (
                                        <label key={opt} className="flex items-center space-x-3">
                                            <input
                                                type="checkbox"
                                                value={opt}
                                                {...register(q.id, { required: q.required })}
                                                className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                                            />
                                            <span className="text-gray-700">{opt}</span>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {/* Date/Email support can be added similarly */}

                            {errors[q.id] && <p className="text-red-500 text-xs">This field is required</p>}
                        </div>
                    ))}

                    <div className="pt-6">
                        <Button type="submit" loading={submitting} className="w-full h-12 text-lg">
                            Submit
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
