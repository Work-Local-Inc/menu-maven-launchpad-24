-- Client forms are write-only; verified, explicitly allowed staff own all reads/edits.
CREATE SCHEMA IF NOT EXISTS onboarding_private;
REVOKE ALL ON SCHEMA onboarding_private FROM PUBLIC;
GRANT USAGE ON SCHEMA onboarding_private TO anon, authenticated, service_role;
CREATE TABLE onboarding_private.staff_access (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE
);
REVOKE ALL ON onboarding_private.staff_access FROM PUBLIC, anon, authenticated;
INSERT INTO onboarding_private.staff_access(user_id, email)
SELECT id, lower(email) FROM auth.users WHERE lower(email) = 'brian@pureconcepts.com';
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM onboarding_private.staff_access) THEN
    RAISE EXCEPTION 'The approved staff account must exist before securing onboarding';
  END IF;
END $$;
CREATE FUNCTION onboarding_private.is_staff() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM onboarding_private.staff_access a JOIN auth.users u ON u.id = a.user_id
    WHERE a.user_id = auth.uid() AND lower(u.email) = a.email
      AND u.email_confirmed_at IS NOT NULL AND u.deleted_at IS NULL
      AND coalesce(auth.jwt()->'amr','[]'::jsonb) @> '[{"method":"otp"}]'::jsonb
      AND (u.banned_until IS NULL OR u.banned_until <= now())
  );
$$;
REVOKE ALL ON FUNCTION onboarding_private.is_staff() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION onboarding_private.is_staff() TO anon, authenticated, service_role;
CREATE FUNCTION public.is_onboarding_staff() RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT onboarding_private.is_staff();
$$;
REVOKE ALL ON FUNCTION public.is_onboarding_staff() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_onboarding_staff() TO anon, authenticated, service_role;

DO $$ DECLARE t text; p record; BEGIN
  FOREACH t IN ARRAY ARRAY['restaurant_submissions','restaurant_dishes','restaurant_deals',
    'restaurant_photos','restaurant_menus','restaurant_faqs','restaurant_submission_revisions'] LOOP
    FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP
      EXECUTE format('DROP POLICY %I ON public.%I',p.policyname,t);
    END LOOP;
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon, authenticated',t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated',t);
    EXECUTE format('CREATE POLICY onboarding_staff ON public.%I FOR ALL TO authenticated USING ((SELECT onboarding_private.is_staff())) WITH CHECK ((SELECT onboarding_private.is_staff()))',t);
  END LOOP;
END $$;
-- History remains append-only, including for staff.
REVOKE UPDATE, DELETE ON public.restaurant_submission_revisions FROM authenticated;
REVOKE ALL ON public.restaurant_submissions_public FROM PUBLIC, anon, authenticated;
ALTER VIEW public.restaurant_submissions_public SET (security_invoker = true);
GRANT SELECT ON public.restaurant_submissions_public TO authenticated;
REVOKE ALL ON FUNCTION public.restaurant_submission_bundle(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.save_restaurant_submission(uuid,jsonb,jsonb,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.restaurant_submission_bundle(uuid), public.save_restaurant_submission(uuid,jsonb,jsonb,text) TO authenticated, service_role;

CREATE TABLE onboarding_private.notification_keys (
  submission_id uuid PRIMARY KEY REFERENCES public.restaurant_submissions(id) ON DELETE CASCADE,
  token uuid NOT NULL DEFAULT gen_random_uuid(),
  claimed_at timestamptz
);
REVOKE ALL ON onboarding_private.notification_keys FROM PUBLIC, anon, authenticated;

-- The only anonymous database write: create a NEW application, never choose a target id.
-- The definer is private; its exposed wrapper is an invoker. No arbitrary SQL or table names.
CREATE FUNCTION onboarding_private.submit_application(p_fields jsonb, p_lists jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE sid uuid; tok uuid; f jsonb := coalesce(p_fields,'{}'); l jsonb := coalesce(p_lists,'{}'); pair record;
BEGIN
  IF jsonb_typeof(f) <> 'object' OR jsonb_typeof(l) <> 'object'
    OR octet_length(f::text) + octet_length(l::text) > 262144 THEN
    RAISE EXCEPTION 'Invalid application size or shape' USING ERRCODE='22023';
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_object_keys(f) k WHERE k NOT IN (
    'restaurant_name','address','email','phone','website','founded_year','story','owner_quote',
    'about_image_url','menu_pdf_url','delivery_areas','delivery_instructions','hours','instagram',
    'facebook','twitter','comments','online_ordering_url','logo_url','hero_image_url','custom_sections','image_display')) THEN
    RAISE EXCEPTION 'Unsupported application field' USING ERRCODE='22023';
  END IF;
  FOR pair IN SELECT * FROM jsonb_each(l) LOOP
    IF pair.key NOT IN ('dishes','deals','photos','menus','faqs') OR jsonb_typeof(pair.value) <> 'array' THEN
      RAISE EXCEPTION 'Invalid application list' USING ERRCODE='22023';
    END IF;
    IF jsonb_array_length(pair.value) > 100 THEN
      RAISE EXCEPTION 'Too many application items' USING ERRCODE='22023';
    END IF;
  END LOOP;
  sid := public.save_restaurant_submission(NULL, f, l, 'public-onboarding');
  INSERT INTO onboarding_private.notification_keys(submission_id) VALUES (sid) RETURNING token INTO tok;
  RETURN jsonb_build_object('id',sid,'notification_token',tok);
END;
$$;
REVOKE ALL ON FUNCTION onboarding_private.submit_application(jsonb,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION onboarding_private.submit_application(jsonb,jsonb) TO anon, authenticated, service_role;
CREATE FUNCTION public.submit_restaurant_application(p_fields jsonb DEFAULT '{}', p_lists jsonb DEFAULT '{}') RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  SELECT onboarding_private.submit_application(p_fields,p_lists);
$$;
REVOKE ALL ON FUNCTION public.submit_restaurant_application(jsonb,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_restaurant_application(jsonb,jsonb) TO anon, authenticated, service_role;

-- Only the notification worker can consume the one-time capability returned to its creator.
CREATE FUNCTION public.claim_onboarding_notification(p_id uuid, p_token uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE claimed uuid;
BEGIN
  UPDATE onboarding_private.notification_keys SET claimed_at=now()
    WHERE submission_id=p_id AND token=p_token AND claimed_at IS NULL
    RETURNING submission_id INTO claimed;
  RETURN claimed IS NOT NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_onboarding_notification(uuid,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_onboarding_notification(uuid,uuid) TO service_role;

-- Published marketing images retain their working URLs; visitors cannot list, replace or delete files.
DO $$ DECLARE p record; BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='storage' AND tablename='objects'
    AND (coalesce(qual,'') || coalesce(with_check,'')) ~ 'restaurant-(images|pdfs)' LOOP
    EXECUTE format('DROP POLICY %I ON storage.objects',p.policyname);
  END LOOP;
END $$;
CREATE POLICY onboarding_upload_new ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id IN ('restaurant-images','restaurant-pdfs'));
CREATE POLICY onboarding_staff_files ON storage.objects FOR ALL TO authenticated
  USING (bucket_id IN ('restaurant-images','restaurant-pdfs') AND (SELECT onboarding_private.is_staff()))
  WITH CHECK (bucket_id IN ('restaurant-images','restaurant-pdfs') AND (SELECT onboarding_private.is_staff()));
UPDATE storage.buckets SET file_size_limit=10485760,
  allowed_mime_types=CASE WHEN id='restaurant-pdfs' THEN ARRAY['application/pdf']
    ELSE ARRAY['image/jpeg','image/png','image/webp','image/gif'] END
  WHERE id IN ('restaurant-images','restaurant-pdfs');

ALTER FUNCTION public.save_restaurant_submission(uuid,jsonb,jsonb,text) SET search_path = public, pg_temp;
ALTER FUNCTION public.restaurant_submission_bundle(uuid) SET search_path = public, pg_temp;

-- Fix the existing writer: typed records go inside ROWS FROM with ordinality.
CREATE OR REPLACE FUNCTION public.save_restaurant_submission(p_id uuid, p_fields jsonb, p_lists jsonb, p_source text DEFAULT 'onboarding')
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
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
    FROM ROWS FROM (jsonb_to_recordset(coalesce(l->'dishes','[]')) AS (name text, description text, image_url text, image_fit text)) WITH ORDINALITY AS x(name, description, image_url, image_fit, o);
  END IF;
  IF l ? 'deals' THEN
    DELETE FROM restaurant_deals WHERE restaurant_submission_id = sid;
    INSERT INTO restaurant_deals (restaurant_submission_id, title, description, image_url, image_fit, display_order)
    SELECT sid, coalesce(x.title,''), coalesce(x.description,''), x.image_url, coalesce(x.image_fit,'cover'), (o - 1)::int
    FROM ROWS FROM (jsonb_to_recordset(coalesce(l->'deals','[]')) AS (title text, description text, image_url text, image_fit text)) WITH ORDINALITY AS x(title, description, image_url, image_fit, o);
  END IF;
  IF l ? 'photos' THEN
    DELETE FROM restaurant_photos WHERE restaurant_submission_id = sid;
    INSERT INTO restaurant_photos (restaurant_submission_id, image_url, image_fit, display_order)
    SELECT sid, x.image_url, coalesce(x.image_fit,'cover'), (o - 1)::int
    FROM ROWS FROM (jsonb_to_recordset(coalesce(l->'photos','[]')) AS (image_url text, image_fit text)) WITH ORDINALITY AS x(image_url, image_fit, o)
    WHERE x.image_url IS NOT NULL;
  END IF;
  IF l ? 'menus' THEN
    DELETE FROM restaurant_menus WHERE restaurant_submission_id = sid;
    INSERT INTO restaurant_menus (restaurant_submission_id, category, custom_category_name, menu_name, menu_url, display_order)
    SELECT sid, coalesce(x.category,'custom'), x.custom_category_name, coalesce(x.menu_name,'Menu'), x.menu_url, (o - 1)::int
    FROM ROWS FROM (jsonb_to_recordset(coalesce(l->'menus','[]')) AS (category text, custom_category_name text, menu_name text, menu_url text)) WITH ORDINALITY AS x(category, custom_category_name, menu_name, menu_url, o)
    WHERE x.menu_url IS NOT NULL;
  END IF;
  IF l ? 'faqs' THEN
    DELETE FROM restaurant_faqs WHERE restaurant_submission_id = sid;
    INSERT INTO restaurant_faqs (restaurant_submission_id, question, answer, display_order)
    SELECT sid, coalesce(x.question,''), coalesce(x.answer,''), (o - 1)::int
    FROM ROWS FROM (jsonb_to_recordset(coalesce(l->'faqs','[]')) AS (question text, answer text)) WITH ORDINALITY AS x(question, answer, o);
  END IF;

  RETURN sid;
END;
$$;

-- Staff sign-in sends a code only to the approved mailbox, with a per-mailbox send limit.
CREATE TABLE onboarding_private.login_limits (
  email text PRIMARY KEY,
  window_start timestamptz NOT NULL DEFAULT now(),
  last_sent_at timestamptz NOT NULL DEFAULT now(),
  sends integer NOT NULL DEFAULT 1
);
REVOKE ALL ON onboarding_private.login_limits FROM PUBLIC, anon, authenticated;
CREATE FUNCTION onboarding_private.take_login_slot(p_email text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE selected text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM onboarding_private.staff_access a JOIN auth.users u ON u.id=a.user_id
    WHERE a.email=lower(p_email) AND lower(u.email)=a.email AND u.deleted_at IS NULL
      AND (u.banned_until IS NULL OR u.banned_until<=now())) THEN RETURN false; END IF;
  INSERT INTO onboarding_private.login_limits(email) VALUES(lower(p_email))
  ON CONFLICT(email) DO UPDATE SET
    window_start=CASE WHEN login_limits.window_start<now()-interval '1 hour' THEN now() ELSE login_limits.window_start END,
    sends=CASE WHEN login_limits.window_start<now()-interval '1 hour' THEN 1 ELSE login_limits.sends+1 END,
    last_sent_at=now()
  WHERE login_limits.last_sent_at<now()-interval '1 minute'
    AND (login_limits.sends<6 OR login_limits.window_start<now()-interval '1 hour')
  RETURNING email INTO selected;
  RETURN selected IS NOT NULL;
END;
$$;
REVOKE ALL ON FUNCTION onboarding_private.take_login_slot(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION onboarding_private.take_login_slot(text) TO service_role;
CREATE FUNCTION public.take_onboarding_login_slot(p_email text) RETURNS boolean
LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  SELECT onboarding_private.take_login_slot(p_email);
$$;
REVOKE ALL ON FUNCTION public.take_onboarding_login_slot(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.take_onboarding_login_slot(text) TO service_role;
