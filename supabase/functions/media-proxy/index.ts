const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, range",
  "Access-Control-Expose-Headers": "accept-ranges, content-length, content-range, content-type",
};

const playlistFor = (requestUrl: URL, sourceUrl: string) => {
  const segmentUrl = new URLSearchParams(requestUrl.searchParams);
  segmentUrl.delete("format");
  if (!segmentUrl.get("url")) {
    segmentUrl.set("url", sourceUrl);
  }

  return [
    "#EXTM3U",
    "#EXT-X-VERSION:3",
    "#EXT-X-TARGETDURATION:14400",
    "#EXT-X-MEDIA-SEQUENCE:0",
    `#EXTINF:14400.0,${sourceUrl}`,
    `?${segmentUrl.toString()}`,
    "#EXT-X-ENDLIST",
  ].join("\n");
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const requestUrl = new URL(req.url);
    let sourceUrl = requestUrl.searchParams.get("url")?.trim();
    let format = requestUrl.searchParams.get("format");

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      sourceUrl = sourceUrl || body?.url?.trim();
      format = format || body?.format || null;
    }

    if (!sourceUrl) {
      return new Response(JSON.stringify({ error: "URL ausente" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (format === "m3u8") {
      return new Response(playlistFor(requestUrl, sourceUrl), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/vnd.apple.mpegurl; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }

    const range = req.headers.get("range");
    const upstream = await fetch(sourceUrl, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Lovable Media Proxy)",
        Accept: "*/*",
        ...(range ? { Range: range } : {}),
      },
    });

    const headers = new Headers(corsHeaders);
    headers.set("Cache-Control", "no-store");

    const contentType = upstream.headers.get("content-type") || "application/octet-stream";
    headers.set("Content-Type", contentType);

    const contentLength = upstream.headers.get("content-length");
    if (contentLength) headers.set("Content-Length", contentLength);

    const contentRange = upstream.headers.get("content-range");
    if (contentRange) headers.set("Content-Range", contentRange);

    const acceptRanges = upstream.headers.get("accept-ranges") || "bytes";
    headers.set("Accept-Ranges", acceptRanges);

    return new Response(upstream.body, {
      status: upstream.status,
      headers,
    });
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