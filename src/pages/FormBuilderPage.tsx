import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useForm, useFieldArray } from 'react-hook-form';
import { supabase } from '../lib/supabase';
import { generateFormSchema } from '../services/aiService';
import { Button } from '../components/ui/Button';
import {
    Loader2,
    Plus,
    Save,
    ArrowLeft
} from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { SortableQuestion } from '../components/forms/SortableQuestion';
import { SettingsTab } from '../components/forms/SettingsTab';
import { Settings, FileText, Eye } from 'lucide-react';

interface FormValues {
    title: string;
    description: string;
    header_image_url?: string;
    theme: string;
    settings: {
        limit_one_response_per_user: boolean;
        response_limit?: number | null;
        accepting_responses: boolean;
        thank_you_message: string;
    };
    questions: {
        id: string;
        type: string;
        label: string;
        required: boolean;
        options?: string[]; // For choice questions
        description?: string; // For section headers or extra info
        accept_file_types?: string[]; // For file upload
    }[];
}

export const FormBuilderPage = () => {
    const { id: formId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [generating, setGenerating] = useState(false);
    const isNew = !formId || formId === 'new';
    const [loading, setLoading] = useState(!isNew);
    const [prompt, setPrompt] = useState('');
    const [isPublished, setIsPublished] = useState(false);
    const [activeTab, setActiveTab] = useState<'questions' | 'settings'>('questions');

    const { register, control, handleSubmit, reset, watch, setValue } = useForm<FormValues>({
        defaultValues: {
            title: '',
            description: '',
            header_image_url: '',
            theme: 'classic-blue',
            settings: {
                limit_one_response_per_user: false,
                response_limit: null,
                accepting_responses: true,
                thank_you_message: 'Thank you for your submission!'
            },
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
                    questions: data.questions,
                    theme: data.theme || 'classic-blue',
                    // @ts-ignore - Handle legacy data gracefully
                    settings: data.settings || {
                        limit_one_response_per_user: false,
                        accepting_responses: true,
                    }
                });
                setIsPublished(data.is_published || false);
                if (data.header_image_url) setValue('header_image_url', data.header_image_url);
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
            const { title, description, questions, theme, settings, isFallback } = await generateFormSchema(prompt);

            const formattedQuestions = questions.map((q: any) => ({
                ...q,
                id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36), // Safe ID generator
                options: q.options || (q.type.includes('choice') || q.type === 'dropdown' ? ['Yes', 'No'] : [])
            }));

            setValue('title', title);
            setValue('description', description);
            setValue('questions', formattedQuestions);
            if (theme) setValue('theme', theme);
            if (settings) setValue('settings', settings);

            if (isFallback) {
                toast("AI Busy: Smart Fallback Active", { icon: "🧠" });
            } else {
                toast.success("Form generated by AI!");
            }
        } catch (error) {
            console.error(error);
            toast.error("AI Generation failed.");
        } finally {
            setGenerating(false);
        }
    };

    // ... onSubmit ...
    const onSubmit = async (data: FormValues) => {
        try {
            const payload = {
                title: data.title,
                description: data.description,
                questions: data.questions,
                theme: data.theme,
                header_image_url: data.header_image_url,
                settings: data.settings,
                updated_at: new Date().toISOString()
            };
            // ... rest of submit logic
            let error;
            if (isNew) {
                const { error: insertError } = await supabase.from('forms').insert([{ ...payload, is_published: isPublished }]);
                error = insertError;
            } else {
                const { error: updateError } = await supabase.from('forms').update({ ...payload, is_published: isPublished }).eq('id', formId);
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
    // ... 

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-brand-600" /></div>;

    return (
        <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
                    <Button variant="ghost" onClick={() => navigate('/forms')} className="p-0 hover:bg-transparent hover:text-brand-600 self-start">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        {/* Tab Switcher */}
                        <div className="bg-white p-1 rounded-lg border border-gray-200 flex w-full sm:w-auto">
                            <button
                                onClick={() => setActiveTab('questions')}
                                className={`flex-1 sm:flex-none justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'questions' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                <FileText className="h-4 w-4" /> Questions
                            </button>
                            <button
                                onClick={() => setActiveTab('settings')}
                                className={`flex-1 sm:flex-none justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'settings' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                <Settings className="h-4 w-4" /> Settings
                            </button>
                        </div>
                        <Button variant="outline" onClick={() => window.open(`/forms/public/${formId}`, '_blank')} className="w-full sm:w-auto mt-2 sm:mt-0">
                            <Eye className="h-4 w-4 mr-2" /> Preview
                        </Button>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    {activeTab === 'questions' && (
                        <>
                            {/* Magic AI Generator */}
                            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg sm:rounded-xl p-4 sm:p-6 text-white mb-6 sm:mb-8 shadow-lg">
                                <div className="flex items-start gap-3 sm:gap-4">
                                    {/* ... existing magic AI content ... */}
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-base sm:text-lg font-bold mb-1 sm:mb-2">Magic Form Creator</h2>
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <input
                                                type="text"
                                                value={prompt}
                                                onChange={(e) => setPrompt(e.target.value)}
                                                placeholder="e.g. Volunteer registration..."
                                                className="flex-1 bg-white/10 border border-white/20 rounded-md px-3 sm:px-4 py-2 text-sm sm:text-base text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                                            />
                                            <Button
                                                type="button" // Prevent submit
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

                            {/* General Info */}
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4 border-t-4 border-t-brand-600">
                                <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Form Details</h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-900">Form Title</label>
                                    <input
                                        {...register('title', { required: true })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-xl font-bold p-2 border"
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
                            </div>

                            {/* Questions Builder */}
                            <div className="space-y-4">
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

                                <div className="flex justify-center py-4 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => append({ id: crypto.randomUUID(), type: 'text', label: '', required: false })}>
                                    <Button type="button" variant="ghost" className="text-gray-600">
                                        <Plus className="h-5 w-5 mr-2" /> Add New Question
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'settings' && (
                        <SettingsTab
                            register={register}
                            control={control}
                            watch={watch}
                            setValue={setValue}
                        />
                    )}

                    <div className="sticky bottom-0 bg-white/80 backdrop-blur-md p-4 border-t border-gray-200 flex justify-between items-center -mx-4 sm:-mx-8 lg:-mx-8 lg:px-8 mt-8 shadow-lg z-10">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            {watch('questions')?.length} questions
                        </div>
                        <div className="flex items-center gap-4">
                            <label className="flex items-center cursor-pointer">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={isPublished}
                                        onChange={(e) => setIsPublished(e.target.checked)}
                                    />
                                    <div className={`block w-10 h-6 rounded-full transition-colors ${isPublished ? 'bg-brand-600' : 'bg-gray-300'}`}></div>
                                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isPublished ? 'transform translate-x-4' : ''}`}></div>
                                </div>
                                <span className="ml-3 text-sm font-medium text-gray-700">
                                    {isPublished ? 'Published' : 'Draft'}
                                </span>
                            </label>

                            <Button type="submit" size="lg" className="px-8 bg-brand-600 text-white shadow-md hover:bg-brand-700">
                                <Save className="h-5 w-5 mr-2" />
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};
