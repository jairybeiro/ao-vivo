const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, range, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, HEAD',
  'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
  'Access-Control-Max-Age': '86400',
};

const SPOOF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Referer': 'https://embedtv.best/',
  'Origin': 'https://embedtv.best',
  'Accept': '*/*',
  'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
};

/**
 * Proxy edge function for HLS streams.
 * 
 * GET  ?url=<encoded_url>  → proxies the content (m3u8 playlist or .ts segment)
 * POST { url }             → same via JSON body
 * 
 * Rewrites URLs inside .m3u8 playlists so sub-resources also go through this proxy.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let targetUrl: string | null = null;

    if (req.method === 'GET' || req.method === 'HEAD') {
      const params = new URL(req.url).searchParams;
      targetUrl = params.get('url');
    } else if (req.method === 'POST') {
      const body = await req.json();
      targetUrl = body.url;
    }

    // For HEAD requests, just check if the upstream is reachable
    if (req.method === 'HEAD' && targetUrl) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const headResp = await fetch(targetUrl, {
          method: 'HEAD',
          headers: SPOOF_HEADERS,
          signal: controller.signal,
        });
        clearTimeout(timeout);
        return new Response(null, {
          status: headResp.status,
          headers: corsHeaders,
        });
      } catch {
        return new Response(null, { status: 502, headers: corsHeaders });
      }
    }

    if (!targetUrl) {
      return new Response(
        JSON.stringify({ error: 'url parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[proxy-stream] Fetching:', targetUrl);

    // Forward Range header for MP4 seeking support
    const fetchHeaders: Record<string, string> = { ...SPOOF_HEADERS };
    const rangeHeader = req.headers.get('Range');
    if (rangeHeader) {
      fetchHeaders['Range'] = rangeHeader;
    }

    const response = await fetch(targetUrl, {
      headers: fetchHeaders,
    });

    if (!response.ok) {
      console.error('[proxy-stream] Upstream returned:', response.status);
      return new Response(
        JSON.stringify({ error: `Upstream returned ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const contentType = response.headers.get('content-type') || '';
    const isPlaylist = targetUrl.includes('.m3u8') || contentType.includes('mpegurl') || contentType.includes('x-mpegURL');

    if (isPlaylist) {
      // It's an m3u8 playlist — rewrite URLs to go through this proxy
      const text = await response.text();
      const proxyBase = new URL(req.url).origin + new URL(req.url).pathname;
      const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);

      const rewritten = text.split('\n').map(line => {
        const trimmed = line.trim();
        // Skip comments/tags and empty lines
        if (!trimmed || trimmed.startsWith('#')) {
          // But check for URI= inside tags (e.g., #EXT-X-KEY:...URI="...")
          if (trimmed.includes('URI="')) {
            return trimmed.replace(/URI="([^"]+)"/g, (_match, uri) => {
              const absoluteUri = uri.startsWith('http') ? uri : baseUrl + uri;
              return `URI="${proxyBase}?url=${encodeURIComponent(absoluteUri)}"`;
            });
          }
          return line;
        }
        // It's a URL line (segment or variant playlist)
        const absoluteUrl = trimmed.startsWith('http') ? trimmed : baseUrl + trimmed;
        return `${proxyBase}?url=${encodeURIComponent(absoluteUrl)}`;
      }).join('\n');

      return new Response(rewritten, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Cache-Control': 'no-cache',
        },
      });
    }

    // For .ts segments, MP4, and other binary content — stream through
    const responseHeaders: Record<string, string> = {
      ...corsHeaders,
      'Content-Type': contentType || 'video/mp2t',
      'Cache-Control': 'public, max-age=10',
    };

    // Forward content-range and accept-ranges for MP4 seeking
    const contentRange = response.headers.get('content-range');
    const contentLength = response.headers.get('content-length');
    const acceptRanges = response.headers.get('accept-ranges');
    if (contentRange) responseHeaders['Content-Range'] = contentRange;
    if (contentLength) responseHeaders['Content-Length'] = contentLength;
    if (acceptRanges) responseHeaders['Accept-Ranges'] = acceptRanges;
    else responseHeaders['Accept-Ranges'] = 'bytes';

    return new Response(response.body, {
      status: response.status, // preserve 206 Partial Content
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('[proxy-stream] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Proxy error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
