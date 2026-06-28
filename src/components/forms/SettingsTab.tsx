import { type UseFormRegister, type Control, Controller } from 'react-hook-form';
import { Upload, X } from 'lucide-react';

interface SettingsTabProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    register: UseFormRegister<any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    control: Control<any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    watch: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setValue: any;
}

const THEMES = [
    { id: 'classic-blue', name: 'Classic Blue', color: 'bg-blue-600' },
    { id: 'modern-purple', name: 'Modern Purple', color: 'bg-purple-600' },
    { id: 'fresh-green', name: 'Fresh Green', color: 'bg-emerald-600' },
    { id: 'warm-orange', name: 'Warm Orange', color: 'bg-orange-500' },
    { id: 'professional-gray', name: 'Professional Gray', color: 'bg-gray-700' },
    { id: 'elegant-pink', name: 'Elegant Pink', color: 'bg-pink-600' },
];

import { uploadFile } from '../../services/storageService';
import { toast } from 'sonner';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

// ... THEMES ...

export const SettingsTab = ({ register, control, watch, setValue }: SettingsTabProps) => {
    const headerImage = watch('header_image_url');
    const currentTheme = watch('theme');
    const [uploading, setUploading] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size must be less than 5MB");
            return;
        }

        setUploading(true);
        try {
            const publicUrl = await uploadFile(file, 'form-uploads', 'headers');
            setValue('header_image_url', publicUrl);
            toast.success("Header image uploaded!");
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error("Failed to upload image. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Appearance Section */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Appearance</h3>

                {/* Header Image */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Header Image</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md relative hover:bg-gray-50 transition-colors">
                        {headerImage ? (
                            <div className="relative w-full">
                                <img loading="lazy" decoding="async" src={headerImage} alt="Header" className="h-48 w-full object-cover rounded-md" />
                                <button
                                    type="button"
                                    onClick={() => setValue('header_image_url', '')}
                                    className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md text-red-500 hover:bg-red-50"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-1 text-center">
                                {uploading ? (
                                    <div className="py-4">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-brand-600" />
                                        <p className="text-sm text-gray-500 mt-2">Uploading...</p>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                        <div className="flex text-sm text-gray-600 justify-center">
                                            <label className="relative cursor-pointer bg-white rounded-md font-medium text-brand-600 hover:text-brand-500 focus-within:outline-none">
                                                <span>Upload a file</span>
                                                <input type="file" className="sr-only" accept="image/*" onChange={handleImageUpload} />
                                            </label>
                                            <p className="pl-1">or drag and drop</p>
                                        </div>
                                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Theme Selector */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Form Theme</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {THEMES.map((theme) => (
                            <div
                                key={theme.id}
                                onClick={() => setValue('theme', theme.id)}
                                className={`cursor-pointer rounded-lg p-3 border-2 transition-all ${currentTheme === theme.id ? 'border-brand-600 bg-brand-50 ring-1 ring-brand-500' : 'border-gray-200 hover:border-gray-300'}`}
                            >
                                <div className={`h-8 w-full ${theme.color} rounded mb-2`}></div>
                                <p className="text-xs font-medium text-gray-900 text-center">{theme.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Response Settings */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Response Handling</h3>

                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-sm font-medium text-gray-900">Accepting Responses</h4>
                        <p className="text-xs text-gray-500">Enable or disable form submissions</p>
                    </div>
                    <Controller
                        name="settings.accepting_responses"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                            <button
                                type="button"
                                onClick={() => onChange(!value)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-green-600' : 'bg-gray-300'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        )}
                    />
                </div>

                <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-start gap-3">
                        <input
                            type="checkbox"
                            {...register('settings.limit_one_response_per_user')}
                            id="limit_one"
                            className="mt-1 h-4 w-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                        />
                        <div>
                            <label htmlFor="limit_one" className="text-sm font-medium text-gray-900">Limit to 1 response per user</label>
                            <p className="text-xs text-gray-500">Requires users to sign in</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Max Response Limit (Optional)</label>
                        <input
                            type="number"
                            {...register('settings.response_limit', { valueAsNumber: true })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2 border"
                            placeholder="e.g. 100"
                        />
                        <p className="text-xs text-gray-500 mt-1">Automatically close form after this many responses</p>
                    </div>
                </div>
            </div>

            {/* Presentation */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Presentation</h3>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Confirmation Message</label>
                    <textarea
                        {...register('settings.thank_you_message')}
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2 border"
                    />
                    <p className="text-xs text-gray-500 mt-1">Message shown after successful submission</p>
                </div>
            </div>
        </div>
    );
};
