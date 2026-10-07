CREATE TABLE public.restaurant_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_submission_id uuid NOT NULL REFERENCES public.restaurant_submissions(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurant_faqs TO anon, authenticated;
GRANT ALL ON public.restaurant_faqs TO service_role;
ALTER TABLE public.restaurant_faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on restaurant faqs" ON public.restaurant_faqs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Only admins can delete restaurant menus" ON public.restaurant_menus;
CREATE POLICY "Allow deleting restaurant menus" ON public.restaurant_menus FOR DELETE USING (true);