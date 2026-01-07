import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Wand2, ChevronRight, ChevronLeft, Download, CheckCircle2, Save } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { StepBasicInfo, StepEventFlow, StepOutcomes, StepGallery, StepCustom, type ReportImage } from '../components/report-studio/StudioSteps';
import { ImportDataButton } from '../components/report-studio/ImportDataButton';
import type { ImportedData } from '../utils/importParser';

import { generateReportPDF } from '../utils/reportUtils';
import { generateReportDOCX } from '../utils/docxUtils';
import type { ReportData, GeneratedReport } from '../types';
import { generateEventReport } from '../services/aiService';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

const STEPS = ['Basic Details', 'Event Flow', 'Outcomes', 'Custom Sections', 'Event Gallery', 'Review'];

export const AIReportStudioPage = () => {
    const { user, managedClubId } = useAuthStore();
    const [currentStep, setCurrentStep] = useState(0);
    const [images, setImages] = useState<ReportImage[]>([]); // New state for images
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [generatedContent, setGeneratedContent] = useState<GeneratedReport | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [editableContent, setEditableContent] = useState<GeneratedReport | null>(null);

    const { register, watch, formState: { errors }, setValue } = useForm<any>({
        defaultValues: {
            basicInfo: {
                clubName: 'ClubSphere Tech Club', // Default, should effectively be from auth
                academicYear: '2025-2026'
            },
            eventFlow: [{ title: '', description: '' }],
            customSections: [], // v2
            detailLevel: 'standard' // v2
        }
    });

    const formData = watch();

    const handleNext = async () => {
        if (currentStep === 4) {
            // Generate AI Content before moving to Review (Changed from step 2 to 3)
            setIsGenerating(true);
            try {
                // Transform form data to match ReportData interface
                const reportInput: ReportData = {
                    basicInfo: formData.basicInfo,
                    objectives: formData.objectivesRaw ? formData.objectivesRaw.split('\n') : [],
                    poMapping: formData.poMapping || {},
                    eventFlow: formData.eventFlow || [],
                    outcomes: {
                        participants: parseInt(formData.outcomes?.participants || '0'),
                        winners: formData.outcomes?.winners || [],
                        highlights: []
                    },
                    images: images.map(img => ({ url: img.previewUrl, caption: img.caption })),
                    customSections: formData.customSections || [],
                    detailLevel: formData.detailLevel || 'standard'
                };

                const content = await generateEventReport(reportInput);
                setGeneratedContent(content);
                setEditableContent(content); // Initialize editable copy
                setCurrentStep(prev => prev + 1);
            } catch (error) {
                console.error("Generation failed", error);
                alert("Failed to generate report. Please try again.");
            } finally {
                setIsGenerating(false);
            }
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        setCurrentStep(prev => prev - 1);
    };

    const handleSaveReport = async () => {
        if (!editableContent || !user || !managedClubId) {
            alert("Cannot save: Missing user or club information.");
            return;
        }

        setIsSaving(true);
        try {
            const { data: reportData, error } = await supabase
                .from('reports')
                .insert({
                    club_id: managedClubId,
                    title: formData.basicInfo.title,
                    generated_content: editableContent,
                    status: 'draft',
                    created_by: user.id
                })
                .select()
                .single();

            if (error) throw error;

            // Upload Images
            if (images.length > 0 && reportData) {
                for (const img of images) {
                    if (!img.file) continue;

                    const fileExt = img.file.name.split('.').pop();
                    const fileName = `${Math.random()}.${fileExt} `;
                    const filePath = `${managedClubId} /reports/${reportData.id}/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('club-media')
                        .upload(filePath, img.file);

                    if (!uploadError) {
                        const { data: { publicUrl } } = supabase.storage
                            .from('club-media')
                            .getPublicUrl(filePath);

                        await supabase.from('report_images').insert({
                            report_id: reportData.id,
                            image_url: publicUrl,
                            caption: img.caption
                        });
                    }
                }
            }

            alert("Report and images saved successfully to your dashboard!");
        } catch (err) {
            console.error("Error saving report:", err);
            alert("Failed to save report.");
        } finally {
            setIsSaving(false);
        }
    };

    const downloadPDF = () => {
        if (!editableContent) return;
        const posterUrl = formData.posterUrl || undefined;
        // Use letterhead from public folder or provide URLs
        const letterheadHeader = '/letterhead-header.png';
        const letterheadFooter = '/letterhead-footer.png';
        generateReportPDF(formData.basicInfo.title, editableContent, posterUrl, letterheadHeader, letterheadFooter);
    };

    const downloadWord = () => {
        if (!editableContent) return;
        generateReportDOCX(formData.basicInfo.title, editableContent, formData.basicInfo.clubName);
    };

    const toggleEditMode = () => {
        setEditMode(!editMode);
    };

    const updateEditableField = (field: keyof GeneratedReport, value: string) => {
        if (!editableContent) return;
        setEditableContent({
            ...editableContent,
            [field]: value
        });
    };

    const handleImport = (data: ImportedData) => {
        // Populate basic info
        setValue('basicInfo.title', data.basicInfo.title);
        setValue('basicInfo.date', data.basicInfo.date);
        setValue('basicInfo.venue', data.basicInfo.venue);
        setValue('basicInfo.clubName', data.basicInfo.clubName || 'ClubSphere');
        setValue('basicInfo.academicYear', data.basicInfo.academicYear || '2024-2025');

        // Set detail level and poster
        setValue('detailLevel', data.detailLevel || 'standard');
        if (data.posterUrl) {
            setValue('posterUrl', data.posterUrl);
        }

        // Set objectives
        setValue('objectivesRaw', data.objectives.join('\n'));

        // Set PO mapping
        if (data.poMapping) {
            Object.keys(data.poMapping).forEach(po => {
                setValue(`poMapping.${po}`, data.poMapping![po]);
            });
        }

        // Set event flow
        if (data.eventFlow && data.eventFlow.length > 0) {
            data.eventFlow.forEach((flow, index) => {
                setValue(`eventFlow.${index}.title`, flow.title);
                setValue(`eventFlow.${index}.description`, flow.description);
            });
        }

        // Set outcomes
        setValue('outcomes.participants', data.outcomes.participants);
        if (data.outcomes.winners && data.outcomes.winners.length > 0) {
            data.outcomes.winners.forEach((winner, index) => {
                setValue(`outcomes.winners.${index}.position`, winner.position);
                setValue(`outcomes.winners.${index}.name`, winner.name);
                setValue(`outcomes.winners.${index}.class`, winner.class);
            });
        }

        // Set custom sections
        if (data.customSections && data.customSections.length > 0) {
            setValue('customSections', data.customSections);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center p-2 bg-indigo-100 rounded-full mb-2">
                    <Wand2 className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 px-4">ClubSphere AI Report Studio</h1>
                <p className="text-sm sm:text-base text-gray-500 max-w-2xl mx-auto px-4">
                    Turn basic event details into a professional, NAAC/IQAC-compliant 15-page report in seconds.
                </p>
            </div>

            {/* Stepper */}
            <div className="flex justify-center mb-6 sm:mb-8 overflow-x-auto scrollbar-hide -mx-4 px-4">
                <nav className="flex items-center space-x-2 sm:space-x-4 min-w-max" aria-label="Progress">
                    {STEPS.map((step, index) => (
                        <div key={step} className="flex items-center">
                            <div className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex-shrink-0 ${index <= currentStep ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300 text-gray-500'
                                }`}>
                                {index < currentStep ? <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" /> : <span className="text-xs sm:text-sm font-medium">{index + 1}</span>}
                            </div>
                            <span className={`ml-1.5 sm:ml-2 text-xs sm:text-sm font-medium whitespace-nowrap ${index <= currentStep ? 'text-indigo-600' : 'text-gray-500'} hidden md:inline`}>{step}</span>
                            {index < STEPS.length - 1 && (
                                <div className="ml-2 sm:ml-4 w-8 sm:w-12 h-0.5 bg-gray-200"></div>
                            )}
                        </div>
                    ))}
                </nav>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-200 overflow-hidden min-h-[400px] sm:min-h-[500px] flex flex-col">
                <div className="flex-1 p-4 sm:p-6 lg:p-8">
                    {currentStep === 0 && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center pb-4 border-b">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Basic Event Details</h2>
                                    <p className="text-sm text-gray-500 mt-1">Fill in manually or use Quick Import</p>
                                </div>
                                <ImportDataButton onImport={handleImport} />
                            </div>
                            <StepBasicInfo register={register} errors={errors} watch={watch} setValue={setValue} />
                        </div>
                    )}
                    {currentStep === 1 && <StepEventFlow register={register} errors={errors} watch={watch} setValue={setValue} />}
                    {currentStep === 2 && <StepOutcomes register={register} errors={errors} watch={watch} setValue={setValue} />}
                    {currentStep === 3 && <StepCustom register={register} errors={errors} watch={watch} setValue={setValue} />}
                    {currentStep === 4 && <StepGallery register={register} errors={errors} watch={watch} setValue={setValue} images={images} setImages={setImages} />}

                    {currentStep === 5 && generatedContent && editableContent && (
                        <div className="animate-in fade-in space-y-6">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between bg-green-50 p-4 sm:p-5 rounded-lg border border-green-200 gap-4">
                                <div className="flex items-start sm:items-center gap-3">
                                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                                    <div>
                                        <h3 className="font-bold text-green-800 text-sm sm:text-base">Report Generated Successfully!</h3>
                                        <p className="text-xs sm:text-sm text-green-700">
                                            {editMode ? 'Edit the content below, then save or download.' : 'Your professional event document is ready.'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
                                    <Button onClick={toggleEditMode} variant={editMode ? "primary" : "secondary"} className="w-full sm:w-auto text-sm">
                                        {editMode ? '✓ Done Editing' : '✏️ Edit Content'}
                                    </Button>
                                    <Button onClick={handleSaveReport} variant="secondary" loading={isSaving} className="w-full sm:w-auto text-sm">
                                        <Save className="h-4 w-4 mr-2" />
                                        Save
                                    </Button>
                                    <Button onClick={downloadWord} variant="secondary" className="w-full sm:w-auto text-sm">
                                        <Download className="h-4 w-4 mr-2" />
                                        Word
                                    </Button>
                                    <Button onClick={downloadPDF} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto text-sm">
                                        <Download className="h-4 w-4 mr-2" />
                                        PDF
                                    </Button>
                                </div>
                            </div>

                            <div className="prose max-w-none p-4 sm:p-6 lg:p-8 border border-gray-100 rounded-xl bg-gray-50/50 shadow-inner h-[400px] sm:h-[500px] lg:h-[600px] overflow-y-auto">
                                <h1 className="text-3xl font-bold text-center text-gray-900 mb-8 border-b pb-4">{formData.basicInfo.title.toUpperCase()}</h1>

                                <h3 className="text-indigo-800 border-b border-indigo-200 pb-1 mt-6">1. Introduction</h3>
                                {editMode ? (
                                    <textarea
                                        value={editableContent.introduction}
                                        onChange={(e) => updateEditableField('introduction', e.target.value)}
                                        className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                ) : (
                                    <p className="whitespace-pre-wrap text-gray-700">{editableContent.introduction}</p>
                                )}

                                <h3 className="text-indigo-800 border-b border-indigo-200 pb-1 mt-6">2. Objectives</h3>
                                {editMode ? (
                                    <textarea
                                        value={editableContent.objectivesContent}
                                        onChange={(e) => updateEditableField('objectivesContent', e.target.value)}
                                        className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                ) : (
                                    <p className="whitespace-pre-wrap text-gray-700">{editableContent.objectivesContent}</p>
                                )}

                                <h3 className="text-indigo-800 border-b border-indigo-200 pb-1 mt-6">3. Program Outcomes</h3>
                                {editMode ? (
                                    <textarea
                                        value={editableContent.poJustification}
                                        onChange={(e) => updateEditableField('poJustification', e.target.value)}
                                        className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                ) : (
                                    <p className="whitespace-pre-wrap text-gray-700">{editableContent.poJustification}</p>
                                )}

                                <h3 className="text-indigo-800 border-b border-indigo-200 pb-1 mt-6">4. Event Flow</h3>
                                {editMode ? (
                                    <textarea
                                        value={editableContent.flowContent}
                                        onChange={(e) => updateEditableField('flowContent', e.target.value)}
                                        className="w-full min-h-[120px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                ) : (
                                    <p className="whitespace-pre-wrap text-gray-700">{editableContent.flowContent}</p>
                                )}

                                <h3 className="text-indigo-800 border-b border-indigo-200 pb-1 mt-6">5. Conclusion</h3>
                                {editMode ? (
                                    <textarea
                                        value={editableContent.conclusion}
                                        onChange={(e) => updateEditableField('conclusion', e.target.value)}
                                        className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                ) : (
                                    <p className="whitespace-pre-wrap text-gray-700">{editableContent.conclusion}</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 sm:p-6 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        disabled={currentStep === 0 || isGenerating}
                    >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>

                    {currentStep < STEPS.length - 1 && (
                        <Button
                            onClick={handleNext}
                            loading={isGenerating}
                            className={isGenerating ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700"}
                        >
                            {currentStep === 4 ? 'Generate AI Report' : 'Next Step'}
                            {!isGenerating && <ChevronRight className="h-4 w-4 ml-2" />}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};
