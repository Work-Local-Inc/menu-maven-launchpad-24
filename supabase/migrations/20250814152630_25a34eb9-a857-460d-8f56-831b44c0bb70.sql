-- Add logo_url column to restaurant_submissions table
ALTER TABLE public.restaurant_submissions 
ADD COLUMN logo_url text;

-- Create restaurant_deals table
CREATE TABLE public.restaurant_deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_submission_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.restaurant_deals ENABLE ROW LEVEL SECURITY;

-- Create policies for restaurant_deals
CREATE POLICY "Allow all operations on restaurant deals" 
ON public.restaurant_deals 
FOR ALL 
USING (true)
WITH CHECK (true);