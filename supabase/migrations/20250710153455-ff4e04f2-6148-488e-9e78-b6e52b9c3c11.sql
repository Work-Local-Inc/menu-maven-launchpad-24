-- Add online ordering platform URL to restaurant submissions
ALTER TABLE public.restaurant_submissions 
ADD COLUMN online_ordering_url TEXT;

-- Add comment to clarify the menu file can be PDF or JPG
COMMENT ON COLUMN public.restaurant_submissions.menu_pdf_url IS 'URL to menu file (PDF or JPG format)';