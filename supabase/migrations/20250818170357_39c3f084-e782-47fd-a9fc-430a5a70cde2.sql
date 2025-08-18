-- Fix the security definer view issue
-- Drop the existing view and recreate it without SECURITY DEFINER
DROP VIEW IF EXISTS public.restaurant_submissions_public;

-- Create a regular view (not SECURITY DEFINER) that shows only non-sensitive information
CREATE VIEW public.restaurant_submissions_public AS
SELECT 
  id,
  restaurant_name,
  address,
  website,
  online_ordering_url,
  logo_url,
  hero_image_url,
  founded_year,
  story,
  hours,
  delivery_areas,
  status,
  created_at,
  generated_site_url
FROM public.restaurant_submissions
WHERE status = 'live';

-- Grant access to the public view
GRANT SELECT ON public.restaurant_submissions_public TO anon;
GRANT SELECT ON public.restaurant_submissions_public TO authenticated;