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

/** Domains whose <script> tags must be stripped from HTML */
const BLOCKED_SCRIPT_DOMAINS = [
  'p.mrktmtrcs.net',
  'waust.at',
];

/** CSS injected into proxied HTML pages – stealth approach keeps DOM intact */
const INJECTED_CSS = `
<style>
  #vipFullscreenHost, .skm, [class*="vip"], [id*="vip"], [class*="overlay-ad"], [class*="modal-vip"] {
    opacity: 0 !important;
    pointer-events: none !important;
    transform: scale(0) !important;
    display: block !important;
    position: absolute !important;
    left: -9999px !important;
    top: -9999px !important;
    width: 0 !important;
    height: 0 !important;
    overflow: hidden !important;
    z-index: -9999 !important;
  }
  video, iframe {
    position: relative !important;
    z-index: 1 !important;
  }
</style>
`;

/** Script injected before </body> – MutationObserver to nuke modals dynamically */
const INJECTED_SCRIPT = `
<script>
(function(){
  var targets = ['#vipFullscreenHost', '.skm', '[class*="vip"]', '[id*="vip"]', '[class*="overlay-ad"]', '[class*="modal-vip"]'];
  function nuke(){
    targets.forEach(function(sel){
      document.querySelectorAll(sel).forEach(function(el){
        el.style.setProperty('opacity','0','important');
        el.style.setProperty('pointer-events','none','important');
        el.style.setProperty('transform','scale(0)','important');
        el.style.setProperty('display','block','important');
        el.style.setProperty('position','absolute','important');
        el.style.setProperty('left','-9999px','important');
        el.style.setProperty('top','-9999px','important');
        el.style.setProperty('width','0','important');
        el.style.setProperty('height','0','important');
        el.style.setProperty('overflow','hidden','important');
        el.style.setProperty('z-index','-9999','important');
      });
    });
    // Also catch canvas/svg overlays
    document.querySelectorAll('canvas, svg').forEach(function(el){
      var s = window.getComputedStyle(el);
      if(s.position==='fixed'||s.position==='absolute'){
        var z = parseInt(s.zIndex)||0;
        if(z>10){
          el.style.setProperty('opacity','0','important');
          el.style.setProperty('pointer-events','none','important');
        }
      }
    });
  }
  nuke();
  var obs = new MutationObserver(nuke);
  obs.observe(document.documentElement, {childList:true,subtree:true,attributes:true});
  setInterval(nuke, 500);
})();
</script>
`;

/**
 * Strip ad-related <script> tags and inject corrective CSS into HTML.
 */
function cleanHtml(html: string, targetUrl: string): string {
  // 1. Remove <script> tags from blocked domains
  for (const domain of BLOCKED_SCRIPT_DOMAINS) {
    // Matches <script ...src="...domain..."...>...</script> and self-closing
    const pattern = new RegExp(
      `<script[^>]*src=["'][^"']*${domain.replace(/\./g, '\\.')}[^"']*["'][^>]*>([\\s\\S]*?)<\\/script>`,
      'gi'
    );
    html = html.replace(pattern, '<!-- blocked -->');

    // Also catch self-closing or empty script tags
    const selfClosing = new RegExp(
      `<script[^>]*src=["'][^"']*${domain.replace(/\./g, '\\.')}[^"']*["'][^>]*\\/?>`,
      'gi'
    );
    html = html.replace(selfClosing, '<!-- blocked -->');
  }

  // 2. Inject corrective CSS right after <head> (or at the top if no <head>)
  if (html.includes('<head>')) {
    html = html.replace('<head>', '<head>' + INJECTED_CSS);
  } else if (html.includes('<head ')) {
    html = html.replace(/<head\s[^>]*>/, (match) => match + INJECTED_CSS);
  } else {
    html = INJECTED_CSS + html;
  }

  // 3. Rewrite relative resource URLs to be absolute (so CSS/JS/images load)
  const baseUrl = new URL(targetUrl);
  const origin = baseUrl.origin;

  // Fix src="/ and href="/ to be absolute
  html = html.replace(/(src|href|action)="\/(?!\/)/gi, `$1="${origin}/`);
  html = html.replace(/(src|href|action)='\/(?!\/)/gi, `$1='${origin}/`);

  return html;
}

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
    const isHtml = contentType.includes('text/html');

    // --- HTML page (embed) → clean ads and inject CSS ---
    if (isHtml) {
      console.log('[proxy-stream] HTML detected, cleaning ads...');
      let html = await response.text();
      html = cleanHtml(html, targetUrl);

      return new Response(html, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      });
    }

    // --- M3U8 playlist → rewrite URLs ---
    if (isPlaylist) {
      const text = await response.text();
      const proxyBase = new URL(req.url).origin + new URL(req.url).pathname;
      const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);

      const rewritten = text.split('\n').map(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
          if (trimmed.includes('URI="')) {
            return trimmed.replace(/URI="([^"]+)"/g, (_match, uri) => {
              const absoluteUri = uri.startsWith('http') ? uri : baseUrl + uri;
              return `URI="${proxyBase}?url=${encodeURIComponent(absoluteUri)}"`;
            });
          }
          return line;
        }
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

    // --- Binary content (.ts, MP4, etc.) → stream through ---
    const responseHeaders: Record<string, string> = {
      ...corsHeaders,
      'Content-Type': contentType || 'video/mp2t',
      'Cache-Control': 'public, max-age=10',
    };

    const contentRange = response.headers.get('content-range');
    const contentLength = response.headers.get('content-length');
    const acceptRanges = response.headers.get('accept-ranges');
    if (contentRange) responseHeaders['Content-Range'] = contentRange;
    if (contentLength) responseHeaders['Content-Length'] = contentLength;
    if (acceptRanges) responseHeaders['Accept-Ranges'] = acceptRanges;
    else responseHeaders['Accept-Ranges'] = 'bytes';

    return new Response(response.body, {
      status: response.status,
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
