import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function fetchTrailer(apiKey: string, mediaType: string, tmdbId: number | string): Promise<string | null> {
  try {
    // Try pt-BR first
    const url = `https://api.themoviedb.org/3/${mediaType}/${tmdbId}/videos?api_key=${apiKey}&language=pt-BR`;
    const resp = await fetch(url);
    if (resp.ok) {
      const data = await resp.json();
      const trailer = data.results?.find((v: any) => v.type === "Trailer" && v.site === "YouTube");
      if (trailer) return `https://www.youtube.com/watch?v=${trailer.key}`;
    }
    // Fallback en-US
    const urlEn = `https://api.themoviedb.org/3/${mediaType}/${tmdbId}/videos?api_key=${apiKey}&language=en-US`;
    const respEn = await fetch(urlEn);
    if (respEn.ok) {
      const dataEn = await respEn.json();
      const trailer = dataEn.results?.find((v: any) => v.type === "Trailer" && v.site === "YouTube");
      if (trailer) return `https://www.youtube.com/watch?v=${trailer.key}`;
    }
  } catch { /* silent */ }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const TMDB_API_KEY = Deno.env.get("TMDB_API_KEY");
    if (!TMDB_API_KEY) throw new Error("TMDB_API_KEY não configurada");

    const body = await req.json();
    const { tmdb_id, type, season_number, search_name } = body;

    // Search mode: find by name and return backdrop + trailer
    if (search_name) {
      const mediaType = type === "series" ? "tv" : "movie";
      const searchUrl = `https://api.themoviedb.org/3/search/${mediaType}?api_key=${TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(search_name)}`;
      const searchResp = await fetch(searchUrl);
      if (!searchResp.ok) throw new Error(`TMDB search failed: ${searchResp.status}`);
      const searchData = await searchResp.json();
      const first = searchData.results?.[0];
      if (!first) {
        return new Response(JSON.stringify({ backdrop_url: null, plot: null, trailer_url: null }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const trailerUrl = await fetchTrailer(TMDB_API_KEY, mediaType, first.id);
      return new Response(JSON.stringify({
        backdrop_url: first.backdrop_path ? `https://image.tmdb.org/t/p/w1280${first.backdrop_path}` : null,
        plot: first.overview || null,
        name: mediaType === "tv" ? first.name : first.title,
        rating: first.vote_average ? Math.round(first.vote_average * 10) / 10 : null,
        trailer_url: trailerUrl,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    // Default: fetch main details + trailer
    const url = `https://api.themoviedb.org/3/${mediaType}/${tmdb_id}?api_key=${TMDB_API_KEY}&language=pt-BR`;
    const resp = await fetch(url);
    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(`TMDB retornou ${resp.status}: ${t}`);
    }
    const data = await resp.json();

    const trailerUrl = await fetchTrailer(TMDB_API_KEY, mediaType, tmdb_id);

    const result: any = {
      name: mediaType === "tv" ? data.name : data.title,
      cover_url: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null,
      backdrop_url: data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : null,
      rating: data.vote_average ? Math.round(data.vote_average * 10) / 10 : null,
      plot: data.overview || null,
      category: data.genres?.[0]?.name || (mediaType === "tv" ? "Séries" : "Filmes"),
      trailer_url: trailerUrl,
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
