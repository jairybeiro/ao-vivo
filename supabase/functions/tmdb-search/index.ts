import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Estratégia híbrida: usar search com termos estratégicos por categoria
// O TMDB discover com keywords nichadas retorna 0 resultados para muitas categorias
// Então usamos search com termos em inglês que trazem filmes relevantes
const CATEGORY_SEARCH_TERMS: Record<string, string[]> = {
  "Negócios": ["wall street", "business", "corporate", "mogul"],
  "Empreendedorismo": ["entrepreneur", "startup", "founder", "self-made"],
  "Mentalidade": ["motivation", "mindset", "pursuit of happyness", "inspirational"],
  "Liderança": ["leader", "leadership", "king speech", "mandela"],
  "Finanças": ["finance", "money", "investment", "stock market"],
  "Marketing": ["advertising", "mad men", "social media", "marketing"],
  "Produtividade": ["productivity", "genius", "competition", "obsession"],
  "Tecnologia": ["silicon valley", "hacker", "computer", "artificial intelligence"],
  "Desenvolvimento Pessoal": ["self discovery", "transformation", "redemption"],
  "Startups": ["startup", "silicon valley", "dot com", "tech company"],
};

// Discover com genres para categorias que funcionam bem com genres
const CATEGORY_GENRES: Record<string, string> = {
  "Documentários": "99",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const TMDB_API_KEY = Deno.env.get("TMDB_API_KEY");
    if (!TMDB_API_KEY) throw new Error("TMDB_API_KEY não configurada");

    const body = await req.json();
    const { query, type = "movie", category, mode = "search", page = 1 } = body;

    const mediaType = type === "series" ? "tv" : "movie";

    if (mode === "discover" && category) {
      // Check if we have a genre-based category
      const genre = CATEGORY_GENRES[category];
      if (genre) {
        const params = new URLSearchParams({
          api_key: TMDB_API_KEY,
          language: "pt-BR",
          sort_by: "popularity.desc",
          "vote_count.gte": "50",
          page: String(page),
          with_genres: genre,
        });
        const url = `https://api.themoviedb.org/3/discover/${mediaType}?${params.toString()}`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`TMDB request failed: ${resp.status}`);
        const data = await resp.json();
        return new Response(JSON.stringify({
          results: mapResults(data.results || [], mediaType),
          total_results: data.total_results || 0,
          total_pages: data.total_pages || 0,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // For keyword-based categories, do parallel searches with multiple terms
      const terms = CATEGORY_SEARCH_TERMS[category] || ["business"];
      const allResults: any[] = [];
      const seenIds = new Set<number>();

      // Search with up to 3 terms in parallel
      const searches = terms.slice(0, 3).map(async (term) => {
        const url = `https://api.themoviedb.org/3/search/${mediaType}?api_key=${TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(term)}&page=1`;
        const resp = await fetch(url);
        if (!resp.ok) return [];
        const data = await resp.json();
        return data.results || [];
      });

      const searchResults = await Promise.all(searches);
      for (const results of searchResults) {
        for (const item of results) {
          if (!seenIds.has(item.id)) {
            seenIds.add(item.id);
            allResults.push(item);
          }
        }
      }

      // Sort by popularity and take top 15
      allResults.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

      return new Response(JSON.stringify({
        results: mapResults(allResults.slice(0, 15), mediaType),
        total_results: allResults.length,
        total_pages: 1,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Standard search mode
    if (!query || query.trim().length < 2) {
      throw new Error("Query deve ter pelo menos 2 caracteres");
    }
    const url = `https://api.themoviedb.org/3/search/${mediaType}?api_key=${TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}&page=${page}`;
    const searchResp = await fetch(url);
    if (!searchResp.ok) throw new Error(`TMDB request failed: ${searchResp.status}`);
    const searchData = await searchResp.json();

    return new Response(JSON.stringify({
      results: mapResults((searchData.results || []).slice(0, 15), mediaType),
      total_results: searchData.total_results || 0,
      total_pages: searchData.total_pages || 0,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("tmdb-search error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function mapResults(results: any[], mediaType: string) {
  return results.map((item: any) => ({
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
}
