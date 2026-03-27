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

    const { query, type = "movie", genre_id, page = 1 } = await req.json();

    if (!query || query.trim().length < 2) {
      throw new Error("Query deve ter pelo menos 2 caracteres");
    }

    const mediaType = type === "series" ? "tv" : "movie";

    // Search TMDB
    const searchUrl = `https://api.themoviedb.org/3/search/${mediaType}?api_key=${TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}&page=${page}`;
    const searchResp = await fetch(searchUrl);
    if (!searchResp.ok) throw new Error(`TMDB search failed: ${searchResp.status}`);
    const searchData = await searchResp.json();

    // Map results
    const results = (searchData.results || []).slice(0, 20).map((item: any) => ({
      tmdb_id: item.id,
      title: mediaType === "tv" ? item.name : item.title,
      original_title: mediaType === "tv" ? item.original_name : item.original_title,
      overview: item.overview || null,
      poster_url: item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : null,
      backdrop_url: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : null,
      rating: item.vote_average ? Math.round(item.vote_average * 10) / 10 : null,
      release_date: item.release_date || item.first_air_date || null,
      genre_ids: item.genre_ids || [],
    }));

    // If a result is selected (has tmdb_id in the request), fetch full details + trailer
    return new Response(JSON.stringify({
      results,
      total_results: searchData.total_results || 0,
      total_pages: searchData.total_pages || 0,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("tmdb-search error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
