ALTER FUNCTION public.save_restaurant_submission(uuid, jsonb, jsonb, text) SECURITY INVOKER;
ALTER FUNCTION public.restaurant_submission_bundle(uuid) SECURITY INVOKER;
GRANT INSERT ON public.restaurant_submission_revisions TO anon, authenticated;
CREATE POLICY "Revisions can be added, never changed" ON public.restaurant_submission_revisions FOR INSERT WITH CHECK (true);