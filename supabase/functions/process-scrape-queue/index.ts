import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CigarData {
  brand: string;
  line: string;
  vitola: string;
  size?: string;
  wrapper?: string;
  binder?: string;
  filler?: string;
  origin?: string;
  strength_profile?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!firecrawlApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'AI key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { batchSize = 5, sourceName } = await req.json().catch(() => ({}));

    // Get pending items from queue
    let query = supabase
      .from('scrape_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(batchSize);

    if (sourceName) {
      query = query.eq('source_name', sourceName);
    }

    const { data: queueItems, error: queueError } = await query;

    if (queueError) {
      console.error('Queue fetch error:', queueError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch queue' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!queueItems || queueItems.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No items in queue', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${queueItems.length} items from queue`);

    const results = {
      processed: 0,
      inserted: 0,
      duplicates: 0,
      failed: 0,
    };

    // Patterns that indicate category/listing pages (not individual products)
    // These match ONLY if the URL ends with the category pattern (no product after it)
    const categoryPatterns = [
      /\/cigars\/type\/[^\/]+$/,           // /cigars/type/machine-made-cigars (no product after)
      /\/cigars\/country\/[^\/]+$/,        // /cigars/country/nicaraguan-cigars (no product after)
      /\/cigars\/package\/[^\/]+$/,        // /cigars/package/10-pack-cigars (no product after)
      /\/cigars\/shape\/[^\/]+$/,
      /\/cigars\/strength\/[^\/]+$/,       // /cigars/strength/mild-cigars (no product after)
      /\/cigars\/brand$/,
      /\/category\/[^\/]*$/,
      /\/collections?\/[^\/]*$/,
      /\/brands?\/?$/,
      /\/all-cigars\/?$/,
      /\/cigars\.html$/,                   // Holts category pages
      /\/samplers\.html$/,
      /\/accessories\.html$/,
    ];

    for (const item of queueItems) {
      try {
        // Skip category/listing pages
        const isCategory = categoryPatterns.some(pattern => pattern.test(item.source_url));
        if (isCategory) {
          console.log(`Skipping category page: ${item.source_url}`);
          await supabase
            .from('scrape_queue')
            .update({
              status: 'skipped',
              error_message: 'Category/listing page, not a product',
              processed_at: new Date().toISOString(),
            })
            .eq('id', item.id);
          results.failed++;
          continue;
        }

        // Mark as processing
        await supabase
          .from('scrape_queue')
          .update({ status: 'processing' })
          .eq('id', item.id);

        console.log(`Scraping: ${item.source_url}`);

        // Scrape the page
        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: item.source_url,
            formats: ['markdown'],
            onlyMainContent: true,
          }),
        });

        const scrapeData = await scrapeResponse.json();

        if (!scrapeResponse.ok || !scrapeData.success) {
          throw new Error(scrapeData.error || 'Scrape failed');
        }

        const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';

        if (!markdown || markdown.length < 100) {
          throw new Error('No content or too little content scraped');
        }

        // Extract cigar data using AI
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: `You extract cigar information from webpage content. Return a JSON object with these fields:
                - brand: string (manufacturer/brand name)
                - line: string (product line name)
                - vitola: string (cigar shape/size name like Robusto, Churchill, etc.)
                - size: string (dimensions like 5x50)
                - wrapper: string (wrapper leaf type/origin)
                - binder: string (binder leaf)
                - filler: string (filler leaves)
                - origin: string (country of origin)
                - strength_profile: string (mild, medium, full, etc.)
                
                Return ONLY valid JSON, no markdown or explanation. If a field is not found, omit it.`,
              },
              {
                role: 'user',
                content: `Extract cigar data from this content:\n\n${markdown.substring(0, 8000)}`,
              },
            ],
            max_tokens: 1000,
          }),
        });

        const aiRaw = await aiResponse.text();

        if (!aiResponse.ok) {
          throw new Error(`AI request failed (${aiResponse.status}): ${aiRaw.substring(0, 200)}`);
        }

        // Parse chat-completions response JSON safely (avoid crashing on non-JSON responses)
        let aiData: any;
        try {
          aiData = JSON.parse(aiRaw);
        } catch {
          throw new Error(`AI returned non-JSON response: ${aiRaw.substring(0, 200)}`);
        }

        let cigarData: CigarData;

        try {
          const content = aiData.choices?.[0]?.message?.content || '';
          console.log(`AI response preview: ${content.substring(0, 200)}`);

          // Try to extract JSON from the response
          let jsonStr = content;

          // Remove markdown code blocks if present
          const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (codeBlockMatch) {
            jsonStr = codeBlockMatch[1].trim();
          } else {
            // Try to find raw JSON object
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              jsonStr = jsonMatch[0];
            }
          }

          if (!jsonStr || !jsonStr.trim().startsWith('{')) {
            throw new Error(`No valid JSON found in: ${content.substring(0, 120)}`);
          }

          cigarData = JSON.parse(jsonStr);
        } catch (parseError) {
          const parseErrorMsg = parseError instanceof Error ? parseError.message : 'Unknown parse error';
          throw new Error(`JSON parse failed: ${parseErrorMsg}`);
        }

        // brand + line are required; vitola can be unknown depending on retailer page structure
        if (!cigarData.brand || !cigarData.line) {
          throw new Error(`Missing required fields. Got: brand=${cigarData.brand}, line=${cigarData.line}, vitola=${cigarData.vitola}`);
        }

        cigarData.vitola = (cigarData.vitola && String(cigarData.vitola).trim()) || 'Unknown';

        // Check for duplicates
        const { data: existing } = await supabase
          .from('cigars')
          .select('id')
          .ilike('brand', cigarData.brand)
          .ilike('line', cigarData.line)
          .ilike('vitola', cigarData.vitola)
          .limit(1);

        if (existing && existing.length > 0) {
          // Mark as duplicate
          await supabase
            .from('scrape_queue')
            .update({
              status: 'duplicate',
              cigar_id: existing[0].id,
              processed_at: new Date().toISOString(),
            })
            .eq('id', item.id);

          results.duplicates++;
          console.log(`Duplicate found: ${cigarData.brand} ${cigarData.line} ${cigarData.vitola}`);
        } else {
          // Insert new cigar
          const { data: newCigar, error: insertError } = await supabase
            .from('cigars')
            .insert({
              brand: cigarData.brand,
              line: cigarData.line,
              vitola: cigarData.vitola,
              size: cigarData.size || null,
              wrapper: cigarData.wrapper || null,
              binder: cigarData.binder || null,
              filler: cigarData.filler || null,
              origin: cigarData.origin || null,
              strength_profile: cigarData.strength_profile || null,
            })
            .select('id')
            .single();

          if (insertError) {
            throw new Error(`Insert failed: ${insertError.message}`);
          }

          await supabase
            .from('scrape_queue')
            .update({
              status: 'completed',
              cigar_id: newCigar.id,
              processed_at: new Date().toISOString(),
            })
            .eq('id', item.id);

          results.inserted++;
          console.log(`Inserted: ${cigarData.brand} ${cigarData.line} ${cigarData.vitola}`);
        }

        results.processed++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error processing ${item.source_url}:`, errorMsg);
        
        await supabase
          .from('scrape_queue')
          .update({
            status: 'failed',
            error_message: errorMsg,
            retry_count: item.retry_count + 1,
            processed_at: new Date().toISOString(),
          })
          .eq('id', item.id);

        results.failed++;
      }

      // Small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Update source stats
    const { data: sourceStats } = await supabase
      .from('scrape_queue')
      .select('source_name')
      .in('status', ['completed', 'duplicate']);

    if (sourceStats) {
      const countBySource: Record<string, number> = {};
      for (const item of sourceStats) {
        countBySource[item.source_name] = (countBySource[item.source_name] || 0) + 1;
      }

      for (const [source, count] of Object.entries(countBySource)) {
        await supabase
          .from('scrape_sources')
          .update({ total_processed: count })
          .eq('name', source);
      }
    }

    console.log('Processing complete:', results);

    return new Response(
      JSON.stringify({ success: true, ...results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing queue:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
