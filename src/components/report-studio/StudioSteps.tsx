import { Upload, X, Image as ImageIcon } from 'lucide-react';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';

interface StepProps {
    register: UseFormRegister<any>;
    errors: FieldErrors<any>;
    watch: any;
    setValue: any;
    control?: any; // Added for customized inputs if needed
}

export interface ReportImage {
    file?: File;
    previewUrl: string;
    caption: string;
}

interface StepGalleryProps extends StepProps {
    images: ReportImage[];
    setImages: React.Dispatch<React.SetStateAction<ReportImage[]>>;
}

export const StepBasicInfo = ({ register, errors }: StepProps) => {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Event Title</label>
                    <input {...register('basicInfo.title', { required: 'Required' })} className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-brand-500 focus:ring-brand-500" />
                    {(errors.basicInfo as any)?.title && <span className="text-red-500 text-xs">Required</span>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <input type="date" {...register('basicInfo.date', { required: 'Required' })} className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-brand-500 focus:ring-brand-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Venue</label>
                    <input {...register('basicInfo.venue', { required: 'Required' })} className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-brand-500 focus:ring-brand-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Academic Year</label>
                    <select {...register('basicInfo.academicYear')} className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-brand-500 focus:ring-brand-500">
                        <option>2025-2026</option>
                        <option>2024-2025</option>
                        <option>2023-2024</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Report Length</label>
                    <select {...register('detailLevel')} className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-brand-500 focus:ring-brand-500">
                        <option value="standard">Standard (~10 Pages)</option>
                        <option value="brief">Brief (~5 Pages)</option>
                        <option value="detailed">Detailed (~15+ Pages)</option>
                    </select>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Event Poster URL (Optional)</label>
                    <input {...register('posterUrl')} placeholder="https://..." className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-brand-500 focus:ring-brand-500" />
                </div>
            </div>

            <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Program Outcomes (PO) Mapping</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {['PO1 (Engg Knowledge)', 'PO2 (Problem Analysis)', 'PO3 (Design/Dev)', 'PO4 (Investigations)', 'PO5 (Modern Tools)', 'PO9 (Individual/Team)', 'PO10 (Communication)', 'PO12 (Life-long Learning)'].map((po, idx) => (
                        <label key={idx} className="flex items-center space-x-2 border p-2 rounded hover:bg-gray-50 cursor-pointer">
                            <input type="checkbox" {...register(`poMapping.${po.split(' ')[0]}`)} className="rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
                            <span className="text-xs text-gray-700">{po}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Objectives (One per line)</label>
                <textarea
                    {...register('objectivesRaw')}
                    placeholder="To introduce students to...&#10;To provide hands-on experience..."
                    className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm h-32"
                />
                <p className="text-xs text-gray-500 mt-1">AI will expand these into full justifications.</p>
            </div>
        </div>
    );
};

export const StepEventFlow = ({ register }: StepProps) => {
    // Ideally this would be a dynamic array field, keeping it simple for now
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h3 className="text-lg font-medium text-gray-900">Event Flow & Rounds</h3>
            <p className="text-sm text-gray-500 mb-4">Describe what happened in each segment of the event.</p>

            {[0, 1, 2].map((i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Session / Round {i + 1} Title</label>
                    <input {...register(`eventFlow.${i}.title`)} placeholder="e.g. Opening Ceremony, Coding Round" className="block w-full rounded-md border-gray-300 border p-2 shadow-sm mb-2" />

                    <label className="block text-sm font-medium text-gray-700 mb-1">Description & Highlights</label>
                    <textarea {...register(`eventFlow.${i}.description`)} rows={3} placeholder="What happened? Key moments..." className="block w-full rounded-md border-gray-300 border p-2 shadow-sm" />
                </div>
            ))}
        </div>
    );
};

export const StepOutcomes = ({ register }: StepProps) => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Total Participants</label>
                    <input type="number" {...register('outcomes.participants')} className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm" />
                </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Winners Board</h4>
                {[0, 1, 2].map((i) => (
                    <div key={i} className="grid grid-cols-3 gap-2 mb-2">
                        <input {...register(`outcomes.winners.${i}.position`)} placeholder="Position (1st)" className="rounded-md border-gray-300 border p-2 text-sm" defaultValue={i === 0 ? "1st Category" : i === 1 ? "2nd Category" : "3rd Category"} />
                        <input {...register(`outcomes.winners.${i}.name`)} placeholder="Winner Name" className="rounded-md border-gray-300 border p-2 text-sm" />
                        <input {...register(`outcomes.winners.${i}.class`)} placeholder="Class/Year" className="rounded-md border-gray-300 border p-2 text-sm" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export const StepGallery = ({ images, setImages }: StepGalleryProps) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newImages: ReportImage[] = Array.from(e.target.files).map(file => ({
                file,
                previewUrl: URL.createObjectURL(file),
                caption: ''
            }));
            setImages(prev => [...prev, ...newImages]);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const updateCaption = (index: number, caption: string) => {
        setImages(prev => prev.map((img, i) => i === index ? { ...img, caption } : img));
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-12 hover:bg-gray-50 transition-colors">
                <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    id="image-upload"
                    onChange={handleFileChange}
                />
                <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center">
                    <div className="p-4 bg-indigo-50 rounded-full mb-4">
                        <Upload className="h-8 w-8 text-indigo-600" />
                    </div>
                    <span className="text-lg font-medium text-gray-900">Upload Event Photos</span>
                    <p className="text-sm text-gray-500 mt-1">Select multiple images (Max 5MB each)</p>
                </label>
            </div>

            {images.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    {images.map((img, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm group relative">
                            <button
                                onClick={() => removeImage(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
                            >
                                <X className="h-4 w-4" />
                            </button>
                            <div className="aspect-video bg-gray-100 rounded-md overflow-hidden mb-3 relative">
                                <img src={img.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                            <input
                                type="text"
                                placeholder="Add a caption description..."
                                value={img.caption}
                                onChange={(e) => updateCaption(index, e.target.value)}
                                className="block w-full rounded-md border-gray-300 border p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    ))}
                </div>
            )}

            {images.length === 0 && (
                <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center p-3 bg-gray-100 rounded-full mb-3">
                        <ImageIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">No images selected yet. Photos add great value to reports!</p>
                </div>
            )}
        </div>
    );
};

export const StepCustom = ({ register, watch, setValue }: StepProps) => {
    const customSections = watch('customSections') || [];

    const addSection = () => {
        setValue('customSections', [...customSections, { title: '', content: '' }]);
    };

    const removeSection = (index: number) => {
        setValue('customSections', customSections.filter((_: any, i: number) => i !== index));
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium text-gray-900">Custom Sections</h3>
                    <p className="text-sm text-gray-500">Add any additional details like Budget, Guest List, or Special Mentions.</p>
                </div>
                <button type="button" onClick={addSection} className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800">
                    <span className="text-xl mr-1">+</span> Add Section
                </button>
            </div>

            {customSections.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-500">No custom sections added yet.</p>
                </div>
            )}

            {customSections.map((_section: any, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50 relative">
                    <button
                        type="button"
                        onClick={() => removeSection(index)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    >
                        <X className="h-4 w-4" />
                    </button>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
                    <input {...register(`customSections.${index}.title`)} placeholder="e.g. Budget Breakdown" className="block w-full rounded-md border-gray-300 border p-2 shadow-sm mb-2" />

                    <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                    <textarea {...register(`customSections.${index}.content`)} rows={4} placeholder="Enter details..." className="block w-full rounded-md border-gray-300 border p-2 shadow-sm" />
                </div>
            ))}
        </div>
    );
};
