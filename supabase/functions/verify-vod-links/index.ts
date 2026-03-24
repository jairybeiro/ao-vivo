import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

async function checkUrl(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const resp = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeout);
    return resp.ok || resp.status === 206 || resp.status === 302 || resp.status === 301;
  } catch {
    // HEAD may be blocked, try GET with range
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const resp = await fetch(url, {
        method: 'GET',
        headers: { 'Range': 'bytes=0-1' },
        signal: controller.signal,
        redirect: 'follow',
      });
      clearTimeout(timeout);
      return resp.ok || resp.status === 206;
    } catch {
      return false;
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const type = body.type || 'movies'; // 'movies' or 'series'
    const offset = body.offset || 0;
    const batchSize = body.batchSize || 20;
    const autoDisable = body.autoDisable ?? false;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const table = type === 'series' ? 'vod_episodes' : 'vod_movies';

    // Get total count
    const { count: totalCount } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true });

    // Get batch
    const { data: items, error } = await supabase
      .from(table)
      .select('id, stream_url, name')
      .range(offset, offset + batchSize - 1)
      .order('created_at', { ascending: false });

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!items || items.length === 0) {
      return new Response(
        JSON.stringify({ done: true, checked: 0, offline: 0, total: totalCount || 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check URLs in parallel (batch of concurrent checks)
    const results = await Promise.all(
      items.map(async (item) => {
        const online = await checkUrl(item.stream_url);
        return { id: item.id, name: item.name, stream_url: item.stream_url, online };
      })
    );

    const offlineIds = results.filter(r => !r.online).map(r => r.id);
    const offlineItems = results.filter(r => !r.online);

    // Auto-disable offline items if requested (only for vod_movies)
    if (autoDisable && offlineIds.length > 0 && type === 'movies') {
      await supabase
        .from('vod_movies')
        .update({ is_active: false })
        .in('id', offlineIds);
    }

    const hasMore = (offset + batchSize) < (totalCount || 0);

    return new Response(
      JSON.stringify({
        done: !hasMore,
        checked: items.length,
        online: results.filter(r => r.online).length,
        offline: offlineIds.length,
        offlineItems,
        total: totalCount || 0,
        nextOffset: offset + batchSize,
        hasMore,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[verify-vod-links] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Verification failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
