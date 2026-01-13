import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { supabase } from '../lib/supabase';
import { generateFormSchema } from '../services/aiService';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import {
    Loader2,
    Plus,
    Trash2,
    Sparkles,
    Save,
    ArrowLeft,
    GripVertical
} from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface FormValues {
    title: string;
    description: string;
    questions: {
        id: string;
        type: string;
        label: string;
        required: boolean;
        options?: string[]; // For choice questions
    }[];
}

const SortableQuestion = ({ index, field, remove, register, control, watch }: any) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: field.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const type = watch(`questions.${index}.type`);

    return (
        <div ref={setNodeRef} style={style} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-4">
            <div className="flex justify-between items-start mb-4">
                <div {...attributes} {...listeners} className="cursor-grab p-1 hover:bg-gray-100 rounded text-gray-400">
                    <GripVertical className="h-5 w-5" />
                </div>
                <button type="button" onClick={() => remove(index)} className="text-red-500 p-1 hover:bg-red-50 rounded">
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-xs font-medium text-gray-700 uppercase">Question Label</label>
                    <input
                        {...register(`questions.${index}.label`, { required: true })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2 border"
                        placeholder="e.g. What is your name?"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700 uppercase">Type</label>
                    <select
                        {...register(`questions.${index}.type`)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2 border"
                    >
                        <option value="text">Short Text</option>
                        <option value="textarea">Long Text</option>
                        <option value="rating">Rating (1-5)</option>
                        <option value="single_choice">Single Choice</option>
                        <option value="multiple_choice">Multiple Choice</option>
                        <option value="date">Date</option>
                        <option value="email">Email</option>
                    </select>
                </div>
            </div>

            <div className="flex items-center mb-4">
                <input
                    type="checkbox"
                    {...register(`questions.${index}.required`)}
                    className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">Required Question</label>
            </div>

            {/* Options for Choice Types */}
            {(type === 'single_choice' || type === 'multiple_choice') && (
                <div className="bg-gray-50 p-4 rounded-md">
                    <label className="block text-xs font-medium text-gray-700 uppercase mb-2">Options (Comma separated)</label>
                    <Controller
                        name={`questions.${index}.options`}
                        control={control}
                        defaultValue={[]}
                        render={({ field: { value, onChange } }) => (
                            <input
                                value={Array.isArray(value) ? value.join(', ') : value}
                                onChange={(e) => onChange(e.target.value.split(',').map(s => s.trim()))}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2 border"
                                placeholder="Option 1, Option 2, Option 3"
                            />
                        )}
                    />
                </div>
            )}
        </div>
    );
};

export const FormBuilderPage = () => {
    const { id: formId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [generating, setGenerating] = useState(false);
    const isNew = !formId || formId === 'new';
    const [loading, setLoading] = useState(!isNew);
    const [prompt, setPrompt] = useState('');
    const [isPublished, setIsPublished] = useState(false);

    const { register, control, handleSubmit, reset, watch, setValue } = useForm<FormValues>({
        defaultValues: {
            title: '',
            description: '',
            questions: []
        }
    });

    const { fields, append, remove, move } = useFieldArray({
        control,
        name: "questions"
    });

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (!isNew && formId) {
            fetchForm();
        }
    }, [formId]);

    const fetchForm = async () => {
        try {
            const { data, error } = await supabase
                .from('forms')
                .select('*')
                .eq('id', formId)
                .single();
            if (error) throw error;
            if (data) {
                reset({
                    title: data.title,
                    description: data.description,
                    questions: data.questions
                });
                setIsPublished(data.is_published || false);
            }
        } catch (error) {
            console.error(error);
            navigate('/forms');
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = fields.findIndex((item) => item.id === active.id);
            const newIndex = fields.findIndex((item) => item.id === over.id);
            move(oldIndex, newIndex);
        }
    };

    const handleAIGenerate = async () => {
        if (!prompt) return;
        setGenerating(true);
        try {
            const { title, description, questions } = await generateFormSchema(prompt);

            const formattedQuestions = questions.map((q: any) => ({
                ...q,
                id: crypto.randomUUID(),
                options: q.options || (q.type.includes('choice') ? ['Yes', 'No'] : [])
            }));

            setValue('title', title);
            setValue('description', description);
            setValue('questions', formattedQuestions);
        } catch (error) {
            console.error(error);
            toast.error("AI Generation failed.");
        } finally {
            setGenerating(false);
        }
    };

    const onSubmit = async (data: FormValues) => {
        try {
            const payload = {
                title: data.title,
                description: data.description,
                questions: data.questions,
                updated_at: new Date().toISOString()
            };

            let error;
            if (isNew) {
                const { error: insertError } = await supabase
                    .from('forms')
                    .insert([{ ...payload, is_published: isPublished }]);
                error = insertError;
            } else {
                const { error: updateError } = await supabase
                    .from('forms')
                    .update({ ...payload, is_published: isPublished })
                    .eq('id', formId);
                error = updateError;
            }

            if (error) throw error;
            toast.success("Form Saved Successfully!");
            navigate('/forms');
        } catch (error) {
            console.error(error);
            toast.error("Failed to save form.");
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-brand-600" /></div>;

    return (
        <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <Button variant="ghost" onClick={() => navigate('/forms')} className="text-sm sm:text-base mb-4 -ml-4 hover:bg-transparent hover:text-brand-600 p-0 pl-4">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        <span className="hidden xs:inline">Back to </span>Forms
                    </Button>
                    <PageHeader
                        title={isNew ? 'Create New Form' : 'Edit Form'}
                        description={isNew ? 'Design a new form to collect responses.' : 'Edit your existing form.'}
                    />
                </div>

                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg sm:rounded-xl p-4 sm:p-6 text-white mb-6 sm:mb-8 shadow-lg">
                    <div className="flex items-start gap-3 sm:gap-4">
                        <div className="bg-white/20 p-2 sm:p-3 rounded-lg backdrop-blur-sm flex-shrink-0">
                            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-base sm:text-lg font-bold mb-1 sm:mb-2">Magic Form Creator</h2>
                            <p className="text-purple-100 text-xs sm:text-sm mb-3 sm:mb-4">Describe the form you want, and AI will build it for you.</p>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                    type="text"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="e.g. Volunteer registration..."
                                    className="flex-1 bg-white/10 border border-white/20 rounded-md px-3 sm:px-4 py-2 text-sm sm:text-base text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                                />
                                <Button
                                    onClick={handleAIGenerate}
                                    disabled={generating || !prompt}
                                    className="bg-white text-purple-600 hover:bg-purple-50 border-none w-full sm:w-auto"
                                >
                                    {generating ? <Loader2 className="animate-spin" /> : 'Generate'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    {/* General Info */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                        <h3 className="text-lg font-bold text-gray-900 border-b pb-2">General Information</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Form Title</label>
                            <input
                                {...register('title', { required: true })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-lg font-semibold p-2 border"
                                placeholder="Untitled Form"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea
                                {...register('description')}
                                rows={2}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2 border"
                                placeholder="Brief description of this form"
                            />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <label className="block text-sm font-medium text-gray-900">Publish Status</label>
                                <p className="text-xs text-gray-500">
                                    {isPublished ? 'Form is live and accepting responses' : 'Form is in draft mode'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsPublished(!isPublished)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isPublished ? 'bg-green-600' : 'bg-gray-300'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPublished ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>

                    {/* Questions Builder */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900">Questions</h3>
                            <Button type="button" onClick={() => append({ id: crypto.randomUUID(), type: 'text', label: '', required: false })} variant="outline" size="sm">
                                <Plus className="h-4 w-4 mr-2" /> Add Question
                            </Button>
                        </div>

                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={fields.map(f => f.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {fields.map((field, index) => (
                                    <SortableQuestion
                                        key={field.id}
                                        index={index}
                                        field={field}
                                        remove={remove}
                                        register={register}
                                        control={control}
                                        watch={watch}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    </div>

                    <div className="flex justify-end pt-6">
                        <Button type="submit" size="lg" className="px-8">
                            <Save className="h-5 w-5 mr-2" />
                            Save Form
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
