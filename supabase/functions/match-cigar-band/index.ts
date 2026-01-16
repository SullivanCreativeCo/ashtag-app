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
    // Initialize Supabase client for auth verification
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create client with user's auth token
    const authHeader = req.headers.get("Authorization");

    // Check if auth header exists and is properly formatted
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authentication required. Please log in." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const token = authHeader.slice("Bearer ".length).trim();

    // Quick sanity check (must look like a JWT)
    const tokenParts = token.split(".");
    if (tokenParts.length !== 3) {
      return new Response(
        JSON.stringify({ error: "Session expired. Please log in again." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Decode JWT payload to detect anon key usage (anon JWTs don't include `sub`)
    const decodeJwtPayload = (jwt: string) => {
      const payload = jwt.split(".")[1];
      const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64 + "===".slice((base64.length + 3) % 4);
      const json = atob(padded);
      return JSON.parse(json) as Record<string, unknown>;
    };

    let payload: Record<string, unknown> | null = null;
    try {
      payload = decodeJwtPayload(token);
    } catch {
      payload = null;
    }

    if (payload && payload["role"] === "anon" && !payload["sub"]) {
      return new Response(
        JSON.stringify({ error: "You must be signed in to scan a band." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const userId = typeof payload?.["sub"] === "string" ? (payload!["sub"] as string) : null;
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "You must be signed in to scan a band." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Verify the user is authenticated (server-side)
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Session expired. Please log in again." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log("Authenticated user:", userId);

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

    // Create service role client for database access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    const systemPrompt = `You are a cigar band recognition expert. Your task is to analyze a photo of a cigar and identify it from a database.

CRITICAL: Analyze BOTH the cigar band AND the cigar shape:

BAND ANALYSIS - Read ALL text visible on the cigar band:
- Brand name (usually the largest, most prominent text)
- Line/Series name (often smaller, positioned below or above the brand)
- Country of origin (e.g., "Nicaragua", "Honduras", "Dominican Republic")
- Any numbers, dates, or edition info
- "Hecho a Mano" means handmade
- Look for wrapper color indicators (Maduro = dark, Connecticut = light)

SHAPE/VITOLA ANALYSIS - Look at the cigar body:
- TORPEDO/BELICOSO: Tapered, pointed head (not flat cut)
- FIGURADO/PERFECTO: Tapered at both ends
- ROBUSTO: Short and thick, flat head (typically 5" x 50)
- TORO: Medium length, flat head (typically 6" x 50-52)
- CHURCHILL: Long and elegant, flat head (typically 7" x 48)
- CORONA: Thinner, classic size, flat head
- GORDO/60 RING: Very thick ring gauge
- LANCERO/PANATELA: Long and thin

The SHAPE is critical for matching the correct vitola. A torpedo tip means it's a Torpedo, Belicoso, or similar pointed vitola.

MATCHING STRATEGY:
1. Extract the exact brand name from the band
2. Identify the cigar shape from the body
3. Match brand + shape to find the correct vitola in the database
4. Consider wrapper color and origin as secondary matches
5. Match text case-insensitively

CONFIDENCE SCORING:
- 90-100%: Exact brand AND line match with correct vitola shape
- 70-89%: Brand match with shape match but uncertain line
- 50-69%: Brand match but unclear line or shape
- Below 50%: Uncertain match

IMPORTANT: If no good match is found (confidence below 50%), set "suggestAddToDatabase" to true and provide your best guess for the cigar info based on what you can read on the band.

Always return your top 3 best matches from the database, even if confidence is low.

Respond ONLY with valid JSON in this exact format:
{
  "identified": true/false,
  "confidence": 0-100,
  "extractedInfo": {
    "brand": "extracted brand name or null",
    "line": "extracted line name or null",
    "shape": "detected shape (torpedo, robusto, toro, etc.) or null",
    "wrapper": "detected wrapper type (maduro, connecticut, habano, etc.) or null",
    "origin": "detected origin country or null",
    "otherText": "any other visible text"
  },
  "suggestAddToDatabase": true/false,
  "suggestedCigar": {
    "brand": "best guess brand name",
    "line": "best guess line name",
    "vitola": "detected vitola/shape",
    "wrapper": "detected wrapper or null",
    "origin": "detected origin or null"
  },
  "matches": [
    {
      "cigarId": "uuid from database",
      "brand": "brand name from database",
      "line": "line name from database",
      "vitola": "vitola from database",
      "confidence": 0-100,
      "matchReason": "specific text/visual elements AND shape that match"
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
