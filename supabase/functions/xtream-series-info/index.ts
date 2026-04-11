const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { host, username, password, series_id } = await req.json();

    if (!host || !username || !password || !series_id) {
      return new Response(
        JSON.stringify({ error: "Parâmetros inválidos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanHost = host.replace(/\/+$/, "");
    const apiUrl = `${cleanHost}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_series_info&series_id=${series_id}`;

    const response = await fetch(apiUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `API retornou ${response.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const info = data.info || {};
    const seasons = data.episodes || {};

    // Build episodes list organized by season
    const episodes: any[] = [];
    for (const [seasonNum, episodeList] of Object.entries(seasons)) {
      if (!Array.isArray(episodeList)) continue;
      for (const ep of episodeList) {
        const ext = ep.container_extension || "mp4";
        const streamUrl = `${cleanHost}/series/${encodeURIComponent(username)}/${encodeURIComponent(password)}/${ep.id}.${ext}`;
        episodes.push({
          id: ep.id,
          season: parseInt(seasonNum),
          episode_num: ep.episode_num || 1,
          title: ep.title || `Episódio ${ep.episode_num || 1}`,
          stream_url: streamUrl,
          cover_url: ep.info?.movie_image || ep.info?.cover_big || null,
          duration_secs: ep.info?.duration_secs || null,
          plot: ep.info?.plot || null,
          container_extension: ext,
        });
      }
    }

    return new Response(
      JSON.stringify({
        info: {
          name: info.name || "Sem nome",
          cover_url: info.cover || null,
          backdrop_url: info.backdrop_path ? `https://image.tmdb.org/t/p/w1280${info.backdrop_path}` : null,
          plot: info.plot || null,
          rating: info.rating || null,
          tmdb_id: info.tmdb_id || null,
        },
        episodes,
        season_count: Object.keys(seasons).length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
