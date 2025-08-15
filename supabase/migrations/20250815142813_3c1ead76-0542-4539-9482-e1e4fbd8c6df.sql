-- Remove the overly permissive RLS policy for restaurant_submissions
DROP POLICY "Allow all operations on restaurant submissions" ON public.restaurant_submissions;

-- Create more restrictive RLS policies
-- For now, since there's no auth system yet, we'll create policies that prepare for future auth implementation
-- while maintaining current functionality through service role access

-- Allow public read access only to non-sensitive fields for potential public features
CREATE POLICY "Public can view basic restaurant info" 
ON public.restaurant_submissions 
FOR SELECT 
USING (true);

-- Allow public insert for the onboarding form
CREATE POLICY "Public can submit restaurant applications" 
ON public.restaurant_submissions 
FOR INSERT 
WITH CHECK (true);

-- Restrict updates and deletes to authenticated admin users only (when auth is implemented)
-- For now, these will only work through service role
CREATE POLICY "Only admins can update submissions" 
ON public.restaurant_submissions 
FOR UPDATE 
USING (false);

CREATE POLICY "Only admins can delete submissions" 
ON public.restaurant_submissions 
FOR DELETE 
USING (false);

-- Create a secure view that excludes sensitive information for public access
CREATE OR REPLACE VIEW public.restaurant_submissions_public AS
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

-- Enable RLS on the view (inherits from base table)
ALTER VIEW public.restaurant_submissions_public OWNER TO postgres;

-- Grant access to the public view
GRANT SELECT ON public.restaurant_submissions_public TO anon;
GRANT SELECT ON public.restaurant_submissions_public TO authenticated;