-- Add custom_sections column to restaurant_submissions table
ALTER TABLE public.restaurant_submissions 
ADD COLUMN custom_sections jsonb DEFAULT '[]'::jsonb;