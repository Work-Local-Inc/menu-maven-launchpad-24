-- Fix RLS policy to allow updates on restaurant submissions
DROP POLICY IF EXISTS "Only admins can update submissions" ON public.restaurant_submissions;

-- Create new policy that allows updates (since no auth system is implemented yet)
CREATE POLICY "Allow updates on restaurant submissions" 
ON public.restaurant_submissions 
FOR UPDATE 
USING (true);