import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  submissionId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting submission notification process");
    
    const { submissionId }: NotificationRequest = await req.json();
    console.log("Processing submission ID:", submissionId);

    // Create Supabase client with service role key for full access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    const [dishesResult, dealsResult, photosResult] = await Promise.all([
      supabase.from('restaurant_dishes').select('*').eq('restaurant_submission_id', submissionId).order('display_order'),
      supabase.from('restaurant_deals').select('*').eq('restaurant_submission_id', submissionId).order('display_order'),
      supabase.from('restaurant_photos').select('*').eq('restaurant_submission_id', submissionId).order('display_order')
    ]);

    // Construct complete JSON payload
    const completeSubmission = {
      ...submission,
      dishes: dishesResult.data || [],
      deals: dealsResult.data || [],
      photos: photosResult.data || [],
    };

    console.log("Sending email notification for:", submission.restaurant_name);

    // Create email with JSON attachment
    const emailResponse = await resend.emails.send({
      from: "Restaurant Submissions <onboarding@resend.dev>",
      to: ["brian@worklocal.ca"],
      subject: `New Restaurant Submission: ${submission.restaurant_name}`,
      html: `
        <h1>New Restaurant Submission Received!</h1>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2>${submission.restaurant_name}</h2>
          <p><strong>Address:</strong> ${submission.address}</p>
          <p><strong>Email:</strong> ${submission.email}</p>
          <p><strong>Phone:</strong> ${submission.phone || 'Not provided'}</p>
          <p><strong>Submitted:</strong> ${new Date(submission.created_at).toLocaleDateString()}</p>
        </div>
        
        <h3>Quick Stats:</h3>
        <ul>
          <li>Popular Dishes: ${completeSubmission.dishes.length}</li>
          <li>Special Deals: ${completeSubmission.deals.length}</li>
          <li>Photos: ${completeSubmission.photos.length}</li>
        </ul>
        
        <p>The complete submission data is attached as a JSON file.</p>
        
        <div style="margin: 30px 0;">
          <a href="https://wuufuewpbgciitslfvbl.supabase.co/admin/submission/${submissionId}" 
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
          content: Buffer.from(JSON.stringify(completeSubmission, null, 2)).toString('base64'),
        }
      ]
    });

    console.log("Email sent successfully:", emailResponse);

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
        error: error.message,
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