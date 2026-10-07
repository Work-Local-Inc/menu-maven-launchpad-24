ALTER TABLE public.restaurant_submissions ADD COLUMN IF NOT EXISTS image_display jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.restaurant_dishes ADD COLUMN IF NOT EXISTS image_fit text NOT NULL DEFAULT 'cover';
ALTER TABLE public.restaurant_deals ADD COLUMN IF NOT EXISTS image_fit text NOT NULL DEFAULT 'cover';
ALTER TABLE public.restaurant_photos ADD COLUMN IF NOT EXISTS image_fit text NOT NULL DEFAULT 'cover';

CREATE TABLE public.restaurant_submission_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_submission_id uuid NOT NULL REFERENCES public.restaurant_submissions(id) ON DELETE CASCADE,
  source text NOT NULL DEFAULT 'onboarding',
  changed_fields text[] NOT NULL DEFAULT '{}',
  changed_lists text[] NOT NULL DEFAULT '{}',
  snapshot jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.restaurant_submission_revisions TO anon, authenticated;
GRANT ALL ON public.restaurant_submission_revisions TO service_role;
ALTER TABLE public.restaurant_submission_revisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Revisions are readable by the internal tool" ON public.restaurant_submission_revisions FOR SELECT USING (true);
CREATE INDEX ON public.restaurant_submission_revisions (restaurant_submission_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.restaurant_submission_bundle(p_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'submission', (SELECT to_jsonb(s) FROM restaurant_submissions s WHERE s.id = p_id),
    'dishes', (SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.display_order), '[]') FROM restaurant_dishes x WHERE x.restaurant_submission_id = p_id),
    'deals', (SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.display_order), '[]') FROM restaurant_deals x WHERE x.restaurant_submission_id = p_id),
    'photos', (SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.display_order), '[]') FROM restaurant_photos x WHERE x.restaurant_submission_id = p_id),
    'menus', (SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.display_order), '[]') FROM restaurant_menus x WHERE x.restaurant_submission_id = p_id),
    'faqs', (SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.display_order), '[]') FROM restaurant_faqs x WHERE x.restaurant_submission_id = p_id)
  );
$$;

-- One transaction: snapshot old state, apply field changes (absent key = unchanged,
-- present key = new value, null/'' = removed), replace only the lists that are present.
CREATE OR REPLACE FUNCTION public.save_restaurant_submission(p_id uuid, p_fields jsonb, p_lists jsonb, p_source text DEFAULT 'onboarding')
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r restaurant_submissions;
  f jsonb := coalesce(p_fields, '{}'::jsonb) - 'id' - 'created_at' - 'updated_at' - 'status';
  l jsonb := coalesce(p_lists, '{}'::jsonb);
  sid uuid;
BEGIN
  -- NOT NULL text columns: a removal becomes an empty string
  f := f || (SELECT coalesce(jsonb_object_agg(k, ''), '{}'::jsonb) FROM jsonb_each(f) e(k, v)
             WHERE v = 'null'::jsonb AND k IN ('restaurant_name','address','email','story','delivery_areas','hours'));
  IF f ? 'custom_sections' AND f->'custom_sections' = 'null'::jsonb THEN f := f || '{"custom_sections": []}'; END IF;
  IF f ? 'image_display' AND f->'image_display' = 'null'::jsonb THEN f := f || '{"image_display": {}}'; END IF;

  IF p_id IS NOT NULL THEN
    SELECT * INTO r FROM restaurant_submissions WHERE id = p_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Submission % not found', p_id; END IF;
    INSERT INTO restaurant_submission_revisions (restaurant_submission_id, source, changed_fields, changed_lists, snapshot)
    VALUES (p_id, coalesce(p_source, 'onboarding'),
            ARRAY(SELECT jsonb_object_keys(f)), ARRAY(SELECT jsonb_object_keys(l)),
            restaurant_submission_bundle(p_id));
    r := jsonb_populate_record(r, f);
    UPDATE restaurant_submissions SET
      restaurant_name = r.restaurant_name, address = r.address, email = r.email, phone = r.phone,
      website = r.website, founded_year = r.founded_year, story = r.story, owner_quote = r.owner_quote,
      about_image_url = r.about_image_url, menu_pdf_url = r.menu_pdf_url, delivery_areas = r.delivery_areas,
      delivery_instructions = r.delivery_instructions, hours = r.hours, instagram = r.instagram,
      facebook = r.facebook, twitter = r.twitter, comments = r.comments, generated_site_url = r.generated_site_url,
      online_ordering_url = r.online_ordering_url, logo_url = r.logo_url, hero_image_url = r.hero_image_url,
      custom_sections = r.custom_sections, image_display = r.image_display
    WHERE id = p_id;
    sid := p_id;
  ELSE
    r := jsonb_populate_record(NULL::restaurant_submissions, f);
    INSERT INTO restaurant_submissions (restaurant_name, address, email, phone, website, founded_year, story,
      owner_quote, about_image_url, menu_pdf_url, delivery_areas, delivery_instructions, hours, instagram,
      facebook, twitter, comments, online_ordering_url, logo_url, hero_image_url, custom_sections, image_display)
    VALUES (coalesce(r.restaurant_name,''), coalesce(r.address,''), coalesce(r.email,''), r.phone, r.website,
      r.founded_year, coalesce(r.story,''), r.owner_quote, r.about_image_url, r.menu_pdf_url,
      coalesce(r.delivery_areas,''), r.delivery_instructions, coalesce(r.hours,''), r.instagram, r.facebook,
      r.twitter, r.comments, r.online_ordering_url, r.logo_url, r.hero_image_url,
      coalesce(r.custom_sections,'[]'), coalesce(r.image_display,'{}'))
    RETURNING id INTO sid;
  END IF;

  IF l ? 'dishes' THEN
    DELETE FROM restaurant_dishes WHERE restaurant_submission_id = sid;
    INSERT INTO restaurant_dishes (restaurant_submission_id, name, description, image_url, image_fit, display_order)
    SELECT sid, coalesce(x.name,''), coalesce(x.description,''), x.image_url, coalesce(x.image_fit,'cover'), (o - 1)::int
    FROM jsonb_to_recordset(coalesce(l->'dishes','[]')) WITH ORDINALITY AS x(name text, description text, image_url text, image_fit text, o bigint);
  END IF;
  IF l ? 'deals' THEN
    DELETE FROM restaurant_deals WHERE restaurant_submission_id = sid;
    INSERT INTO restaurant_deals (restaurant_submission_id, title, description, image_url, image_fit, display_order)
    SELECT sid, coalesce(x.title,''), coalesce(x.description,''), x.image_url, coalesce(x.image_fit,'cover'), (o - 1)::int
    FROM jsonb_to_recordset(coalesce(l->'deals','[]')) WITH ORDINALITY AS x(title text, description text, image_url text, image_fit text, o bigint);
  END IF;
  IF l ? 'photos' THEN
    DELETE FROM restaurant_photos WHERE restaurant_submission_id = sid;
    INSERT INTO restaurant_photos (restaurant_submission_id, image_url, image_fit, display_order)
    SELECT sid, x.image_url, coalesce(x.image_fit,'cover'), (o - 1)::int
    FROM jsonb_to_recordset(coalesce(l->'photos','[]')) WITH ORDINALITY AS x(image_url text, image_fit text, o bigint)
    WHERE x.image_url IS NOT NULL;
  END IF;
  IF l ? 'menus' THEN
    DELETE FROM restaurant_menus WHERE restaurant_submission_id = sid;
    INSERT INTO restaurant_menus (restaurant_submission_id, category, custom_category_name, menu_name, menu_url, display_order)
    SELECT sid, coalesce(x.category,'custom'), x.custom_category_name, coalesce(x.menu_name,'Menu'), x.menu_url, (o - 1)::int
    FROM jsonb_to_recordset(coalesce(l->'menus','[]')) WITH ORDINALITY AS x(category text, custom_category_name text, menu_name text, menu_url text, o bigint)
    WHERE x.menu_url IS NOT NULL;
  END IF;
  IF l ? 'faqs' THEN
    DELETE FROM restaurant_faqs WHERE restaurant_submission_id = sid;
    INSERT INTO restaurant_faqs (restaurant_submission_id, question, answer, display_order)
    SELECT sid, coalesce(x.question,''), coalesce(x.answer,''), (o - 1)::int
    FROM jsonb_to_recordset(coalesce(l->'faqs','[]')) WITH ORDINALITY AS x(question text, answer text, o bigint);
  END IF;

  RETURN sid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_restaurant_submission(uuid, jsonb, jsonb, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.restaurant_submission_bundle(uuid) TO anon, authenticated, service_role;