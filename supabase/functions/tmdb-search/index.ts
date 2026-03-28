import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mapeamento de categorias CineBusiness → TMDB keyword IDs
const CATEGORY_KEYWORDS: Record<string, string> = {
  "Negócios": "159983",
  "Empreendedorismo": "186456,159983",
  "Mentalidade": "158957,9673",
  "Liderança": "14990",
  "Finanças": "3565,12554",
  "Marketing": "6526",
  "Produtividade": "180305",
  "Tecnologia": "9672",
  "Desenvolvimento Pessoal": "4613,9673",
  "Startups": "220984,159983",
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
      // Discover mode: busca por categoria/keywords
      const keywords = CATEGORY_KEYWORDS[category] || "";
      const params = new URLSearchParams({
        api_key: TMDB_API_KEY,
        language: "pt-BR",
        sort_by: "vote_average.desc",
        "vote_count.gte": "100",
        page: String(page),
        with_keywords: keywords,
      });
      // Fallback: se não tem keyword mapeada, busca documentários de negócios
      if (!keywords) {
        params.set("with_genres", "99"); // Documentário
      }
      url = `https://api.themoviedb.org/3/discover/${mediaType}?${params.toString()}`;
    } else {
      // Search mode: busca por texto
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
