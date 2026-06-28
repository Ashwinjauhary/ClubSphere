import { supabase } from '../lib/supabase';
import imageCompression from 'browser-image-compression';

export const uploadFile = async (file: File, bucket: string = 'form-uploads', path?: string) => {
    try {
        let fileToUpload = file;
        let fileExt = file.name.split('.').pop() || 'unknown';

        // Compress images before upload
        if (file.type.startsWith('image/')) {
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
                fileType: 'image/webp' as string, // Force convert to webp
            };
            
            try {
                fileToUpload = await imageCompression(file, options);
                fileExt = 'webp'; // Update extension
            } catch (compressionError) {
                console.warn('Image compression failed, falling back to original file:', compressionError);
            }
        }

        const fileName = `${path ? path + '/' : ''}${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error } = await supabase.storage
            .from(bucket)
            .upload(filePath, fileToUpload);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return publicUrl;
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
};
