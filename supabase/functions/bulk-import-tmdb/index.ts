import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function fetchTrailer(apiKey: string, mediaType: string, tmdbId: number): Promise<string | null> {
  for (const lang of ["pt-BR", "en-US"]) {
    try {
      const resp = await fetch(`https://api.themoviedb.org/3/${mediaType}/${tmdbId}/videos?api_key=${apiKey}&language=${lang}`);
      if (resp.ok) {
        const data = await resp.json();
        const trailer = data.results?.find((v: any) => v.type === "Trailer" && v.site === "YouTube");
        if (trailer) return `https://www.youtube.com/watch?v=${trailer.key}`;
      }
    } catch { /* silent */ }
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const TMDB_API_KEY = Deno.env.get("TMDB_API_KEY");
    if (!TMDB_API_KEY) throw new Error("TMDB_API_KEY não configurada");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { tmdb_ids, type, category_tag } = body;
    // tmdb_ids: number[], type: "movie"|"series", category_tag: string

    if (!Array.isArray(tmdb_ids) || tmdb_ids.length === 0) {
      throw new Error("tmdb_ids deve ser um array não-vazio");
    }
    if (tmdb_ids.length > 50) {
      throw new Error("Máximo de 50 IDs por vez");
    }

    const mediaType = type === "series" ? "tv" : "movie";
    const table = type === "series" ? "vod_series" : "vod_movies";

    const results: { tmdb_id: number; name: string; status: string }[] = [];

    for (const id of tmdb_ids) {
      const tmdbId = Number(id);
      if (isNaN(tmdbId)) {
        results.push({ tmdb_id: id, name: "?", status: "ID inválido" });
        continue;
      }

      try {
        // Check if already exists
        const { data: existing } = await sb.from(table).select("id").eq("tmdb_id", tmdbId).maybeSingle();
        if (existing) {
          results.push({ tmdb_id: tmdbId, name: "—", status: "Já existe" });
          continue;
        }

        // Fetch details
        const detailResp = await fetch(`https://api.themoviedb.org/3/${mediaType}/${tmdbId}?api_key=${TMDB_API_KEY}&language=pt-BR`);
        if (!detailResp.ok) {
          results.push({ tmdb_id: tmdbId, name: "?", status: `TMDB erro ${detailResp.status}` });
          continue;
        }
        const data = await detailResp.json();
        const name = mediaType === "tv" ? data.name : data.title;
        const trailerUrl = await fetchTrailer(TMDB_API_KEY, mediaType, tmdbId);

        // Fetch IMDb ID
        let imdb_id: string | null = null;
        try {
          const extResp = await fetch(`https://api.themoviedb.org/3/${mediaType}/${tmdbId}/external_ids?api_key=${TMDB_API_KEY}`);
          if (extResp.ok) {
            const extData = await extResp.json();
            imdb_id = extData.imdb_id || null;
          }
        } catch { /* silent */ }

        const xtreamId = -Math.floor(Math.random() * 900000 + 100000);
        const record: any = {
          name,
          category: data.genres?.[0]?.name || (type === "series" ? "Séries" : "Filmes"),
          cover_url: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null,
          backdrop_url: data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : null,
          rating: data.vote_average ? Math.round(data.vote_average * 10) / 10 : null,
          trailer_url: trailerUrl,
          category_tag: category_tag || null,
          xtream_id: xtreamId,
          tmdb_id: tmdbId,
          is_active: true,
        };

        if (type === "movie") {
          record.stream_url = "pending";
        }
        if (type === "series") {
          record.plot = data.overview || null;
        }

        const { error } = await sb.from(table).insert(record);
        if (error) {
          results.push({ tmdb_id: tmdbId, name, status: `Erro: ${error.message}` });
        } else {
          results.push({ tmdb_id: tmdbId, name, status: "Importado" });
        }

        // Rate limit
        await new Promise(r => setTimeout(r, 300));
      } catch (e) {
        results.push({ tmdb_id: tmdbId, name: "?", status: `Erro: ${(e as Error).message}` });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
