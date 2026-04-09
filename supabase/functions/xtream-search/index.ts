const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { host, username, password, search, type = "movie" } = await req.json();

    if (!host || !username || !password || !search || search.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: "Parâmetros inválidos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanHost = host.replace(/\/+$/, "");
    const action = type === "series" ? "get_series" : "get_vod_streams";
    const apiUrl = `${cleanHost}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=${action}`;

    const response = await fetch(apiUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `API retornou ${response.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const allStreams = await response.json();

    if (!Array.isArray(allStreams)) {
      return new Response(
        JSON.stringify({ error: "Resposta inesperada da API", results: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const searchLower = search.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const results = allStreams
      .filter((item: any) => {
        const name = (item.name || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return name.includes(searchLower);
      })
      .slice(0, 30)
      .map((item: any) => {
        if (type === "series") {
          return {
            series_id: item.series_id,
            name: item.name || "Sem nome",
            cover_url: item.cover || null,
            rating: item.rating || null,
            category_id: item.category_id || null,
            plot: item.plot || null,
            last_modified: item.last_modified || null,
          };
        }

        const streamId = item.stream_id;
        const ext = item.container_extension || "mp4";
        const streamUrl = `${cleanHost}/movie/${encodeURIComponent(username)}/${encodeURIComponent(password)}/${streamId}.${ext}`;

        return {
          stream_id: streamId,
          name: item.name || "Sem nome",
          stream_url: streamUrl,
          cover_url: item.stream_icon || null,
          rating: item.rating || null,
          category_id: item.category_id || null,
          container_extension: ext,
          added: item.added || null,
        };
      });

    return new Response(
      JSON.stringify({ results, total_found: results.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
