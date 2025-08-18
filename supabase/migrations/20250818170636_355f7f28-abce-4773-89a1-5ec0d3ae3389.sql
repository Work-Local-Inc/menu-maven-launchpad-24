-- Fix function search path issues
-- Update the existing functions to set search_path

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_automation_logs()
RETURNS TABLE(id uuid, run_date date, success boolean, offers_added integer, error_message text, created_at timestamp with time zone)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT 
    id,
    run_date,
    success,
    offers_added,
    error_message,
    created_at
  FROM public.automated_scraping_logs
  ORDER BY created_at DESC
  LIMIT 10;
$$;