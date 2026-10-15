-- Run after the migration inside BEGIN / ROLLBACK. No records, files or emails persist.
-- Fixture verification is rolled back; the real account still verifies through its email.
UPDATE auth.users SET email_confirmed_at=now() WHERE lower(email)='brian@pureconcepts.com';
SELECT set_config('request.jwt.claim.sub','',true);
CREATE TEMP TABLE intake_test (id uuid, token uuid, staff_id uuid);
INSERT INTO intake_test(staff_id) SELECT id FROM auth.users WHERE lower(email)='brian@pureconcepts.com';
GRANT ALL ON intake_test TO anon, authenticated, service_role;
SET LOCAL ROLE anon;
DO $$ DECLARE result jsonb; n bigint; BEGIN
  IF public.is_onboarding_staff() THEN RAISE EXCEPTION 'Anonymous staff access'; END IF;
  BEGIN
    PERFORM count(*) FROM public.restaurant_submissions;
    RAISE EXCEPTION 'Anonymous submissions read allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    PERFORM public.restaurant_submission_bundle(gen_random_uuid());
    RAISE EXCEPTION 'Anonymous bundle read allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    PERFORM public.save_restaurant_submission(NULL,'{}','{}','test');
    RAISE EXCEPTION 'Anonymous staff writer allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    UPDATE public.restaurant_submissions SET phone='forbidden' WHERE false;
    RAISE EXCEPTION 'Anonymous update allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    DELETE FROM public.restaurant_faqs WHERE false;
    RAISE EXCEPTION 'Anonymous child delete allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    PERFORM * FROM public.restaurant_submissions_public;
    RAISE EXCEPTION 'Anonymous view read allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    PERFORM public.submit_restaurant_application('{"id":"00000000-0000-0000-0000-000000000000"}','{}');
    RAISE EXCEPTION 'Caller-selected id allowed';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  BEGIN
    PERFORM public.submit_restaurant_application('{}','{"faqs":{}}');
    RAISE EXCEPTION 'Malformed list allowed';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  result := public.submit_restaurant_application('{}','{}');
  UPDATE intake_test SET id=(result->>'id')::uuid, token=(result->>'notification_token')::uuid;
  IF (result->>'id') IS NULL OR (result->>'notification_token') IS NULL THEN RAISE EXCEPTION 'Blank form rejected'; END IF;
  -- Optional rich lists also use the same atomic insert path.
  PERFORM public.submit_restaurant_application('{"restaurant_name":"ROLLED BACK QA","email":""}',
    '{"dishes":[{"name":"QA dish"}],"faqs":[{"question":"QA?","answer":"Yes"}],"menus":[{"category":"lunch","menu_name":"QA","menu_url":"https://example.invalid/menu.pdf"}]}');
  BEGIN
    PERFORM public.claim_onboarding_notification(id,token) FROM intake_test;
    RAISE EXCEPTION 'Anonymous notification claim allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  INSERT INTO storage.objects(bucket_id,name) VALUES ('restaurant-images','qa/'||gen_random_uuid());
  SELECT count(*) INTO n FROM storage.objects WHERE bucket_id IN ('restaurant-images','restaurant-pdfs');
  IF n <> 0 THEN RAISE EXCEPTION 'Anonymous file listing allowed'; END IF;
END $$;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated","email":"brian@pureconcepts.com","user_metadata":{"role":"admin"}}',true);
DO $$ DECLARE n bigint; BEGIN
  IF public.is_onboarding_staff() THEN RAISE EXCEPTION 'Unapproved user became staff'; END IF;
  SELECT count(*) INTO n FROM public.restaurant_submissions;
  IF n<>0 THEN RAISE EXCEPTION 'Unapproved user read submissions'; END IF;
  UPDATE public.restaurant_submissions SET phone='forbidden' WHERE id=(SELECT id FROM intake_test);
  GET DIAGNOSTICS n=ROW_COUNT;
  IF n<>0 THEN RAISE EXCEPTION 'Unapproved user edited submission'; END IF;
  DELETE FROM public.restaurant_faqs WHERE restaurant_submission_id=(SELECT id FROM intake_test);
  GET DIAGNOSTICS n=ROW_COUNT;
  IF n<>0 THEN RAISE EXCEPTION 'Unapproved user deleted child'; END IF;
END $$;
SELECT set_config('request.jwt.claims',jsonb_build_object('sub',staff_id,'role','authenticated','amr',jsonb_build_array(jsonb_build_object('method','password')))::text,true) FROM intake_test;
DO $$ BEGIN
  IF public.is_onboarding_staff() THEN RAISE EXCEPTION 'Password-only staff session bypassed mailbox verification'; END IF;
END $$;
SELECT set_config('request.jwt.claims',jsonb_build_object('sub',staff_id,'role','authenticated','amr',jsonb_build_array(jsonb_build_object('method','otp')))::text,true) FROM intake_test;
DO $$ DECLARE n bigint; BEGIN
  IF NOT public.is_onboarding_staff() THEN RAISE EXCEPTION 'Approved staff denied'; END IF;
  SELECT count(*) INTO n FROM public.restaurant_submissions WHERE id=(SELECT id FROM intake_test);
  IF n<>1 THEN RAISE EXCEPTION 'Staff cannot read new application'; END IF;
  PERFORM public.save_restaurant_submission((SELECT id FROM intake_test),'{"phone":"QA rollback only"}','{}','test');
  SELECT count(*) INTO n FROM public.restaurant_submission_revisions WHERE restaurant_submission_id=(SELECT id FROM intake_test);
  IF n<>1 THEN RAISE EXCEPTION 'Staff edit did not preserve history'; END IF;
  BEGIN
    DELETE FROM public.restaurant_submission_revisions WHERE restaurant_submission_id=(SELECT id FROM intake_test);
    RAISE EXCEPTION 'Staff can erase history';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SET LOCAL ROLE service_role;
DO $$ BEGIN
  IF public.take_onboarding_login_slot('not-staff@example.invalid') THEN RAISE EXCEPTION 'Unknown email can request staff codes'; END IF;
  IF NOT public.take_onboarding_login_slot('brian@pureconcepts.com') THEN RAISE EXCEPTION 'Staff login slot unavailable'; END IF;
  IF public.take_onboarding_login_slot('brian@pureconcepts.com') THEN RAISE EXCEPTION 'Staff code send rate limit bypassed'; END IF;
  IF NOT public.claim_onboarding_notification((SELECT id FROM intake_test),(SELECT token FROM intake_test)) THEN RAISE EXCEPTION 'Creator capability rejected'; END IF;
  IF public.claim_onboarding_notification((SELECT id FROM intake_test),(SELECT token FROM intake_test)) THEN RAISE EXCEPTION 'Capability replay allowed'; END IF;
END $$;
RESET ROLE;
SELECT 'PASS: optional blank/rich forms, anonymous denial, unapproved-user denial, staff edits/history, storage listing denial, notification replay denial' AS result;
