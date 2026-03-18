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

    const { tmdb_id, type } = await req.json();
    if (!tmdb_id) throw new Error("tmdb_id é obrigatório");

    const mediaType = type === "series" ? "tv" : "movie";
    const url = `https://api.themoviedb.org/3/${mediaType}/${tmdb_id}?api_key=${TMDB_API_KEY}&language=pt-BR`;

    const resp = await fetch(url);
    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(`TMDB retornou ${resp.status}: ${t}`);
    }

    const data = await resp.json();

    const result = {
      name: mediaType === "tv" ? data.name : data.title,
      cover_url: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null,
      rating: data.vote_average ? Math.round(data.vote_average * 10) / 10 : null,
      plot: data.overview || null,
      category: data.genres?.[0]?.name || (mediaType === "tv" ? "Séries" : "Filmes"),
    };

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
