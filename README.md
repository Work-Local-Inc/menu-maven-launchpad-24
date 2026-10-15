# Menu.ca website onboarding

Public optional intake for restaurant websites, with a private staff dashboard.

- Canonical deployment: https://onboarding.menu.ca (Netlify site menu-onboarding).
- Client form: /onboarding. Every field is optional; existing websites/social links and menu files are useful starting material.
- Staff dashboard: /admin. Only brian@pureconcepts.com is approved. Use its emailed code; no public signup is needed for intake.
- Lovable project: https://lovable.dev/projects/5435f92b-60b8-4414-8da8-eb6db3e48176
- Supabase project wuufuewpbgciitslfvbl is shared with unrelated applications. Limit changes to onboarding resources.

## Development and checks

Use Node/npm, `npm ci`, `npm run build`, and `npx tsc --noEmit -p tsconfig.app.json`. Register local development with the fleet and use its .fleet URL; start Vite with `npm run dev -- --host 0.0.0.0`.

The security migration is `supabase/migrations/20261015185503_secure_client_onboarding.sql`. Run `supabase/tests/onboarding_access.sql` inside BEGIN/ROLLBACK after the migration: temporary QA fixtures and account verification are rolled back. These tests send no emails. Do not submit live test applications or request real login codes without authorization.

## Security and deployment

Apply the migration, deploy the three onboarding Edge Functions with JWT verification enabled, then publish the built dist directory to the existing Netlify site. Include public/_redirects and public/_headers in the build. Keep GitHub/Lovable source synchronized; publishing an old Lovable build would restore stale client behavior.

Public applications are create-only via submit_restaurant_application. Existing submissions, child rows, revisions, the public-named legacy view, and staff RPCs require a verified allowlisted account with email OTP authentication. Public users cannot look up or overwrite a restaurant by name. Staff reconcile duplicates. The authorization check reads trusted account data, not editable user metadata.

Uploads permit new UUID-named files only (10 MB maximum with image/PDF MIME restrictions); visitors cannot list, replace, or delete them. Existing restaurant-images and restaurant-pdfs buckets remain public to preserve published marketing assets. Do not upload confidential documents. They contain website/menu materials, not private submission records.

Notification delivery requires a one-use capability returned to the creator, or staff authorization. Login sends are allowlisted and throttled. Both mail functions use onboarding@send.menu.ca, verified on the existing Resend account. Submission notifications retain the existing brian@worklocal.ca recipient; staff sign-in codes go only to the approved pureconcepts mailbox. RESEND_API_KEY and Supabase service keys stay in the Edge Function environment.

Keep the previous Netlify deployment and DNS record as rollback evidence. Never restore anonymous read/update permissions as a rollback. If an application regression occurs, keep the database locked down and forward-fix or temporarily suspend intake. The old client cannot use the secured public save route.
