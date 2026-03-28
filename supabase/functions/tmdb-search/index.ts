import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mapeamento de categorias CineBusiness → TMDB keyword IDs (oficiais)
const CATEGORY_CONFIG: Record<string, { keywords?: string; genres?: string }> = {
  "Negócios": { keywords: "159983,186253" },
  "Empreendedorismo": { keywords: "159983,186456" },
  "Mentalidade": { keywords: "156214,235557" },
  "Liderança": { keywords: "14990,156214" },
  "Finanças": { keywords: "156441,211604" },
  "Marketing": { keywords: "6526,186253" },
  "Produtividade": { keywords: "156214,9673" },
  "Tecnologia": { keywords: "210108,14544" },
  "Desenvolvimento Pessoal": { keywords: "156214,4613,9673" },
  "Startups": { keywords: "159983,186456,210108" },
  "Documentários": { genres: "99" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const TMDB_API_KEY = Deno.env.get("TMDB_API_KEY");
    if (!TMDB_API_KEY) throw new Error("TMDB_API_KEY não configurada");

    const body = await req.json();
    const { query, type = "movie", category, mode = "search", page = 1 } = body;

    const mediaType = type === "series" ? "tv" : "movie";

    let url: string;

    if (mode === "discover" && category) {
      const config = CATEGORY_CONFIG[category];
      const params = new URLSearchParams({
        api_key: TMDB_API_KEY,
        language: "pt-BR",
        sort_by: "popularity.desc",
        "vote_count.gte": "50",
        page: String(page),
      });

      if (config?.genres) {
        params.set("with_genres", config.genres);
      } else if (config?.keywords) {
        params.set("with_keywords", config.keywords);
      } else {
        // Fallback: documentários
        params.set("with_genres", "99");
      }

      url = `https://api.themoviedb.org/3/discover/${mediaType}?${params.toString()}`;
    } else {
      if (!query || query.trim().length < 2) {
        throw new Error("Query deve ter pelo menos 2 caracteres");
      }
      url = `https://api.themoviedb.org/3/search/${mediaType}?api_key=${TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}&page=${page}`;
    }

    const searchResp = await fetch(url);
    if (!searchResp.ok) throw new Error(`TMDB request failed: ${searchResp.status}`);
    const searchData = await searchResp.json();

    const results = (searchData.results || []).slice(0, 15).map((item: any) => ({
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
