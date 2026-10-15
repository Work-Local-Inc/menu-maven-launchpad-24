import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { Resend } from 'npm:resend@2.0.0';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};
const accepted = () => new Response(JSON.stringify({ accepted: true }), { headers });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers });
  try {
    const { email } = await req.json();
    if (typeof email !== 'string' || email.length > 254) return accepted();
    const address = email.trim().toLowerCase();
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: allowed, error: slotError } = await admin.rpc('take_onboarding_login_slot', { p_email: address });
    if (slotError) throw new Error('Unable to check sign-in access');
    if (!allowed) return accepted();
    const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email: address });
    if (error || !data.properties?.email_otp) throw new Error('Unable to create sign-in code');
    // Deliver only to the server-approved mailbox. The code never goes in the HTTP response or logs.
    const { error: mailError } = await new Resend(Deno.env.get('RESEND_API_KEY')).emails.send({
      from: 'Menu.ca Onboarding <onboarding@send.menu.ca>',
      to: [address],
      subject: 'Your Menu.ca onboarding sign-in code',
      text: `Your sign-in code is ${data.properties.email_otp}. Enter it on the Menu.ca onboarding staff sign-in page. If you did not request this code, ignore this email.`,
    });
    if (mailError) throw new Error('Unable to deliver sign-in code');
    return accepted();
  } catch {
    return new Response(JSON.stringify({ error: 'Sign-in code delivery is unavailable. Please try again shortly.' }), { status: 503, headers });
  }
});
