import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import imageCompression from 'browser-image-compression';

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);

  const optimizeImage = async (file: File, isLogo: boolean = false): Promise<File> => {
    // Skip optimization for non-image files
    if (!file.type.startsWith('image/')) {
      return file;
    }

    const options = isLogo ? {
      maxSizeMB: 2,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
      fileType: 'image/png' as const,
      initialQuality: 0.9,
    } : {
      maxSizeMB: 1,
      maxWidthOrHeight: 2560,
      useWebWorker: true,
      fileType: 'image/webp' as const,
      initialQuality: 0.82,
    };

    try {
      const compressedFile = await imageCompression(file, options);
      
      // Update filename extension to match the optimized format
      const originalName = file.name.split('.').slice(0, -1).join('.');
      const newExtension = isLogo ? 'png' : 'webp';
      const optimizedFile = new File([compressedFile], `${originalName}.${newExtension}`, {
        type: compressedFile.type,
      });

      return optimizedFile;
    } catch (error) {
      console.warn('Image optimization failed, using original:', error);
      return file;
    }
  };

  const uploadFile = async (file: File, bucket: string, path?: string, isLogo: boolean = false): Promise<string> => {
    setUploading(true);
    try {
      // Optimize image before upload if it's an image file
      const optimizedFile = await optimizeImage(file, isLogo);
      
      const fileExt = optimizedFile.name.split('.').pop();
      const fileName = path || `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, optimizedFile);

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

  const uploadImage = (file: File, path?: string) => uploadFile(file, 'restaurant-images', path, false);
  const uploadLogo = (file: File, path?: string) => uploadFile(file, 'restaurant-images', path, true);
  const uploadPDF = (file: File, path?: string) => uploadFile(file, 'restaurant-pdfs', path);
  const uploadMenuFile = (file: File, path?: string) => {
    // For menu files, check if it's an image or PDF and upload to appropriate bucket
    if (file.type.startsWith('image/')) {
      return uploadFile(file, 'restaurant-images', path, false);
    } else {
      return uploadFile(file, 'restaurant-pdfs', path);
    }
  };

  return {
    uploadImage,
    uploadLogo,
    uploadPDF,
    uploadMenuFile,
    uploading
  };
};