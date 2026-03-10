const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'url is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[resolve-stream] Fetching embed page:', url);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': url,
      },
    });

    if (!response.ok) {
      console.error('[resolve-stream] Fetch failed:', response.status);
      return new Response(
        JSON.stringify({ success: false, error: `Fetch failed: ${response.status}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = await response.text();
    console.log('[resolve-stream] HTML length:', html.length);

    // Primary regex: matches .txt and .m3u8 URLs with tokens
    const regex = /https?:\/\/[^"'\s<>]+\.(?:txt|m3u8)(?:\?[^"'\s<>]*)?/gi;
    const matches = html.match(regex);

    if (matches && matches.length > 0) {
      // Clean and deduplicate
      const cleaned = [...new Set(matches.map(m => m.replace(/\\+/g, '').replace(/['";\s]+$/, '')))];
      console.log('[resolve-stream] Found URLs:', cleaned);

      // Prefer .m3u8 over .txt
      const m3u8 = cleaned.find(u => u.includes('.m3u8'));
      const raw = m3u8 || cleaned[0];
      // Force HTTPS to avoid mixed content blocking
      const streamUrl = raw.replace(/^http:\/\//i, 'https://');

      return new Response(
        JSON.stringify({ success: true, streamUrl, allUrls: cleaned }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fallback: try to find any HLS-like URL
    const hlsRegex = /["']?(https?:\/\/[^"'\s]+(?:index|playlist|live|stream|master)[^"'\s]*\.m3u8[^"'\s]*?)["']/gi;
    const hlsMatches = [...html.matchAll(hlsRegex)];
    
    if (hlsMatches.length > 0) {
      const streamUrl = (hlsMatches[0][1] || hlsMatches[0][0].replace(/["']/g, '')).replace(/^http:\/\//i, 'https://');
      console.log('[resolve-stream] Fallback HLS URL found:', streamUrl);
      return new Response(
        JSON.stringify({ success: true, streamUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[resolve-stream] No stream URL found. HTML snippet:', html.substring(0, 1500));

    return new Response(
      JSON.stringify({ success: false, error: 'No stream URL found in embed page' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[resolve-stream] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
