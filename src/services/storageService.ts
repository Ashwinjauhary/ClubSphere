import { supabase } from '../lib/supabase';

export const uploadFile = async (file: File, bucket: string = 'form-uploads', path?: string) => {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${path ? path + '/' : ''}${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error } = await supabase.storage
            .from(bucket)
            .upload(filePath, file);

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
