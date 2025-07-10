import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (file: File, bucket: string, path?: string): Promise<string> => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = path || `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const uploadImage = (file: File, path?: string) => uploadFile(file, 'restaurant-images', path);
  const uploadPDF = (file: File, path?: string) => uploadFile(file, 'restaurant-pdfs', path);
  const uploadMenuFile = (file: File, path?: string) => {
    // For menu files, check if it's an image or PDF and upload to appropriate bucket
    if (file.type.startsWith('image/')) {
      return uploadFile(file, 'restaurant-images', path);
    } else {
      return uploadFile(file, 'restaurant-pdfs', path);
    }
  };

  return {
    uploadImage,
    uploadPDF,
    uploadMenuFile,
    uploading
  };
};