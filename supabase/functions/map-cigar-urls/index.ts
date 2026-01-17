import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Parse XML sitemap and extract URLs
function parseSitemapXml(xml: string): string[] {
  const urls: string[] = [];
  
  // Match <loc> tags which contain URLs
  const locRegex = /<loc>([^<]+)<\/loc>/gi;
  let match;
  while ((match = locRegex.exec(xml)) !== null) {
    urls.push(match[1].trim());
  }
  
  return urls;
}

// Check if URL is a sitemap index (contains links to other sitemaps)
function isSitemapIndex(xml: string): boolean {
  return xml.includes('<sitemapindex') || xml.includes('<sitemap>');
}

// Fetch and parse a sitemap, handling sitemap indexes recursively
async function fetchSitemap(url: string, maxDepth = 2): Promise<string[]> {
  const allUrls: string[] = [];
  
  try {
    console.log(`Fetching sitemap: ${url}`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CigarBot/1.0)',
        'Accept': 'application/xml, text/xml, */*',
      },
    });
    
    if (!response.ok) {
      console.log(`Sitemap fetch failed: ${response.status}`);
      return allUrls;
    }
    
    const xml = await response.text();
    const urls = parseSitemapXml(xml);
    
    console.log(`Parsed ${urls.length} URLs from ${url}`);
    
    // Check if this is a sitemap index
    if (isSitemapIndex(xml) && maxDepth > 0) {
      console.log('Detected sitemap index, fetching child sitemaps...');
      
      // Filter to only sitemap URLs (usually end in .xml)
      const sitemapUrls = urls.filter(u => 
        u.endsWith('.xml') || u.includes('sitemap')
      );
      
      // Limit to first 10 child sitemaps to avoid timeout
      const limitedSitemaps = sitemapUrls.slice(0, 10);
      console.log(`Processing ${limitedSitemaps.length} child sitemaps`);
      
      for (const sitemapUrl of limitedSitemaps) {
        const childUrls = await fetchSitemap(sitemapUrl, maxDepth - 1);
        allUrls.push(...childUrls);
        
        // Small delay to be nice to servers
        await new Promise(r => setTimeout(r, 200));
      }
    } else {
      // Regular sitemap with product URLs
      allUrls.push(...urls);
    }
  } catch (error) {
    console.error(`Error fetching sitemap ${url}:`, error);
  }
  
  return allUrls;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
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
      .maybeSingle();

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
      .maybeSingle();

    if (sourceError || !source) {
      return new Response(
        JSON.stringify({ success: false, error: 'Source not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Mapping URLs for source: ${sourceName}`);
    console.log(`Sitemap URL: ${source.sitemap_url}`);
    console.log(`URL pattern: ${source.url_pattern}`);

    let allUrls: string[] = [];

    // Strategy 1: Use sitemap if available
    if (source.sitemap_url) {
      console.log('Using sitemap-first strategy');
      allUrls = await fetchSitemap(source.sitemap_url);
      console.log(`Total URLs from sitemap: ${allUrls.length}`);
    }

    // If sitemap failed or returned nothing, try common sitemap paths
    if (allUrls.length === 0) {
      console.log('Sitemap empty, trying common paths...');
      const commonPaths = [
        '/sitemap.xml',
        '/sitemap_index.xml',
        '/sitemaps/sitemap.xml',
        '/sitemap/sitemap.xml',
      ];
      
      for (const path of commonPaths) {
        const tryUrl = source.base_url + path;
        allUrls = await fetchSitemap(tryUrl);
        if (allUrls.length > 0) {
          console.log(`Found sitemap at ${tryUrl}`);
          break;
        }
      }
    }

    // Filter URLs using the pattern
    let filteredUrls = allUrls;
    if (source.url_pattern) {
      filteredUrls = allUrls.filter(url => url.includes(source.url_pattern));
      console.log(`Filtered to ${filteredUrls.length} URLs matching pattern "${source.url_pattern}"`);
    }

    // Additional filters to remove non-product pages
    filteredUrls = filteredUrls.filter(url => {
      // Exclude common non-product paths
      const excludePatterns = [
        '/cart', '/checkout', '/account', '/login', '/register',
        '/blog', '/news', '/about', '/contact', '/help', '/faq',
        '/privacy', '/terms', '/shipping', '/returns',
        '.jpg', '.png', '.gif', '.pdf', '.css', '.js'
      ];
      return !excludePatterns.some(pattern => url.toLowerCase().includes(pattern));
    });

    console.log(`After filtering: ${filteredUrls.length} product URLs`);

    // Limit to first 5000 URLs to avoid overwhelming the queue
    const urlsToInsert = filteredUrls.slice(0, 5000);

    // Insert URLs into queue, ignoring duplicates
    let insertedCount = 0;
    let duplicateCount = 0;

    // Batch insert for efficiency
    const batchSize = 100;
    for (let i = 0; i < urlsToInsert.length; i += batchSize) {
      const batch = urlsToInsert.slice(i, i + batchSize).map(url => ({
        source_url: url,
        source_name: sourceName,
        status: 'pending',
      }));

      const { error: insertError } = await supabase
        .from('scrape_queue')
        .upsert(batch, { onConflict: 'source_url', ignoreDuplicates: true });

      if (insertError) {
        console.error('Batch insert error:', insertError);
      } else {
        insertedCount += batch.length;
      }
    }

    // Count actual new vs duplicates
    const { count: pendingCount } = await supabase
      .from('scrape_queue')
      .select('*', { count: 'exact', head: true })
      .eq('source_name', sourceName)
      .eq('status', 'pending');

    // Update source stats
    await supabase
      .from('scrape_sources')
      .update({
        last_mapped_at: new Date().toISOString(),
        total_urls_found: filteredUrls.length,
      })
      .eq('name', sourceName);

    console.log(`Mapping complete: ${filteredUrls.length} URLs found, ~${insertedCount} processed`);

    return new Response(
      JSON.stringify({
        success: true,
        totalFound: allUrls.length,
        filtered: filteredUrls.length,
        queued: urlsToInsert.length,
        pendingInQueue: pendingCount || 0,
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
