import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Loader2, Star, CheckCircle, AlertCircle } from 'lucide-react';

interface Question {
    id: string;
    type: 'rating' | 'text' | 'single_choice' | 'multiple_choice';
    label: string;
    required: boolean;
    options?: string[];
}

export const FeedbackFormPage = () => {
    const { id: eventId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState<any>(null);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm();

    useEffect(() => {
        if (eventId) fetchForm();
    }, [eventId]);

    const fetchForm = async () => {
        try {
            // Get the published form for this event
            const { data, error } = await supabase
                .from('feedback_forms')
                .select('*')
                .eq('event_id', eventId)
                .eq('is_published', true)
                .maybeSingle();

            if (error) throw error;
            if (!data) {
                setError('No active feedback form found for this event.');
            } else {
                setForm(data);
            }
        } catch (err) {
            console.error('Error fetching form:', err);
            setError('Failed to load feedback form.');
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: any) => {
        if (!form) return;
        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('feedback_responses')
                .insert({
                    form_id: form.id,
                    user_id: user?.id || null, // Allow anonymous if configured (but we usually require auth for tracking)
                    answers: data
                });

            if (error) throw error;
            setSubmitted(true);
        } catch (err) {
            console.error(error);
            alert("Failed to submit feedback.");
        } finally {
            setSubmitting(false);
        }
    };

    const renderField = (q: Question) => {
        switch (q.type) {
            case 'rating':
                return (
                    <div key={q.id} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            {q.label} {q.required && '*'}
                        </label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setValue(q.id, star)}
                                    className={`p-1 transition-colors ${watch(q.id) >= star ? 'text-yellow-400' : 'text-gray-200'}`}
                                >
                                    <Star className="h-8 w-8 fill-current" />
                                </button>
                            ))}
                        </div>
                        <input type="hidden" {...register(q.id, { required: q.required })} />
                        {errors[q.id] && <p className="text-red-500 text-xs">Required</p>}
                    </div>
                );
            case 'text':
                return (
                    <div key={q.id} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            {q.label} {q.required && '*'}
                        </label>
                        <textarea
                            {...register(q.id, { required: q.required })}
                            className="w-full border-gray-300 rounded-md shadow-sm p-3 focus:ring-brand-500 focus:border-brand-500"
                            rows={3}
                            placeholder="Type your answer here..."
                        />
                        {errors[q.id] && <p className="text-red-500 text-xs">Required</p>}
                    </div>
                );
            case 'single_choice':
                return (
                    <div key={q.id} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            {q.label} {q.required && '*'}
                        </label>
                        <select
                            {...register(q.id, { required: q.required })}
                            className="w-full border-gray-300 rounded-md shadow-sm p-3 focus:ring-brand-500 focus:border-brand-500"
                        >
                            <option value="">Select an option</option>
                            {q.options?.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                        {errors[q.id] && <p className="text-red-500 text-xs">Required</p>}
                    </div>
                );
            default:
                return null;
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
                <p className="text-gray-600 mb-8">Your feedback has been recorded.</p>
                <Button onClick={() => navigate(`/events/${eventId}`)} className="w-full">Back to Event</Button>
            </div>
        </div>
    );

    if (error || !form) return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Feedback Unavailable</h2>
            <p className="text-gray-600 mb-4">{error || "No loaded form."}</p>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl mx-auto bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-brand-600 px-6 py-8 text-white">
                    <h1 className="text-2xl font-bold">{form.title}</h1>
                    {form.description && <p className="mt-2 text-brand-100">{form.description}</p>}
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                    {(form.questions as Question[]).map(q => renderField(q))}

                    <div className="pt-4">
                        <Button type="submit" loading={submitting} className="w-full h-12 text-lg">
                            Submit Feedback
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
