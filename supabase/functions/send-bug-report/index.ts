import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const adminEmail = Deno.env.get("ADMIN_NOTIFICATION_EMAIL") || "keegan@sullivancreative.co";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BugReportRequest {
  description: string;
  userEmail?: string;
  userName?: string;
  currentPage: string;
  userAgent: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description, userEmail, userName, currentPage, userAgent }: BugReportRequest = await req.json();

    if (!description || description.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Bug description is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (description.length > 2000) {
      return new Response(
        JSON.stringify({ error: "Description must be less than 2000 characters" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Sending bug report email to:", adminEmail);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "AshTag <onboarding@resend.dev>",
        to: [adminEmail],
        subject: `🐛 Bug Report from ${userName || "Anonymous User"}`,
        html: `
          <h1>🐛 New Bug Report</h1>
          <p><strong>From:</strong> ${userName || "Anonymous"} (${userEmail || "No email provided"})</p>
          <p><strong>Page:</strong> ${currentPage}</p>
          <p><strong>Browser:</strong> ${userAgent}</p>
          <hr />
          <h2>Description</h2>
          <p>${description.replace(/\n/g, "<br>")}</p>
          <hr />
          <p style="color: #666; font-size: 12px;">Sent from Stick Pick bug reporter</p>
        `,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to send email");
    }

    const emailResponse = await res.json();

    console.log("Bug report email sent:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-bug-report function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
