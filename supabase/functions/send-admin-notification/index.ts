import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const adminEmail = Deno.env.get("ADMIN_NOTIFICATION_EMAIL");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  type: "new_cigar_request" | "new_user_signup";
  data: Record<string, unknown>;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: NotificationPayload = await req.json();
    console.log("Received notification request:", payload.type);

    if (!adminEmail) {
      console.error("ADMIN_NOTIFICATION_EMAIL not configured");
      return new Response(
        JSON.stringify({ error: "Admin email not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let subject: string;
    let htmlContent: string;

    if (payload.type === "new_cigar_request") {
      const { requested_name, user_email, details, vitola, wrapper, origin } = payload.data as {
        requested_name: string;
        user_email?: string;
        details?: string;
        vitola?: string;
        wrapper?: string;
        origin?: string;
      };

      subject = `🚬 New Cigar Request: ${requested_name}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #B8860B; border-bottom: 2px solid #B8860B; padding-bottom: 10px;">
            New Cigar Request Submitted
          </h1>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #333;">${requested_name}</h2>
            ${vitola ? `<p><strong>Vitola:</strong> ${vitola}</p>` : ''}
            ${wrapper ? `<p><strong>Wrapper:</strong> ${wrapper}</p>` : ''}
            ${origin ? `<p><strong>Origin:</strong> ${origin}</p>` : ''}
            ${details ? `<p><strong>Details:</strong> ${details}</p>` : ''}
            ${user_email ? `<p><strong>Submitted by:</strong> ${user_email}</p>` : ''}
          </div>
          <p style="color: #666; font-size: 14px;">
            Log in to the AshTag admin panel to review and approve this request.
          </p>
        </div>
      `;
    } else if (payload.type === "new_user_signup") {
      const { email, display_name, created_at } = payload.data as {
        email?: string;
        display_name?: string;
        created_at?: string;
      };

      subject = `👤 New User Signup: ${display_name || email || 'Unknown'}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #B8860B; border-bottom: 2px solid #B8860B; padding-bottom: 10px;">
            New User Joined AshTag
          </h1>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            ${display_name ? `<p><strong>Display Name:</strong> ${display_name}</p>` : ''}
            ${email ? `<p><strong>Email:</strong> ${email}</p>` : ''}
            ${created_at ? `<p><strong>Signed Up:</strong> ${new Date(created_at).toLocaleString()}</p>` : ''}
          </div>
          <p style="color: #666; font-size: 14px;">
            Welcome them to the AshTag community! 🎉
          </p>
        </div>
      `;
    } else {
      return new Response(
        JSON.stringify({ error: "Unknown notification type" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Sending email to:", adminEmail);
    const emailResponse = await resend.emails.send({
      from: "AshTag <onboarding@resend.dev>",
      to: [adminEmail],
      subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-admin-notification function:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
