import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { supabase } from '../lib/supabase';
import { generateFeedbackForm } from '../services/aiService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Plus, Trash2, Sparkles, Save, ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const questionSchema = z.object({
    id: z.string(),
    type: z.enum(['rating', 'text', 'single_choice', 'multiple_choice']),
    label: z.string().min(3, "Question label is required"),
    required: z.boolean(),
    options: z.array(z.string()).optional()
});

const formSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters"),
    description: z.string().optional(),
    questions: z.array(questionSchema).min(1, "At least one question is required")
});

type FormValues = z.infer<typeof formSchema>;

export const FeedbackFormBuilderPage = () => {
    const { eventId } = useParams<{ eventId: string }>();
    const navigate = useNavigate();
    const [generating, setGenerating] = useState(false);
    const [eventTitle, setEventTitle] = useState('');

    // Fetch event details for AI context
    useEffect(() => {
        if (!eventId) return;
        supabase.from('events').select('title').eq('id', eventId).single()
            .then(({ data }) => { if (data) setEventTitle(data.title); });
    }, [eventId]);

    const { register, control, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: 'Event Feedback',
            description: 'Please search your thoughts on the event.',
            questions: [
                { id: crypto.randomUUID(), type: 'rating', label: 'Overall Experience', required: true }
            ]
        }
    });

    const { fields, append, remove, replace } = useFieldArray({
        control,
        name: "questions"
    });

    const handleAIGenerate = async () => {
        if (!eventTitle) return;
        setGenerating(true);
        try {
            // Mock topic for now, ideally user inputs it
            const questions = await generateFeedbackForm(eventTitle, 'Event', 'General');
            // Ensure IDs are unique
            const formattedQuestions = questions.map((q: any) => ({ ...q, id: crypto.randomUUID() }));
            replace(formattedQuestions);
        } catch (error) {
            console.error(error);
            alert("AI Generation failed. Please try again.");
        } finally {
            setGenerating(false);
        }
    };

    const onSubmit = async (data: FormValues) => {
        try {
            const { error } = await supabase
                .from('forms')
                .insert({
                    event_id: eventId,
                    title: data.title,
                    description: data.description,
                    questions: data.questions,
                    type: 'feedback',
                    is_published: true,
                    created_by: (await supabase.auth.getUser()).data.user?.id
                });

            if (error) throw error;
            alert("Feedback Form Created Successfully!");
            navigate(`/events/${eventId}`);
        } catch (error) {
            console.error('Error saving form:', error);
            alert('Failed to save form.');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 p-4">
            <div className="flex items-center justify-between">
                <div>
                    <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2 p-0 h-auto hover:bg-transparent text-gray-500">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                    <h1 className="text-2xl font-bold text-gray-900">Design Feedback Form</h1>
                    <p className="text-gray-500">Create a custom surveys for <span className="font-semibold">{eventTitle}</span></p>
                </div>
                <Button
                    onClick={handleAIGenerate}
                    disabled={generating}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {generating ? 'Generating...' : 'Auto-Generate Form with AI'}
                </Button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <Input label="Form Title" {...register('title')} error={errors.title?.message} />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            className="block w-full rounded-md border border-gray-300 p-2 text-sm"
                            rows={2}
                            {...register('description')}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    {fields.map((field, index) => (
                        <div key={field.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative group">
                            <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button type="button" onClick={() => remove(index)} className="text-red-500 hover:text-red-700">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                                <div className="md:col-span-1 flex items-center justify-center pt-3">
                                    <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2 py-1 rounded">Q{index + 1}</span>
                                </div>
                                <div className="md:col-span-8 space-y-3">
                                    <Input
                                        placeholder="Question Text"
                                        {...register(`questions.${index}.label`)}
                                        error={errors.questions?.[index]?.label?.message}
                                    />

                                    {/* Options for Choice Types */}
                                    {(watch(`questions.${index}.type`) === 'single_choice' || watch(`questions.${index}.type`) === 'multiple_choice') && (
                                        <div className="pl-4 border-l-2 border-gray-100">
                                            <p className="text-xs text-gray-500 mb-2">Options (comma separated)</p>
                                            <input
                                                className="block w-full text-sm border-gray-300 rounded-md"
                                                placeholder="Yes, No, Maybe"
                                                onChange={(e) => {
                                                    const opts = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                                    setValue(`questions.${index}.options`, opts);
                                                }}
                                                defaultValue={field.options?.join(', ')}
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className="md:col-span-3 space-y-3">
                                    <select
                                        {...register(`questions.${index}.type`)}
                                        className="block w-full rounded-md border border-gray-300 p-2 text-sm"
                                    >
                                        <option value="rating">1-5 Rating</option>
                                        <option value="text">Text Answer</option>
                                        <option value="single_choice">Single Choice</option>
                                    </select>
                                    <label className="flex items-center space-x-2 text-sm text-gray-600">
                                        <input type="checkbox" {...register(`questions.${index}.required`)} className="rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
                                        <span>Required</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-between pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => append({ id: crypto.randomUUID(), type: 'text', label: '', required: false })}
                    >
                        <Plus className="h-4 w-4 mr-2" /> Add Question
                    </Button>
                    <Button type="submit" loading={isSubmitting}>
                        <Save className="h-4 w-4 mr-2" /> Save Form
                    </Button>
                </div>
            </form>
        </div>
    );
};
