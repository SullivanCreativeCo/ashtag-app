import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");

    if (!firecrawlApiKey) {
      return new Response(
        JSON.stringify({ error: "Firecrawl connector not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify admin access
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check admin role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, searchQuery, country, ringSize } = await req.json();

    if (action === "search") {
      // Search Elite Cigar Library
      let url = "https://www.elitecigarlibrary.com/search";
      const params = new URLSearchParams();
      if (searchQuery) params.set("name", searchQuery);
      if (country) params.set("country", country);
      if (ringSize) params.set("ring", ringSize);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      console.log("Scraping URL:", url);

      const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${firecrawlApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          formats: ["markdown", "html"],
          onlyMainContent: true,
          waitFor: 3000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Firecrawl error:", errorText);
        return new Response(
          JSON.stringify({ error: "Failed to scrape website" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const scrapeData = await response.json();
      
      // Use AI to extract structured cigar data from the scraped content
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        return new Response(
          JSON.stringify({ error: "AI not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const extractPrompt = `Extract cigar data from this webpage content. Return a JSON array of cigars found.

Each cigar should have:
- name: Full cigar name
- brand: Brand/manufacturer name
- line: Line/series name (if distinguishable from brand)
- vitola: Size/shape name (e.g., Robusto, Toro, Churchill)
- origin: Country of origin
- ringGauge: Ring gauge number (if available)
- length: Length in inches (if available)
- wrapper: Wrapper type (if available)
- description: Brief description (if available)

Content to parse:
${scrapeData.data?.markdown || scrapeData.markdown || "No content found"}

Return ONLY valid JSON array, no other text.`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "You are a data extraction expert. Extract structured cigar data from webpage content." },
            { role: "user", content: extractPrompt },
          ],
        }),
      });

      if (!aiResponse.ok) {
        console.error("AI extraction failed");
        return new Response(
          JSON.stringify({ 
            success: true, 
            rawContent: scrapeData.data?.markdown || scrapeData.markdown,
            cigars: [] 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const aiData = await aiResponse.json();
      const content = aiData.choices?.[0]?.message?.content || "[]";
      
      let cigars = [];
      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          cigars = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error("Failed to parse AI response:", e);
      }

      return new Response(
        JSON.stringify({ success: true, cigars, rawContent: scrapeData.data?.markdown || scrapeData.markdown }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in scrape-cigars:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
