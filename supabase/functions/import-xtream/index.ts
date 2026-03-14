import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface XtreamStream {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon: string;
  category_id: string;
  epg_channel_id: string | null;
}

interface XtreamCategory {
  category_id: string;
  category_name: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    
    // Support both manual trigger (with credentials) and cron trigger (uses stored config)
    const dns = body.dns || 'http://ipsmart.icu';
    const username = body.username || '5541996151706';
    const password = body.password || '5541996151706';

    const baseUrl = dns.replace(/\/$/, '');

    // 1. Fetch categories
    console.log('[import-xtream] Fetching categories...');
    const catResp = await fetch(
      `${baseUrl}/player_api.php?username=${username}&password=${password}&action=get_live_categories`
    );
    const categories: XtreamCategory[] = await catResp.json();
    const catMap = new Map<string, string>();
    for (const cat of categories) {
      catMap.set(cat.category_id, cat.category_name);
    }
    console.log(`[import-xtream] Got ${categories.length} categories`);

    // 2. Fetch live streams
    console.log('[import-xtream] Fetching live streams...');
    const streamsResp = await fetch(
      `${baseUrl}/player_api.php?username=${username}&password=${password}&action=get_live_streams`
    );
    const streams: XtreamStream[] = await streamsResp.json();
    console.log(`[import-xtream] Got ${streams.length} streams`);

    // 3. Build channel records with a unique external_id for upsert
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get existing channels by name to avoid duplicates
    const { data: existingChannels } = await supabase
      .from('channels')
      .select('name');
    const existingNames = new Set((existingChannels || []).map(c => c.name));

    const newChannels = streams
      .filter(s => !existingNames.has(s.name))
      .map((s) => {
        const categoryName = catMap.get(s.category_id) || 'Outros';
        const streamUrl = `${baseUrl}/live/${username}/${password}/${s.stream_id}.m3u8`;
        
        return {
          name: s.name,
          category: categoryName,
          logo: s.stream_icon || null,
          stream_urls: [streamUrl],
          embed_url: null,
          is_live: true,
        };
      });

    // 4. Insert only new channels in batches
    let inserted = 0;
    let errors = 0;
    const batchSize = 100;

    for (let i = 0; i < newChannels.length; i += batchSize) {
      const batch = newChannels.slice(i, i + batchSize);
      const { error } = await supabase.from('channels').insert(batch);
      if (error) {
        console.error(`[import-xtream] Batch ${i} error:`, error.message);
        errors++;
      } else {
        inserted += batch.length;
      }
    }

    // Update existing channels' stream URLs
    let updated = 0;
    const existingToUpdate = streams.filter(s => existingNames.has(s.name));
    for (const s of existingToUpdate) {
      const streamUrl = `${baseUrl}/live/${username}/${password}/${s.stream_id}.m3u8`;
      const { error } = await supabase
        .from('channels')
        .update({ stream_urls: [streamUrl], is_live: true })
        .eq('name', s.name);
      if (!error) updated++;
    }

    const uniqueCategories = [...new Set(streams.map(s => catMap.get(s.category_id) || 'Outros'))].sort();

    return new Response(
      JSON.stringify({
        success: true,
        totalStreams: streams.length,
        inserted,
        updated,
        skippedDuplicates: existingToUpdate.length,
        errors,
        categories: uniqueCategories,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[import-xtream] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Import failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
