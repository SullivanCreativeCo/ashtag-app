import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Get the Sunday that starts the current week (Sunday-based weeks)
function getCurrentWeekStart(): string {
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0 = Sunday
  const diff = now.getUTCDate() - dayOfWeek;
  const sunday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), diff));
  return sunday.toISOString().split("T")[0];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const weekStart = getCurrentWeekStart();
    console.log("Current week start:", weekStart);

    // Check if we already have a pick for this week
    const { data: existingPick, error: fetchError } = await supabase
      .from("weekly_picks")
      .select(`
        id,
        week_start,
        cigar:cigars(
          id, brand, line, vitola, size, wrapper, binder, filler, origin, strength_profile, image_url
        )
      `)
      .eq("week_start", weekStart)
      .maybeSingle();

    if (fetchError) throw fetchError;

    // If we have a pick for this week, return it with its image
    if (existingPick && existingPick.cigar) {
      // Fetch the primary band image for this cigar
      const { data: bandImage } = await supabase
        .from("cigar_band_images")
        .select("image_url")
        .eq("cigar_id", (existingPick.cigar as any).id)
        .eq("is_primary", true)
        .maybeSingle();

      return new Response(
        JSON.stringify({
          cigar: existingPick.cigar,
          bandImageUrl: bandImage?.image_url || null,
          weekStart: existingPick.week_start,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // No pick for this week - select a random cigar
    // First, get cigars that have band images (preferred)
    const { data: cigarsWithImages, error: cigarsError } = await supabase
      .from("cigars")
      .select(`
        id, brand, line, vitola, size, wrapper, binder, filler, origin, strength_profile, image_url,
        cigar_band_images!inner(image_url, is_primary)
      `)
      .eq("cigar_band_images.is_primary", true);

    if (cigarsError) throw cigarsError;

    let selectedCigar: any;
    let bandImageUrl: string | null = null;

    if (cigarsWithImages && cigarsWithImages.length > 0) {
      // Pick random cigar that has a band image
      const randomIndex = Math.floor(Math.random() * cigarsWithImages.length);
      const chosen = cigarsWithImages[randomIndex];
      bandImageUrl = chosen.cigar_band_images?.[0]?.image_url || null;
      
      // Remove the nested cigar_band_images from the response
      const { cigar_band_images, ...cigarData } = chosen;
      selectedCigar = cigarData;
    } else {
      // Fallback: pick any random cigar
      const { data: allCigars, error: allError } = await supabase
        .from("cigars")
        .select("id, brand, line, vitola, size, wrapper, binder, filler, origin, strength_profile, image_url");

      if (allError) throw allError;
      if (!allCigars || allCigars.length === 0) {
        return new Response(
          JSON.stringify({ error: "No cigars in database" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const randomIndex = Math.floor(Math.random() * allCigars.length);
      selectedCigar = allCigars[randomIndex];
    }

    // Save this as the weekly pick
    const { error: insertError } = await supabase
      .from("weekly_picks")
      .insert({ cigar_id: selectedCigar.id, week_start: weekStart });

    if (insertError) {
      console.error("Failed to save weekly pick:", insertError);
      // Continue anyway - we can still return the pick
    }

    console.log("Selected new weekly pick:", selectedCigar.brand, selectedCigar.line);

    return new Response(
      JSON.stringify({
        cigar: selectedCigar,
        bandImageUrl,
        weekStart,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in get-weekly-pick:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
