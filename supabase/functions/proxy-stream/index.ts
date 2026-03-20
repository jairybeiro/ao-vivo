const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, range, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-session-id',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, HEAD',
  'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges, X-Session-Id',
  'Access-Control-Max-Age': '86400',
};

const SPOOF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Referer': 'https://embedtv.best/',
  'Origin': 'https://embedtv.best',
  'Accept': '*/*',
  'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
};

// ─── SESSION STORE (in-memory, per-isolate) ─────────────────────────────
interface SessionEntry {
  cookies: string;
  lastUpdated: number;
}

const sessionStore = new Map<string, SessionEntry>();
const SESSION_TTL_MS = 5 * 60 * 1000; // 5 min TTL

/** Derive a session key from the stream URL (use base path without segments) */
function getSessionKey(url: string, clientSessionId?: string | null): string {
  if (clientSessionId) return clientSessionId;
  try {
    const parsed = new URL(url);
    // Use origin + first path segments as key (strip segment/file names)
    const pathParts = parsed.pathname.split('/').filter(Boolean);
    const keyParts = pathParts.slice(0, Math.min(pathParts.length, 4));
    return `${parsed.hostname}/${keyParts.join('/')}`;
  } catch {
    return url;
  }
}

/** Capture Set-Cookie headers from upstream response */
function captureUpstreamCookies(response: Response, sessionKey: string): void {
  const setCookieHeaders: string[] = [];

  // Deno's Response.headers.getSetCookie() returns all Set-Cookie values
  try {
    const cookies = (response.headers as any).getSetCookie?.();
    if (cookies && Array.isArray(cookies)) {
      setCookieHeaders.push(...cookies);
    }
  } catch {
    // Fallback: try raw header
    const raw = response.headers.get('set-cookie');
    if (raw) setCookieHeaders.push(raw);
  }

  if (setCookieHeaders.length === 0) return;

  // Parse cookie name=value pairs (strip attributes like Path, Expires, etc.)
  const cookiePairs = setCookieHeaders.map(sc => {
    const firstPart = sc.split(';')[0].trim();
    return firstPart;
  }).filter(Boolean);

  if (cookiePairs.length === 0) return;

  const existing = sessionStore.get(sessionKey);
  const existingMap = new Map<string, string>();

  // Parse existing cookies into map
  if (existing?.cookies) {
    existing.cookies.split('; ').forEach(pair => {
      const eq = pair.indexOf('=');
      if (eq > 0) existingMap.set(pair.substring(0, eq), pair.substring(eq + 1));
    });
  }

  // Merge new cookies
  cookiePairs.forEach(pair => {
    const eq = pair.indexOf('=');
    if (eq > 0) existingMap.set(pair.substring(0, eq), pair.substring(eq + 1));
  });

  const merged = Array.from(existingMap.entries()).map(([k, v]) => `${k}=${v}`).join('; ');

  sessionStore.set(sessionKey, {
    cookies: merged,
    lastUpdated: Date.now(),
  });

  console.log(`[SESSION] cookie stored for ${sessionKey}: ${merged.substring(0, 60)}...`);
}

/** Get stored cookies for a session */
function getStoredCookies(sessionKey: string): string | null {
  const entry = sessionStore.get(sessionKey);
  if (!entry) return null;

  // Check TTL
  if (Date.now() - entry.lastUpdated > SESSION_TTL_MS) {
    console.log(`[SESSION] expired for ${sessionKey}`);
    sessionStore.delete(sessionKey);
    return null;
  }

  console.log(`[SESSION] cookie reused for ${sessionKey}`);
  return entry.cookies;
}

/** Clear session for a key */
function clearSession(sessionKey: string): void {
  if (sessionStore.has(sessionKey)) {
    sessionStore.delete(sessionKey);
    console.log(`[SESSION] cleared for ${sessionKey}`);
  }
}

/** Evict expired sessions periodically */
function evictExpiredSessions(): void {
  const now = Date.now();
  for (const [key, entry] of sessionStore) {
    if (now - entry.lastUpdated > SESSION_TTL_MS) {
      sessionStore.delete(key);
    }
  }
}

// Evict every 60s
setInterval(evictExpiredSessions, 60_000);

// ─── FETCH WITH TIMEOUT + RETRY ─────────────────────────────────────────
const FETCH_TIMEOUT_MS = 8_000;
const MAX_RETRIES = 1;

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, { ...options, signal: controller.signal });
    return resp;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchWithRetry(
  url: string,
  headers: Record<string, string>,
  timeoutMs = FETCH_TIMEOUT_MS
): Promise<Response> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const resp = await fetchWithTimeout(url, { headers }, timeoutMs);
      return resp;
    } catch (err) {
      if (attempt === MAX_RETRIES) throw err;
      console.log(`[proxy-stream] Retry ${attempt + 1} for: ${url}`);
    }
  }
  throw new Error('Unreachable');
}

// ─── HTML CLEANING ───────────────────────────────────────────────────────
const BLOCKED_SCRIPT_DOMAINS = ['p.mrktmtrcs.net', 'waust.at'];

const INJECTED_CSS = `
<style>
  #vipFullscreenHost, .skm, [class*="vip"], [id*="vip"], [class*="overlay-ad"], [class*="modal-vip"] {
    opacity: 0 !important; pointer-events: none !important; transform: scale(0) !important;
    display: block !important; position: absolute !important; left: -9999px !important;
    top: -9999px !important; width: 0 !important; height: 0 !important;
    overflow: hidden !important; z-index: -9999 !important;
  }
  video, iframe { position: relative !important; z-index: 1 !important; }
</style>
`;

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

function cleanHtml(html: string, targetUrl: string): string {
  for (const domain of BLOCKED_SCRIPT_DOMAINS) {
    const pattern = new RegExp(
      `<script[^>]*src=["'][^"']*${domain.replace(/\./g, '\\.')}[^"']*["'][^>]*>([\\s\\S]*?)<\\/script>`, 'gi'
    );
    html = html.replace(pattern, '<!-- blocked -->');
    const selfClosing = new RegExp(
      `<script[^>]*src=["'][^"']*${domain.replace(/\./g, '\\.')}[^"']*["'][^>]*\\/?>`, 'gi'
    );
    html = html.replace(selfClosing, '<!-- blocked -->');
  }

  if (html.includes('<head>')) {
    html = html.replace('<head>', '<head>' + INJECTED_CSS);
  } else if (html.includes('<head ')) {
    html = html.replace(/<head\s[^>]*>/, (match) => match + INJECTED_CSS);
  } else {
    html = INJECTED_CSS + html;
  }

  if (html.includes('</body>')) {
    html = html.replace('</body>', INJECTED_SCRIPT + '</body>');
  } else {
    html += INJECTED_SCRIPT;
  }

  const baseUrl = new URL(targetUrl);
  const origin = baseUrl.origin;
  html = html.replace(/(src|href|action)="\/(?!\/)/gi, `$1="${origin}/`);
  html = html.replace(/(src|href|action)='\/(?!\/)/gi, `$1='${origin}/`);

  return html;
}

// ─── MAIN HANDLER ────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let targetUrl: string | null = null;
    const clientSessionId = req.headers.get('x-session-id');

    if (req.method === 'GET' || req.method === 'HEAD') {
      const params = new URL(req.url).searchParams;
      targetUrl = params.get('url');
    } else if (req.method === 'POST') {
      const body = await req.json();
      targetUrl = body.url;
    }

    // HEAD – health check
    if (req.method === 'HEAD' && targetUrl) {
      try {
        const sessionKey = getSessionKey(targetUrl, clientSessionId);
        const headHeaders: Record<string, string> = { ...SPOOF_HEADERS };
        const storedCookies = getStoredCookies(sessionKey);
        if (storedCookies) headHeaders['Cookie'] = storedCookies;

        const headResp = await fetchWithTimeout(targetUrl, {
          method: 'HEAD',
          headers: headHeaders,
        });

        captureUpstreamCookies(headResp, sessionKey);

        return new Response(null, {
          status: headResp.status,
          headers: { ...corsHeaders, 'X-Session-Id': sessionKey },
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

    const sessionKey = getSessionKey(targetUrl, clientSessionId);
    console.log('[proxy-stream] Fetching:', targetUrl);

    // Build headers with session cookies
    const fetchHeaders: Record<string, string> = { ...SPOOF_HEADERS };
    const storedCookies = getStoredCookies(sessionKey);
    if (storedCookies) {
      fetchHeaders['Cookie'] = storedCookies;
    }

    const rangeHeader = req.headers.get('Range');
    if (rangeHeader) {
      fetchHeaders['Range'] = rangeHeader;
    }

    let response: Response;
    try {
      response = await fetchWithRetry(targetUrl, fetchHeaders);
    } catch (err) {
      console.error('[proxy-stream] Fetch failed after retries:', err);
      return new Response(
        JSON.stringify({ error: 'Upstream fetch timeout/error' }),
        { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle auth errors – clear session so client can retry fresh
    if (response.status === 401 || response.status === 403) {
      console.log(`[SESSION] expired → upstream returned ${response.status}, clearing session`);
      clearSession(sessionKey);
      await response.text(); // consume body

      return new Response(
        JSON.stringify({ error: `Upstream returned ${response.status}`, sessionExpired: true }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Session-Id': sessionKey } }
      );
    }

    if (!response.ok) {
      console.error('[proxy-stream] Upstream returned:', response.status);
      const body = await response.text();
      return new Response(
        JSON.stringify({ error: `Upstream returned ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Capture cookies from upstream
    captureUpstreamCookies(response, sessionKey);

    const contentType = response.headers.get('content-type') || '';
    const isPlaylist = targetUrl.includes('.m3u8') || contentType.includes('mpegurl') || contentType.includes('x-mpegURL');
    const isHtml = contentType.includes('text/html');

    const sessionHeaders = { 'X-Session-Id': sessionKey };

    // --- HTML page (embed) ---
    if (isHtml) {
      console.log('[proxy-stream] HTML detected, cleaning ads...');
      let html = await response.text();
      html = cleanHtml(html, targetUrl);

      return new Response(html, {
        headers: {
          ...corsHeaders, ...sessionHeaders,
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
          ...corsHeaders, ...sessionHeaders,
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Cache-Control': 'no-cache',
        },
      });
    }

    // --- Binary content (.ts, MP4, etc.) → stream through ---
    const responseHeaders: Record<string, string> = {
      ...corsHeaders, ...sessionHeaders,
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
