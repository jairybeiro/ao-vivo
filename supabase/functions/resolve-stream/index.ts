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

    const candidates: string[] = [];

    // Pattern 1: .txt URLs (highest priority - contain fresh tokens)
    const txtRegex = /https?:\/\/[a-zA-Z0-9._~:/?#\[\]@!$&'()*+,;=%-]+\.txt(?:\?[^"'\s<>]*)?/gi;
    const txtMatches = html.match(txtRegex);
    if (txtMatches) {
      candidates.push(...txtMatches);
      console.log('[resolve-stream] Found .txt URLs:', txtMatches.length);
    }

    // Pattern 2: .m3u8 URLs
    const m3u8Regex = /https?:\/\/[a-zA-Z0-9._~:/?#\[\]@!$&'()*+,;=%-]+\.m3u8(?:\?[^"'\s<>]*)?/gi;
    const m3u8Matches = html.match(m3u8Regex);
    if (m3u8Matches) {
      candidates.push(...m3u8Matches);
      console.log('[resolve-stream] Found .m3u8 URLs:', m3u8Matches.length);
    }

    // Pattern 3: JS variables (src=, source:, file:, url:)
    const jsVarRegex = /(?:src|source|file|url|stream|video_url|manifest)\s*[:=]\s*["'](https?:\/\/[^"'\s]+)["']/gi;
    let jsMatch;
    while ((jsMatch = jsVarRegex.exec(html)) !== null) {
      candidates.push(jsMatch[1]);
    }

    // Pattern 4: .online domain token URLs
    const onlineRegex = /https?:\/\/[a-zA-Z0-9.-]+\.online\/token\/[a-zA-Z0-9]+\/[a-zA-Z0-9._-]+\.(?:txt|m3u8)/gi;
    const onlineMatches = html.match(onlineRegex);
    if (onlineMatches) {
      candidates.push(...onlineMatches);
      console.log('[resolve-stream] Found .online token URLs:', onlineMatches.length);
    }

    // Clean and deduplicate - filter out CDN libs, analytics, etc.
    const blocklist = ['jsdelivr.net', 'googleapis.com', 'cloudflareinsights.com', 'googletagmanager.com'];
    const cleaned = [...new Set(
      candidates
        .map(u => u.replace(/\\+/g, '').replace(/['";\s]+$/, '').trim())
        .filter(u => {
          try { new URL(u); } catch { return false; }
          // Must end in .txt or .m3u8
          if (!/\.(txt|m3u8|m3u)(\?|$)/i.test(u)) return false;
          // Exclude known CDN/analytics
          if (blocklist.some(b => u.includes(b))) return false;
          return true;
        })
    )];

    console.log('[resolve-stream] Stream candidates:', JSON.stringify(cleaned));

    if (cleaned.length > 0) {
      // Priority: .txt with .online domain > any .txt > .m3u8 with streaming domain > any .m3u8
      const onlineTxt = cleaned.find(u => /\.online\/.+\.txt/i.test(u));
      const anyTxt = cleaned.find(u => /\.txt(\?|$)/i.test(u));
      const streamM3u8 = cleaned.find(u => /\.(online|xyz|best|net)\/.+\.m3u8/i.test(u));
      const anyM3u8 = cleaned.find(u => /\.m3u8(\?|$)/i.test(u));

      const bestMatch = onlineTxt || anyTxt || streamM3u8 || anyM3u8 || cleaned[0];
      const streamUrl = bestMatch.replace(/^http:\/\//i, 'https://');

      console.log('[resolve-stream] Selected:', streamUrl);

      return new Response(
        JSON.stringify({ success: true, streamUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[resolve-stream] No stream URL found');
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
