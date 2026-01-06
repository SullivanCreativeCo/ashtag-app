import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication - JWT is verified by Supabase, but we double-check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "Image data is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate image size (limit to ~7.5MB base64 which is about 5MB raw)
    if (imageBase64.length > 10_000_000) {
      return new Response(
        JSON.stringify({ error: "Image too large. Please use a smaller image." }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all cigars with their reference images
    const { data: cigarsWithImages, error: fetchError } = await supabase
      .from("cigars")
      .select(`
        id,
        brand,
        line,
        vitola,
        wrapper,
        strength_profile,
        origin,
        cigar_band_images(id, image_url, is_primary)
      `)
      .order("brand");

    if (fetchError) {
      console.error("Error fetching cigars:", fetchError);
      throw new Error("Failed to fetch cigar database");
    }

    // Build a description of cigars with reference images for the AI
    const cigarsWithRefs = cigarsWithImages?.filter(
      (c) => c.cigar_band_images && c.cigar_band_images.length > 0
    ) || [];

    // Use AI vision to analyze the captured image and match against reference descriptions
    const systemPrompt = `You are a cigar band recognition expert. Your task is to analyze a photo of a cigar band and identify the cigar from a database.

CRITICAL: Read ALL text visible on the cigar band very carefully:
- Brand name (usually the largest, most prominent text)
- Line/Series name (often smaller, positioned below or above the brand)
- Country of origin (e.g., "Nicaragua", "Honduras", "Dominican Republic")
- Any numbers, dates, or edition info
- "Hecho a Mano" means handmade
- Look for wrapper color indicators (Maduro = dark, Connecticut = light)

MATCHING STRATEGY:
1. Extract the exact brand name from the band
2. Look for an exact match in the database brands
3. Then match the line/series name
4. Consider wrapper color and origin as secondary matches
5. If the band shows "Padron", look for ALL Padron cigars in the database
6. Match text case-insensitively

CONFIDENCE SCORING:
- 90-100%: Exact brand AND line match visible on band
- 70-89%: Brand match with probable line based on visual elements  
- 50-69%: Brand match but unclear line
- Below 50%: Uncertain match

Always return your top 3 best matches from the database, even if confidence is low.

Respond ONLY with valid JSON in this exact format:
{
  "identified": true/false,
  "confidence": 0-100,
  "extractedInfo": {
    "brand": "extracted brand name or null",
    "line": "extracted line name or null", 
    "otherText": "any other visible text"
  },
  "matches": [
    {
      "cigarId": "uuid from database",
      "brand": "brand name from database",
      "line": "line name from database",
      "vitola": "vitola from database",
      "confidence": 0-100,
      "matchReason": "specific text/visual elements that match"
    }
  ]
}`;

    // Build the cigar database context
    const cigarContext = cigarsWithImages?.map((c) => ({
      id: c.id,
      brand: c.brand,
      line: c.line,
      vitola: c.vitola,
      wrapper: c.wrapper,
      strength: c.strength_profile,
      origin: c.origin,
      hasReferenceImage: c.cigar_band_images && c.cigar_band_images.length > 0,
    }));

    const userPrompt = `Here is the cigar database to match against:
${JSON.stringify(cigarContext, null, 2)}

Please analyze the attached cigar band image and identify which cigar it belongs to from this database. Look at the text, logos, colors, and design elements on the band.`;

    console.log("Sending image to AI for analysis...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64.startsWith("data:") 
                    ? imageBase64 
                    : `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    console.log("AI response:", content);

    // Parse the JSON response
    let result;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      result = {
        identified: false,
        confidence: 0,
        extractedInfo: { brand: null, line: null, otherText: content },
        matches: [],
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in match-cigar-band:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
