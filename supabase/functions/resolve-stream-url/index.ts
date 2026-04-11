const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ACTIVATION_SOURCE_HOSTS = new Set(["ipsmart.icu"]);
const HTTPS_DESTINATION_HOSTS = new Set(["vaicairmaisnao.xyz"]);

const normalizeHost = (host: string) => host.replace(/^www\./i, "").toLowerCase();

const withProtocol = (url: string, protocol: "http:" | "https:") => {
  const parsed = new URL(url);
  parsed.protocol = protocol;
  return parsed.toString();
};

const probeStreamUrl = async (url: string) => {
  let lastError: string | null = null;

  for (const method of ["HEAD", "GET"] as const) {
    try {
      const response = await fetch(url, {
        method,
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0 (Lovable Stream Resolver)",
          Accept: "*/*",
          Range: "bytes=0-0",
        },
      });

      try {
        await response.body?.cancel();
      } catch {
        // no-op
      }

      if (response.ok) {
        return {
          ok: true,
          finalUrl: response.url || url,
          status: response.status,
          contentType: response.headers.get("content-type"),
        };
      }

      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  return {
    ok: false,
    finalUrl: url,
    status: 0,
    contentType: null,
    error: lastError,
  };
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

    let discoveredUrl = inputUrl;

    if (ACTIVATION_SOURCE_HOSTS.has(inputHost)) {
      const activationProbe = await probeStreamUrl(withProtocol(inputUrl, "http:"));

      if (!activationProbe.ok) {
        return new Response(JSON.stringify({ error: activationProbe.error || "Falha ao ativar stream" }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      discoveredUrl = activationProbe.finalUrl;
    }

    const discoveredHost = normalizeHost(new URL(discoveredUrl).hostname);
    let resolvedUrl = discoveredUrl;

    if (HTTPS_DESTINATION_HOSTS.has(discoveredHost) || discoveredUrl.startsWith("http://")) {
      const httpsCandidate = withProtocol(discoveredUrl, "https:");
      const httpsProbe = await probeStreamUrl(httpsCandidate);

      if (httpsProbe.ok) {
        resolvedUrl = httpsCandidate;
      }
    }

    return new Response(
      JSON.stringify({
        resolvedUrl,
        discoveredUrl,
        activated: resolvedUrl !== inputUrl,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
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