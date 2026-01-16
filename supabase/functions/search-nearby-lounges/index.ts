import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PlaceResult {
  place_id: string;
  name: string;
  vicinity: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  opening_hours?: {
    open_now?: boolean;
  };
  photos?: Array<{
    photo_reference: string;
  }>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication with proper JWT validation
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate the token server-side
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log('Authenticated user:', user.id);

    const { lat, lng, radius = 16093 } = await req.json(); // Default 10 miles in meters

    if (!lat || !lng) {
      throw new Error("Latitude and longitude are required");
    }

    // Validate coordinates
    if (typeof lat !== 'number' || typeof lng !== 'number' || 
        lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return new Response(
        JSON.stringify({ error: "Invalid coordinates" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate radius (max 50km / ~31 miles)
    const validRadius = Math.min(Math.max(Number(radius) || 16093, 1000), 50000);

    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) {
      throw new Error("GOOGLE_PLACES_API_KEY not configured");
    }

    console.log(`Searching for cigar lounges near ${lat}, ${lng} within ${validRadius}m`);

    // Search for cigar lounges/shops using Google Places Nearby Search
    const searchUrl = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
    searchUrl.searchParams.set("location", `${lat},${lng}`);
    searchUrl.searchParams.set("radius", validRadius.toString());
    searchUrl.searchParams.set("keyword", "cigar lounge cigar shop tobacco");
    searchUrl.searchParams.set("type", "store");
    searchUrl.searchParams.set("key", apiKey);

    const response = await fetch(searchUrl.toString());
    const data = await response.json();

    console.log(`Google Places API status: ${data.status}, found ${data.results?.length || 0} results`);

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("Google Places API error:", data);
      throw new Error(`Google Places API error: ${data.status}`);
    }

    // Calculate distance and transform results
    const lounges = (data.results || []).map((place: PlaceResult) => {
      const distance = calculateDistance(lat, lng, place.geometry.location.lat, place.geometry.location.lng);
      return {
        id: place.place_id,
        name: place.name,
        address: place.vicinity,
        distance: formatDistance(distance),
        distanceValue: distance,
        rating: place.rating,
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
        isOpen: place.opening_hours?.open_now,
      };
    });

    // Sort by distance
    lounges.sort((a: { distanceValue: number }, b: { distanceValue: number }) => a.distanceValue - b.distanceValue);

    console.log(`Returning ${lounges.length} lounges`);

    return new Response(
      JSON.stringify({ lounges }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error searching for lounges:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

function formatDistance(miles: number): string {
  if (miles < 0.1) {
    return `${Math.round(miles * 5280)} ft`;
  }
  return `${miles.toFixed(1)} mi`;
}
