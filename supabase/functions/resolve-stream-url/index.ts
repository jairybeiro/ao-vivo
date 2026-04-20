const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ACTIVATION_SOURCE_HOSTS = new Set(["ipsmart.icu"]);
const HTTPS_DESTINATION_HOSTS = new Set(["vaicairmaisnao.xyz", "newoneblue.site"]);

const normalizeHost = (host: string) => host.replace(/^www\./i, "").toLowerCase();

const withProtocol = (url: string, protocol: "http:" | "https:") => {
  const parsed = new URL(url);
  parsed.protocol = protocol;
  return parsed.toString();
};

/**
 * Follow redirects manually to capture the final URL reliably.
 * Uses redirect:"manual" so we can read the Location header on 3xx responses.
 */
const resolveRedirects = async (url: string, maxRedirects = 5): Promise<{ ok: boolean; finalUrl: string; error?: string }> => {
  let current = url;

  for (let i = 0; i < maxRedirects; i++) {
    try {
      const response = await fetch(current, {
        method: "GET",
        redirect: "manual",
        headers: {
          "User-Agent": "Mozilla/5.0 (Lovable Stream Resolver)",
          Accept: "*/*",
          Range: "bytes=0-0",
        },
      });

      try { await response.body?.cancel(); } catch { /* no-op */ }

      const status = response.status;

      if (status >= 300 && status < 400) {
        const location = response.headers.get("location");
        if (!location) return { ok: false, finalUrl: current, error: `Redirect ${status} sem Location header` };

        // Resolve relative redirects
        current = new URL(location, current).toString();
        continue;
      }

      if (response.ok || status === 206) {
        return { ok: true, finalUrl: current };
      }

      return { ok: false, finalUrl: current, error: `HTTP ${status}` };
    } catch (error) {
      return { ok: false, finalUrl: current, error: error instanceof Error ? error.message : String(error) };
    }
  }

  return { ok: false, finalUrl: current, error: "Too many redirects" };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "URL inválida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const inputUrl = url.trim();
    const parsedInput = new URL(inputUrl);
    const inputHost = normalizeHost(parsedInput.hostname);

    if (!ACTIVATION_SOURCE_HOSTS.has(inputHost) && !HTTPS_DESTINATION_HOSTS.has(inputHost)) {
      return new Response(JSON.stringify({ resolvedUrl: inputUrl, activated: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 1: Activate via HTTP to follow the 302 redirect chain
    const httpUrl = withProtocol(inputUrl, "http:");
    const result = await resolveRedirects(httpUrl);

    if (!result.ok) {
      return new Response(JSON.stringify({ error: result.error || "Falha ao ativar stream" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let resolvedUrl = result.finalUrl;

    // Step 2: Always try to upgrade to HTTPS (required to avoid mixed-content blocks in browsers)
    if (resolvedUrl.startsWith("http://")) {
      const httpsCandidate = withProtocol(resolvedUrl, "https:");
      const httpsCheck = await resolveRedirects(httpsCandidate, 1);
      if (httpsCheck.ok) {
        resolvedUrl = httpsCandidate;
      } else {
        // Force HTTPS even if HEAD probe fails — many CDNs accept HTTPS for media even when probes don't.
        // Browsers will block mixed content otherwise.
        const finalHost = normalizeHost(new URL(resolvedUrl).hostname);
        if (HTTPS_DESTINATION_HOSTS.has(finalHost)) {
          resolvedUrl = httpsCandidate;
        } else {
          resolvedUrl = httpsCandidate; // best-effort: prefer HTTPS to keep playback functional in HTTPS context
        }
      }
    }

    console.log(`Resolved: ${inputUrl} → ${resolvedUrl}`);

    return new Response(
      JSON.stringify({
        resolvedUrl,
        discoveredUrl: result.finalUrl,
        activated: resolvedUrl !== inputUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
