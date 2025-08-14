-- Add hero_image_url column to restaurant_submissions table
ALTER TABLE public.restaurant_submissions 
ADD COLUMN hero_image_url TEXT;