import { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from './Button';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    label?: string;
    className?: string;
    bucket?: string; // Default to 'club-media'
}

export const ImageUpload = ({
    value,
    onChange,
    label = "Upload Image",
    className = "",
    bucket = "club-media"
}: ImageUploadProps) => {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const file = event.target.files?.[0];
            if (!file) return;

            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error('Please upload an image file (PNG, JPG, JPEG)');
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size must be less than 5MB');
                return;
            }

            setUploading(true);

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            onChange(data.publicUrl);
            toast.success('Image uploaded successfully');

        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('Failed to upload image');
        } finally {
            setUploading(false);
            // Reset input so valid change events trigger even if same file selected
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemove = () => {
        onChange('');
    };

    return (
        <div className={`space-y-4 w-full ${className}`}>
            {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}

            <div className="flex items-center gap-4">
                {value ? (
                    <div className="relative group rounded-xl overflow-hidden border border-gray-200 w-32 h-32 flex-shrink-0 bg-gray-50">
                        <img
                            src={value}
                            alt="Uploaded"
                            className="w-full h-full object-cover"
                        />
                        <button
                            onClick={handleRemove}
                            type="button"
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 focus:outline-none"
                            title="Remove image"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <div className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 text-gray-400">
                        <ImageIcon className="h-8 w-8 opacity-50" />
                    </div>
                )}

                <div className="flex-1 space-y-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleUpload}
                        accept="image/*"
                        className="hidden"
                        disabled={uploading}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        isLoading={uploading}
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full sm:w-auto"
                    >
                        {uploading ? (
                            <>Uploading...</>
                        ) : (
                            <>
                                <Upload className="h-4 w-4 mr-2" />
                                {value ? 'Change Image' : 'Upload Image'}
                            </>
                        )}
                    </Button>
                    <p className="text-xs text-gray-500">
                        Supports PNG, JPG, JPEG. Max 5MB.
                    </p>
                </div>
            </div>
        </div>
    );
};
