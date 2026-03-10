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

    // Collect all candidate URLs
    const allCandidates: string[] = [];

    // Pattern 1: URLs ending in .txt (highest priority - these contain fresh tokens)
    const txtRegex = /https?:\/\/[a-zA-Z0-9._~:/?#\[\]@!$&'()*+,;=%-]+\.txt(?:\?[^"'\s<>]*)?/gi;
    const txtMatches = html.match(txtRegex);
    if (txtMatches) {
      allCandidates.push(...txtMatches);
      console.log('[resolve-stream] Found .txt URLs:', txtMatches.length);
    }

    // Pattern 2: URLs ending in .m3u8
    const m3u8Regex = /https?:\/\/[a-zA-Z0-9._~:/?#\[\]@!$&'()*+,;=%-]+\.m3u8(?:\?[^"'\s<>]*)?/gi;
    const m3u8Matches = html.match(m3u8Regex);
    if (m3u8Matches) {
      allCandidates.push(...m3u8Matches);
      console.log('[resolve-stream] Found .m3u8 URLs:', m3u8Matches.length);
    }

    // Pattern 3: Look for URLs inside JS variables (src=, source:, file:, url:, etc.)
    const jsVarRegex = /(?:src|source|file|url|stream|video_url|manifest)\s*[:=]\s*["'](https?:\/\/[^"'\s]+)["']/gi;
    let jsMatch;
    while ((jsMatch = jsVarRegex.exec(html)) !== null) {
      allCandidates.push(jsMatch[1]);
    }

    // Pattern 4: Look for concatenated strings building URLs
    // e.g. "https://" + "domain" + "/path/file.txt"
    const concatRegex = /["'](https?:\/\/[^"']+(?:\.txt|\.m3u8|\.m3u)[^"']*)["']/gi;
    let concatMatch;
    while ((concatMatch = concatRegex.exec(html)) !== null) {
      allCandidates.push(concatMatch[1]);
    }

    // Pattern 5: Look specifically for cloudfront-net.online or similar .online domains with /token/ path
    const onlineRegex = /https?:\/\/[a-zA-Z0-9.-]+\.online\/token\/[a-zA-Z0-9]+\/[a-zA-Z0-9._-]+\.(?:txt|m3u8)/gi;
    const onlineMatches = html.match(onlineRegex);
    if (onlineMatches) {
      allCandidates.push(...onlineMatches);
      console.log('[resolve-stream] Found .online token URLs:', onlineMatches.length);
    }

    // Clean, deduplicate and filter candidates
    const cleaned = [...new Set(
      allCandidates
        .map(u => u.replace(/\\+/g, '').replace(/['";\s]+$/, '').trim())
        .filter(u => {
          try { new URL(u); return true; } catch { return false; }
        })
    )];

    console.log('[resolve-stream] Total unique candidates:', cleaned.length);
    if (cleaned.length > 0) {
      console.log('[resolve-stream] Candidates:', JSON.stringify(cleaned.slice(0, 10)));
    }

    if (cleaned.length > 0) {
      // Priority: 
      // 1. .txt URLs with .online domain (fresh token pattern)
      // 2. Any .txt URL  
      // 3. .m3u8 URLs with known CDN domains
      // 4. Any .m3u8 URL
      const onlineTxt = cleaned.find(u => /\.online\/.+\.txt/i.test(u));
      const anyTxt = cleaned.find(u => /\.txt(\?|$)/i.test(u));
      const cdnM3u8 = cleaned.find(u => /\.(online|xyz|best|net)\/.+\.m3u8/i.test(u));
      const anyM3u8 = cleaned.find(u => /\.m3u8(\?|$)/i.test(u));
      
      const bestMatch = onlineTxt || anyTxt || cdnM3u8 || anyM3u8 || cleaned[0];
      
      // Force HTTPS
      const streamUrl = bestMatch.replace(/^http:\/\//i, 'https://');
      
      console.log('[resolve-stream] Selected URL:', streamUrl);

      return new Response(
        JSON.stringify({ 
          success: true, 
          streamUrl, 
          allUrls: cleaned.map(u => u.replace(/^http:\/\//i, 'https://'))
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fallback: try to find any HLS-like URL pattern
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

    console.log('[resolve-stream] No stream URL found. HTML snippet:', html.substring(0, 2000));

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
