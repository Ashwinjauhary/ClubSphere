import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';
import { ChevronLeft, Upload, Trash2, Image as ImageIcon, Loader } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';

interface GalleryImage {
    id: string;
    image_url: string;
    caption: string;
    created_at: string;
}

export const GalleryManagementPage = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuthStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [images, setImages] = useState<GalleryImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [caption, setCaption] = useState('');
    const [dragActive, setDragActive] = useState(false);

    useEffect(() => {
        if (!id) return;
        fetchImages();
    }, [id]);

    const fetchImages = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('club_gallery')
                .select('*')
                .eq('club_id', id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setImages(data || []);
        } catch (error) {
            console.error('Error fetching images:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            await handleUpload(e.target.files[0]);
        }
    };

    const handleUpload = async (file: File) => {
        if (!user || !id) return;

        try {
            setUploading(true);

            // 1. Upload image to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${id}/${Math.random()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('club-gallery')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // 2. Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('club-gallery')
                .getPublicUrl(fileName);

            // 3. Save to database
            const { error: dbError } = await supabase
                .from('club_gallery')
                .insert([
                    {
                        club_id: id,
                        image_url: publicUrl,
                        caption: caption,
                        uploaded_by: user.id
                    }
                ]);

            if (dbError) throw dbError;

            fetchImages();
            toast.success('Image uploaded successfully');
        } catch (error) {
            console.error('Error uploading:', error);
            toast.error('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (imageId: string, imageUrl: string) => {
        if (!confirm('Are you sure you want to delete this image?')) return;

        try {
            // 1. Delete from database
            const { error: dbError } = await supabase
                .from('club_gallery')
                .delete()
                .eq('id', imageId);

            if (dbError) throw dbError;

            // 2. Delete from storage (optional, but good for cleanup)
            // Extract path from URL
            const path = imageUrl.split('club-gallery/')[1];
            if (path) {
                await supabase.storage.from('club-gallery').remove([path]);
            }

            setImages(images.filter(img => img.id !== imageId));
            toast.success('Image deleted successfully');
        } catch (error) {
            console.error('Error deleting image:', error);
            toast.error('Failed to delete image.');
        }
    };

    // Drag and drop handlers
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleUpload(e.dataTransfer.files[0]);
        }
    };

    if (loading) return <div className="text-center py-12">Loading gallery...</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="mb-8">
                <Link to={`/clubs/${id}`} className="inline-flex items-center text-sm text-gray-500 hover:text-brand-600 mb-4 transition-colors">
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Back to Club
                </Link>
                <PageHeader
                    title="Manage Gallery"
                    description="Upload and manage images for your club's gallery."
                />
            </div>

            {/* Upload Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                <div
                    className={`
                        relative border-2 border-dashed rounded-lg p-8 text-center transition-all
                        ${dragActive ? 'border-brand-500 bg-brand-50' : 'border-gray-300 hover:border-gray-400'}
                        ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => !uploading && fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileSelect}
                        disabled={uploading}
                    />

                    {uploading ? (
                        <div className="flex flex-col items-center">
                            <Loader className="h-10 w-10 text-brand-600 animate-spin mb-3" />
                            <p className="text-sm font-medium text-gray-900">Uploading image...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className="p-3 bg-brand-50 rounded-full text-brand-600 mb-3">
                                <Upload className="h-6 w-6" />
                            </div>
                            <p className="text-sm font-medium text-gray-900 mb-1">
                                Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">
                                PNG, JPG, GIF up to 5MB
                            </p>
                        </div>
                    )}
                </div>

                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Caption (Optional)</label>
                    <input
                        type="text"
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="Add a caption for your image..."
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2 border"
                        disabled={uploading}
                    />
                </div>
            </div>

            {/* Images Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((img) => (
                    <div key={img.id} className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                        <img
                            src={img.image_url}
                            alt={img.caption || 'Gallery image'}
                            className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <button
                                onClick={() => handleDelete(img.id, img.image_url)}
                                className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors transform scale-90 group-hover:scale-100"
                                aria-label="Delete image"
                            >
                                <Trash2 className="h-5 w-5" />
                            </button>
                        </div>
                        {img.caption && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 p-2">
                                <p className="text-white text-xs truncate text-center">{img.caption}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {images.length === 0 && !loading && (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">No images yet</h3>
                    <p className="text-gray-500">Upload some photos to showcase your club!</p>
                </div>
            )}
        </div>
    );
};
