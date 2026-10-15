import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { Resend } from "npm:resend@2.0.0";
import { encodeBase64 } from "jsr:@std/encoding@1/base64";

// Older submissions stored FAQs as "...\n\nFAQs:\n[json]" inside comments
function splitLegacyFaqs(comments?: string | null) {
  if (!comments) return { comments: "", faqs: [] as { question: string; answer: string }[] };
  const idx = comments.search(/(^|\n)FAQs:\s*\n?\s*\[/);
  if (idx === -1) return { comments, faqs: [] };
  try {
    const parsed = JSON.parse(comments.slice(comments.indexOf("[", idx)));
    return { comments: comments.slice(0, idx).trim(), faqs: Array.isArray(parsed) ? parsed.map((f: any) => ({ question: String(f.question || ""), answer: String(f.answer || "") })) : [] };
  } catch { return { comments, faqs: [] }; }
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  submissionId: string;
  notificationToken?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting submission notification process");

    const { submissionId, notificationToken }: NotificationRequest = await req.json();
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuid.test(submissionId || '')) return new Response('Invalid request', { status: 400, headers: corsHeaders });
    console.log("Processing submission ID:", submissionId);

    // Create Supabase client with service role key for full access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // A public visitor can notify only once for the application they just created.
    const caller = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') || '' } },
    });
    const { data: staff, error: staffError } = await caller.rpc('is_onboarding_staff');
    if (staffError || staff !== true) {
      if (!uuid.test(notificationToken || '')) return new Response('Not authorized', { status: 403, headers: corsHeaders });
      const { data: claimed, error } = await supabase.rpc('claim_onboarding_notification', {
        p_id: submissionId, p_token: notificationToken,
      });
      if (error || claimed !== true) return new Response('Not authorized', { status: 403, headers: corsHeaders });
    }

    // Fetch the main submission
    const { data: submission, error: submissionError } = await supabase
      .from('restaurant_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (submissionError || !submission) {
      console.error("Error fetching submission:", submissionError);
      throw new Error("Failed to fetch submission");
    }

    // Fetch related data
    const [dishesResult, dealsResult, photosResult, menusResult, faqsResult] = await Promise.all([
      supabase.from('restaurant_dishes').select('*').eq('restaurant_submission_id', submissionId).order('display_order'),
      supabase.from('restaurant_deals').select('*').eq('restaurant_submission_id', submissionId).order('display_order'),
      supabase.from('restaurant_photos').select('*').eq('restaurant_submission_id', submissionId).order('display_order'),
      supabase.from('restaurant_menus').select('*').eq('restaurant_submission_id', submissionId).order('display_order'),
      supabase.from('restaurant_faqs').select('*').eq('restaurant_submission_id', submissionId).order('display_order'),
    ]);
    const legacy = splitLegacyFaqs(submission.comments);
    const tableFaqs = (faqsResult.data || []).map((f: any) => ({ question: f.question, answer: f.answer }));
    const seen = new Set(tableFaqs.map((f: any) => f.question.trim().toLowerCase()));
    const allFaqs = [...tableFaqs, ...legacy.faqs.filter((f) => !seen.has(f.question.trim().toLowerCase()))];

    // Construct complete JSON payload
    const completeSubmission = {
      ...submission,
      comments: legacy.comments,
      image_display_note: "image_fit / image_display: 'cover' = cropping allowed, 'contain' = show the full image, never crop",
      menus: menusResult.data || [],
      faqs: allFaqs,
      dishes: dishesResult.data || [],
      deals: dealsResult.data || [],
      photos: photosResult.data || [],
    };

    console.log("Sending email notification for:", submission.restaurant_name);

    const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]!));

    // Create email with JSON attachment
    const emailResponse = await resend.emails.send({
      from: "Restaurant Submissions <onboarding@send.menu.ca>",
      to: ["brian@worklocal.ca"],
      subject: `New Restaurant Submission: ${String(submission.restaurant_name).replace(/[\r\n]/g, " ")}`,
      html: `
        <h1>New Restaurant Submission Received!</h1>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2>${escapeHtml(submission.restaurant_name)}</h2>
          <p><strong>Address:</strong> ${escapeHtml(submission.address)}</p>
          <p><strong>Email:</strong> ${escapeHtml(submission.email)}</p>
          <p><strong>Phone:</strong> ${escapeHtml(submission.phone || 'Not provided')}</p>
          <p><strong>Submitted:</strong> ${new Date(submission.created_at).toLocaleDateString()}</p>
        </div>

        <h3>Quick Stats:</h3>
        <ul>
          <li>Popular Dishes: ${completeSubmission.dishes.length}</li>
          <li>Special Deals: ${completeSubmission.deals.length}</li>
          <li>Photos: ${completeSubmission.photos.length}</li>
          <li>Menus: ${completeSubmission.menus.length}</li>
          <li>FAQs: ${completeSubmission.faqs.length}</li>
        </ul>

        <p>The complete submission data is attached as a JSON file.</p>

        <div style="margin: 30px 0;">
          <a href="https://menu-onboarding.netlify.app/admin/submission/${submissionId}"
             style="background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Full Details in Admin Dashboard
          </a>
        </div>

        <p style="color: #666; font-size: 14px;">
          This is an automated notification from your restaurant onboarding system.
        </p>
      `,
      attachments: [
        {
          filename: `${submission.restaurant_name.replace(/[^a-zA-Z0-9]/g, '_')}_submission.json`,
          content: encodeBase64(new TextEncoder().encode(JSON.stringify(completeSubmission, null, 2))),
        }
      ]
    });

    if (emailResponse.error) throw new Error('Notification delivery failed');
    console.log("Notification delivered");

    return new Response(
      JSON.stringify({
        success: true,
        emailId: emailResponse.data?.id,
        message: "Notification sent successfully"
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error("Error in send-submission-notification function:", error);
    return new Response(
      JSON.stringify({
        error: "Notification could not be delivered",
        success: false
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
