import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');

    if (!firecrawlApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ success: false, error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { sourceName } = await req.json();

    // Get source info
    const { data: source, error: sourceError } = await supabase
      .from('scrape_sources')
      .select('*')
      .eq('name', sourceName)
      .single();

    if (sourceError || !source) {
      return new Response(
        JSON.stringify({ success: false, error: 'Source not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Mapping URLs for source: ${sourceName} (${source.base_url})`);

    // Different URL patterns for different sources
    let mapUrl = source.base_url;
    let searchFilter = '';
    
    if (sourceName === 'elite_cigar_library') {
      mapUrl = 'https://elitecigarlibrary.com/cigars';
      searchFilter = 'cigar';
    } else if (sourceName === 'famous_smoke') {
      mapUrl = 'https://www.famous-smoke.com/cigars';
      searchFilter = 'cigar';
    } else if (sourceName === 'cigar_aficionado') {
      mapUrl = 'https://www.cigaraficionado.com/ratings';
      searchFilter = 'rating';
    } else if (sourceName === 'halfwheel') {
      mapUrl = 'https://halfwheel.com/reviews';
      searchFilter = 'review';
    } else if (sourceName === 'cigars_international') {
      mapUrl = 'https://www.cigarsinternational.com/shop/big-list-of-cigars-brands/1803000/';
      searchFilter = 'cigars';
    } else if (sourceName === 'thompson_cigar') {
      mapUrl = 'https://www.thompsoncigar.com/shop/all-cigar-brands/8336/';
      searchFilter = 'cigars';
    } else if (sourceName === 'wikipedia_brands') {
      mapUrl = 'https://en.wikipedia.org/wiki/List_of_cigar_brands';
      searchFilter = 'cigar';
    } else if (sourceName === 'cigar_geeks') {
      mapUrl = 'https://www.cigargeeks.com/index.php?action=cigars';
      searchFilter = 'cigar';
    }

    // Use Firecrawl map endpoint
    const response = await fetch('https://api.firecrawl.dev/v1/map', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: mapUrl,
        search: searchFilter,
        limit: 5000,
        includeSubdomains: false,
      }),
    });

    const mapData = await response.json();

    if (!response.ok || !mapData.success) {
      console.error('Firecrawl map error:', mapData);
      return new Response(
        JSON.stringify({ success: false, error: mapData.error || 'Failed to map URLs' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const urls = mapData.links || [];
    console.log(`Found ${urls.length} URLs`);

    // Filter URLs to only include cigar-specific pages
    const cigarUrls = urls.filter((url: string) => {
      if (sourceName === 'elite_cigar_library') {
        return url.includes('/cigars/') && !url.endsWith('/cigars/') && !url.includes('?');
      } else if (sourceName === 'famous_smoke') {
        return url.includes('/cigars/') && url.includes('-cigars');
      } else if (sourceName === 'cigar_aficionado') {
        return url.includes('/ratings/') && url.match(/\/\d+$/);
      } else if (sourceName === 'halfwheel') {
        return url.includes('/review-') || url.includes('-review');
      } else if (sourceName === 'cigars_international') {
        // Match product pages like /p/cigar-name/123456/
        return url.includes('/p/') && url.match(/\/\d+\/?$/);
      } else if (sourceName === 'thompson_cigar') {
        // Match product pages
        return url.includes('/product/') || (url.includes('/shop/') && url.match(/\/\d+\/?$/));
      } else if (sourceName === 'wikipedia_brands') {
        // Wikipedia links to brand pages - we'll scrape the main list instead
        return url.includes('/wiki/') && !url.includes(':') && !url.includes('List_of') && url !== 'https://en.wikipedia.org/wiki/Cigar';
      } else if (sourceName === 'cigar_geeks') {
        return url.includes('action=cigar') && url.includes('cigar_id=');
      }
      return false;
    });

    console.log(`Filtered to ${cigarUrls.length} cigar URLs`);

    // Insert URLs into queue, ignoring duplicates
    let insertedCount = 0;
    let duplicateCount = 0;

    for (const url of cigarUrls) {
      const { error: insertError } = await supabase
        .from('scrape_queue')
        .insert({
          source_url: url,
          source_name: sourceName,
          status: 'pending',
        });

      if (insertError) {
        if (insertError.code === '23505') { // Unique violation
          duplicateCount++;
        } else {
          console.error('Insert error:', insertError);
        }
      } else {
        insertedCount++;
      }
    }

    // Update source stats
    await supabase
      .from('scrape_sources')
      .update({
        last_mapped_at: new Date().toISOString(),
        total_urls_found: cigarUrls.length,
      })
      .eq('name', sourceName);

    console.log(`Inserted ${insertedCount} new URLs, ${duplicateCount} duplicates skipped`);

    return new Response(
      JSON.stringify({
        success: true,
        totalFound: urls.length,
        cigarUrls: cigarUrls.length,
        inserted: insertedCount,
        duplicates: duplicateCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error mapping URLs:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
