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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [form, setForm] = useState<any>(null);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm();

    useEffect(() => {
        if (eventId) fetchForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eventId]);

    const fetchForm = async () => {
        try {
            // Get the published form for this event
            const { data, error } = await supabase
                .from('feedback_forms')
                .select('*')
                .eq('event_id', eventId)
                .eq('is_active', true)
                .maybeSingle();

            if (error) {
                console.error('Supabase error details:', error);
                throw error;
            }
            if (!data) {
                console.warn('No active feedback form found for event:', eventId);
                setError('No active feedback form found for this event.');
            } else {
                console.log('Form loaded successfully:', data);
                setForm(data);
            }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            console.error('Error fetching form:', err);
            console.error('Error message:', err?.message);
            console.error('Error details:', err?.details);
            setError('Failed to load feedback form.');
        } finally {
            setLoading(false);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onSubmit = async (data: any) => {
        if (!form) return;
        setSubmitting(true);
        try {
            console.log('=== FEEDBACK SUBMISSION START ===');
            console.log('Form:', form);
            console.log('User:', user);
            console.log('Raw form data:', data);

            const submissionData = {
                form_id: form.id,
                user_id: user?.id, // Restored: Sending user_id for accurate tracking
                responses: data
            };

            console.log('Submission payload:', JSON.stringify(submissionData, null, 2));

            const { data: responseData, error } = await supabase
                .from('feedback_responses')
                .insert(submissionData)
                .select();

            console.log('Supabase response:', { data: responseData, error });

            if (error) {
                // Handle duplicate submission (Unique Constraint Violation)
                if (error.code === '23505') {
                    console.warn('Duplicate submission detected');
                    alert("You have already submitted feedback for this event. You cannot submit again.");
                    setSubmitted(true); // Treat as success to stop user from trying again
                    return;
                }

                console.error('=== SUBMISSION ERROR ===');
                console.error('Full error object:', error);
                console.error('Error code:', error.code);
                console.error('Error message:', error.message);
                console.error('Error details:', error.details);
                console.error('Error hint:', error.hint);
                throw error;
            }

            console.log('=== SUBMISSION SUCCESS ===');
            console.log('Response data:', responseData);
            setSubmitted(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            // ... existing catch block ...
            if (err?.code !== '23505') { // Don't alert generic error if we already handled duplicate above
                console.error('=== CATCH BLOCK ERROR ===');
                console.error('Error:', err);
                alert(`Failed to submit feedback: ${err?.message || JSON.stringify(err)}`);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const renderField = (q: Question) => {
        switch (q.type) {
            case 'rating':
                return (
                    <div key={q.id} className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">
                            {q.label} {q.required && <span className="text-red-500">*</span>}
                        </label>
                        <div className="flex gap-1 sm:gap-2 justify-center sm:justify-start">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setValue(q.id, star)}
                                    className={`p-1 sm:p-2 transition-all hover:scale-110 ${watch(q.id) >= star ? 'text-yellow-400' : 'text-gray-300 hover:text-gray-400'}`}
                                >
                                    <Star className="h-8 w-8 sm:h-10 sm:w-10 fill-current" />
                                </button>
                            ))}
                        </div>
                        <input type="hidden" {...register(q.id, { required: q.required })} />
                        {errors[q.id] && <p className="text-red-500 text-xs mt-1">This field is required</p>}
                    </div>
                );
            case 'text':
                return (
                    <div key={q.id} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            {q.label} {q.required && <span className="text-red-500">*</span>}
                        </label>
                        <textarea
                            {...register(q.id, { required: q.required })}
                            className="w-full border border-gray-300 rounded-lg shadow-sm p-3 sm:p-4 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm sm:text-base resize-none"
                            rows={4}
                            placeholder="Type your answer here..."
                        />
                        {errors[q.id] && <p className="text-red-500 text-xs mt-1">This field is required</p>}
                    </div>
                );
            case 'single_choice':
                return (
                    <div key={q.id} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            {q.label} {q.required && <span className="text-red-500">*</span>}
                        </label>
                        <select
                            {...register(q.id, { required: q.required })}
                            className="w-full border border-gray-300 rounded-lg shadow-sm p-3 sm:p-4 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm sm:text-base bg-white"
                        >
                            <option value="">Select an option</option>
                            {q.options?.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                        {errors[q.id] && <p className="text-red-500 text-xs mt-1">This field is required</p>}
                    </div>
                );
            default:
                return null;
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-brand-600" /></div>;

    if (submitted) return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
            <div className="bg-white p-6 sm:p-8 rounded-xl sm:rounded-2xl shadow-xl text-center max-w-md w-full border border-green-100">
                <div className="h-14 w-14 sm:h-16 sm:w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <CheckCircle className="h-7 w-7 sm:h-8 sm:w-8 text-green-600" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
                <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">Your feedback has been recorded.</p>
                <Button onClick={() => navigate(`/events/${eventId}`)} className="w-full h-11 sm:h-12">Back to Event</Button>
            </div>
        </div>
    );

    if (error || !form) return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mb-3 sm:mb-4" />
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 text-center">Feedback Unavailable</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4 text-center max-w-md">{error || "No loaded form."}</p>
            <Button onClick={() => navigate(-1)} className="h-11 sm:h-12 px-6">Go Back</Button>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 py-6 sm:py-12 px-3 sm:px-4 lg:px-8">
            <div className="max-w-2xl mx-auto bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-brand-600 px-4 sm:px-6 py-6 sm:py-8 text-white">
                    <h1 className="text-xl sm:text-2xl font-bold leading-tight">{form.title}</h1>
                    {form.description && <p className="mt-2 text-sm sm:text-base text-brand-100">{form.description}</p>}
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-5 sm:space-y-6">
                    {(form.questions as Question[]).map(q => renderField(q))}

                    <div className="pt-4 sm:pt-6 border-t border-gray-200">
                        <Button
                            type="submit"
                            loading={submitting}
                            className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold"
                        >
                            Submit Feedback
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
