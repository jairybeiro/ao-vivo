import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const TMDB_API_KEY = Deno.env.get("TMDB_API_KEY");
    if (!TMDB_API_KEY) throw new Error("TMDB_API_KEY não configurada");

    const { tmdb_id, type, season_number } = await req.json();
    if (!tmdb_id) throw new Error("tmdb_id é obrigatório");

    const mediaType = type === "series" ? "tv" : "movie";

    // If requesting season episodes
    if (type === "series" && season_number != null) {
      const url = `https://api.themoviedb.org/3/tv/${tmdb_id}/season/${season_number}?api_key=${TMDB_API_KEY}&language=pt-BR`;
      const resp = await fetch(url);
      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(`TMDB retornou ${resp.status}: ${t}`);
      }
      const data = await resp.json();

      const episodes = (data.episodes || []).map((ep: any) => ({
        episode_number: ep.episode_number,
        name: ep.name || `Episódio ${ep.episode_number}`,
        overview: ep.overview || null,
        still_path: ep.still_path ? `https://image.tmdb.org/t/p/w500${ep.still_path}` : null,
        runtime: ep.runtime || null,
        air_date: ep.air_date || null,
        vote_average: ep.vote_average ? Math.round(ep.vote_average * 10) / 10 : null,
      }));

      return new Response(JSON.stringify({ season_number: data.season_number, episodes }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Default: fetch main details
    const url = `https://api.themoviedb.org/3/${mediaType}/${tmdb_id}?api_key=${TMDB_API_KEY}&language=pt-BR`;
    const resp = await fetch(url);
    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(`TMDB retornou ${resp.status}: ${t}`);
    }
    const data = await resp.json();

    const result: any = {
      name: mediaType === "tv" ? data.name : data.title,
      cover_url: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null,
      rating: data.vote_average ? Math.round(data.vote_average * 10) / 10 : null,
      plot: data.overview || null,
      category: data.genres?.[0]?.name || (mediaType === "tv" ? "Séries" : "Filmes"),
    };

    // For series, include season info
    if (mediaType === "tv" && data.seasons) {
      result.number_of_seasons = data.number_of_seasons || 0;
      result.seasons = data.seasons
        .filter((s: any) => s.season_number > 0)
        .map((s: any) => ({
          season_number: s.season_number,
          name: s.name,
          episode_count: s.episode_count,
          poster_path: s.poster_path ? `https://image.tmdb.org/t/p/w500${s.poster_path}` : null,
        }));
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("tmdb-lookup error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
