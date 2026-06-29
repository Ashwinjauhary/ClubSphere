import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Upload, MapPin, Trash2, ArrowLeft, Camera, Shield } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import exifr from 'exifr';
import { motion, AnimatePresence } from 'framer-motion';
import { SkeletonList } from '../components/ui/Skeleton';
import { PageHeader } from '../components/ui/PageHeader';

interface MediaAsset {
    id: string;
    url: string;
    caption: string | null;
    latitude: number | null;
    longitude: number | null;
    captured_at: string | null;
    is_geotagged: boolean;
}

export const EventMediaPage = () => {
    const { id: eventId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, role } = useAuthStore();
    const [media, setMedia] = useState<MediaAsset[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [eventTitle, setEventTitle] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (eventId) {
            fetchMedia();
            fetchEventTitle();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eventId]);

    const fetchEventTitle = async () => {
        try {
            const { data } = await supabase
                .from('events')
                .select('title')
                .eq('id', eventId)
                .single();
            if (data) setEventTitle(data.title);
        } catch (error) {
            console.error('Error fetching event title:', error);
        }
    };

    const fetchMedia = async () => {
        if (!eventId) return;
        try {
            const { data, error } = await supabase
                .from('media_assets')
                .select('*')
                .eq('event_id', eventId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setMedia(data || []);
        } catch (error) {
            console.error('Error fetching media:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files.length || !eventId || !user) return;

        setUploading(true);
        const files = Array.from(e.target.files);

        for (const file of files) {
            try {
                // 1. Extract EXIF
                let lat = null;
                let lon = null;
                let capturedAt = null;

                try {
                    const exifData = await exifr.parse(file);
                    if (exifData) {
                        lat = exifData.latitude;
                        lon = exifData.longitude;
                        capturedAt = exifData.DateTimeOriginal || exifData.CreateDate;
                    }
                } catch (exifError) {
                    console.warn("EXIF extraction failed:", exifError);
                }

                // 2. Upload to Storage
                const fileExt = file.name.split('.').pop();
                const fileName = `${eventId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('club-media')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('club-media')
                    .getPublicUrl(fileName);

                // 3. Insert into Database
                const { error: insertError } = await supabase.from('media_assets').insert({
                    event_id: eventId,
                    uploaded_by: user.id,
                    url: publicUrl,
                    latitude: lat,
                    longitude: lon,
                    captured_at: capturedAt ? new Date(capturedAt).toISOString() : null,
                    caption: file.name
                });

                if (insertError) throw insertError;

            } catch (error) {
                console.error(`Failed to upload ${file.name}:`, error);
                alert(`Failed to upload ${file.name}`);
            }
        }

        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchMedia(); // Refresh list
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this image?')) return;
        try {
            const { error } = await supabase.from('media_assets').delete().eq('id', id);
            if (error) throw error;
            setMedia(media.filter(m => m.id !== id));
        } catch (error) {
            console.error('Error deleting media:', error);
        }
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { opacity: 0, scale: 0.9 },
        show: { opacity: 1, scale: 1 }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 p-6 sm:p-8">
            {/* Header */}
            <div className="mb-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/events/${eventId}`)}
                    className="text-gray-500 hover:text-gray-900 -ml-2"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Event
                </Button>
            </div>

            <PageHeader
                title="Event Gallery"
                description={eventTitle ? `Capturing moments from ${eventTitle}` : 'Loading event details...'}
                gradient="from-pink-600 to-rose-600"
                action={
                    (role === 'admin' || role === 'super_admin') && (
                        <div className="flex gap-3">
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                            />
                            <Button
                                onClick={() => fileInputRef.current?.click()}
                                loading={uploading}
                                className="bg-gradient-to-r from-pink-600 to-rose-600 text-white border-0 shadow-lg shadow-pink-500/30 hover:shadow-pink-500/40"
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Photos
                            </Button>
                        </div>
                    )
                }
            />



            {
                loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        <SkeletonList count={8} />
                    </div>
                ) : (
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    >
                        {/* Upload Card */}
                        <motion.div
                            variants={item}
                            onClick={() => fileInputRef.current?.click()}
                            className="aspect-[4/5] rounded-2xl border-2 border-dashed border-gray-300 hover:border-pink-500 bg-gray-50 hover:bg-pink-50/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 group"
                        >
                            <div className="p-4 rounded-full bg-white shadow-sm group-hover:scale-110 transition-transform">
                                <Camera className="h-8 w-8 text-gray-400 group-hover:text-pink-500" />
                            </div>
                            <p className="text-sm font-medium text-gray-500 group-hover:text-pink-600">Add Photos</p>
                        </motion.div>

                        <AnimatePresence>
                            {media.map((asset) => (
                                <motion.div
                                    key={asset.id}
                                    variants={item}
                                    layout
                                    className="group relative aspect-[4/5] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 bg-gray-900"
                                >
                                    <img loading="lazy" decoding="async"
                                        src={asset.url}
                                        alt={asset.caption || 'Event photo'}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                                    />

                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                        {asset.caption && (
                                            <p className="text-white text-sm font-medium truncate mb-1">
                                                {asset.caption}
                                            </p>
                                        )}
                                        {asset.is_geotagged && (
                                            <div className="flex items-center text-xs text-brand-200">
                                                <MapPin className="h-3 w-3 mr-1" />
                                                <span>
                                                    {asset.latitude?.toFixed(4)}, {asset.longitude?.toFixed(4)}
                                                </span>
                                            </div>
                                        )}
                                        {!asset.is_geotagged && (
                                            <p className="text-xs text-gray-400 italic">No location data</p>
                                        )}
                                    </div>

                                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-[-10px] group-hover:translate-y-0 duration-300">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(asset.id);
                                            }}
                                            className="p-2 bg-white/10 hover:bg-red-500/80 backdrop-blur-md rounded-full text-white transition-colors"
                                            title="Delete Image"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>

                                    {asset.is_geotagged && (
                                        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                                            <Shield className="h-3 w-3" /> Verified Location
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )
            }

            {
                !loading && media.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-gray-400 mb-2">No photos yet</p>
                        <p className="text-sm text-gray-400">Be the first to upload memories!</p>
                    </div>
                )
            }
        </div >
    );
};
