import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { Controller } from 'react-hook-form';

export const SortableQuestion = ({ index, field, remove, register, control, watch }: any) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: field.id });

    const style = {
        transform: CSS.Transform ? CSS.Transform.toString(transform) : undefined,
        transition,
    };

    const type = watch(`questions.${index}.type`);

    return (
        <div ref={setNodeRef} style={style} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-4">
            <div className="flex justify-between items-start mb-4">
                <div {...attributes} {...listeners} className="cursor-grab p-1 hover:bg-gray-100 rounded text-gray-400">
                    <GripVertical className="h-5 w-5" />
                </div>
                <div className="flex-1 ml-4 mr-4">
                    {/* Visual preview of the question type icon could go here */}
                </div>
                <button type="button" onClick={() => remove(index)} className="text-red-500 p-1 hover:bg-red-50 rounded">
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="md:col-span-2">
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
                        <option value="text">Short Answer</option>
                        <option value="textarea">Paragraph</option>
                        <option value="multiple_choice">Multiple Choice</option>
                        <option value="checkboxes">Checkboxes</option>
                        <option value="dropdown">Dropdown</option>
                        <option value="file_upload">File Upload</option>
                        <option value="date">Date</option>
                        <option value="email">Email</option>
                        <option value="rating">Rating (1-5)</option>
                        <option value="description">Description (Static)</option>
                        <option value="image">Image (Static)</option>
                    </select>
                </div>
            </div>

            {(type === 'description') && (
                <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-700 uppercase">Content</label>
                    <textarea
                        {...register(`questions.${index}.description`)}
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2 border"
                        placeholder="Enter description text here..."
                    />
                </div>
            )}

            <div className="flex items-center mb-4">
                <input
                    type="checkbox"
                    {...register(`questions.${index}.required`)}
                    className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                    disabled={type === 'description' || type === 'image'}
                />
                <label className="ml-2 block text-sm text-gray-900">Required Question</label>
            </div>

            {/* Options for Choice Types */}
            {(type === 'multiple_choice' || type === 'checkboxes' || type === 'dropdown') && (
                <div className="bg-gray-50 p-4 rounded-md">
                    <label className="block text-xs font-medium text-gray-700 uppercase mb-2">Options (Comma separated)</label>
                    <Controller
                        name={`questions.${index}.options`}
                        control={control}
                        defaultValue={[]}
                        render={({ field: { value, onChange } }) => (
                            <input
                                value={Array.isArray(value) ? value.join(', ') : value}
                                onChange={(e) => onChange(e.target.value.split(',').map((s: string) => s.trim()))}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2 border"
                                placeholder="Option 1, Option 2, Option 3"
                            />
                        )}
                    />
                </div>
            )}

            {/* File Upload Settings (Basic) */}
            {type === 'file_upload' && (
                <div className="bg-gray-50 p-4 rounded-md text-sm text-gray-500">
                    User will be able to upload files (PDF, Images, Doc).
                    <p className="text-xs mt-1 text-orange-600">Note: Requires authentication by default for security.</p>
                </div>
            )}
        </div>
    );
};
