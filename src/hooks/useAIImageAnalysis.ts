import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AIAnalysisResult {
  dishName: string;
  description: string;
  suggestedCategory?: string;
}

export const useAIImageAnalysis = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const { toast } = useToast();

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const analyzeImage = async (
    file: File,
    category: string,
    language: 'en' | 'fr'
  ): Promise<AIAnalysisResult> => {
    setAnalyzing(true);
    
    try {
      // Convert image to base64
      const imageBase64 = await convertImageToBase64(file);

      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('analyze-image-ai', {
        body: {
          imageBase64,
          category,
          language
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to analyze image');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: "AI Analysis Complete",
        description: "Generated SEO-optimized description successfully!",
      });

      return {
        dishName: data.dishName || '',
        description: data.description || '',
        suggestedCategory: data.suggestedCategory
      };

    } catch (error) {
      console.error('AI analysis error:', error);
      
      toast({
        title: "AI Analysis Failed",
        description: error instanceof Error ? error.message : 'Failed to analyze image',
        variant: "destructive",
      });

      throw error;
    } finally {
      setAnalyzing(false);
    }
  };

  return {
    analyzeImage,
    analyzing
  };
};