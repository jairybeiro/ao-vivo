import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const TMDB_API_KEY = Deno.env.get("TMDB_API_KEY");
    if (!TMDB_API_KEY) throw new Error("TMDB_API_KEY não configurada");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { type } = body; // "movies" or "series"
    const table = type === "movies" ? "vod_movies" : "vod_series";
    const mediaType = type === "movies" ? "movie" : "tv";

    // Fetch items missing backdrop_url or trailer_url
    const { data: items, error } = await sb
      .from(table)
      .select("id, name, backdrop_url, trailer_url")
      .or("backdrop_url.is.null,trailer_url.is.null")
      .limit(50);

    if (error) throw error;
    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ updated: 0, total: 0, message: "Nada para atualizar" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let updated = 0;

    for (const item of items) {
      try {
        // Search TMDB by name
        const searchUrl = `https://api.themoviedb.org/3/search/${mediaType}?api_key=${TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(item.name)}`;
        const searchResp = await fetch(searchUrl);
        if (!searchResp.ok) continue;
        const searchData = await searchResp.json();
        const first = searchData.results?.[0];
        if (!first) continue;

        const updatePayload: Record<string, string | null> = {};

        // Backdrop
        if (!item.backdrop_url && first.backdrop_path) {
          updatePayload.backdrop_url = `https://image.tmdb.org/t/p/w1280${first.backdrop_path}`;
        }

        // Trailer - fetch videos
        if (!item.trailer_url) {
          const videosUrl = `https://api.themoviedb.org/3/${mediaType}/${first.id}/videos?api_key=${TMDB_API_KEY}&language=pt-BR`;
          const videosResp = await fetch(videosUrl);
          if (videosResp.ok) {
            const videosData = await videosResp.json();
            let trailer = videosData.results?.find(
              (v: any) => v.type === "Trailer" && v.site === "YouTube"
            );
            // Fallback to English
            if (!trailer) {
              const videosUrlEn = `https://api.themoviedb.org/3/${mediaType}/${first.id}/videos?api_key=${TMDB_API_KEY}&language=en-US`;
              const videosRespEn = await fetch(videosUrlEn);
              if (videosRespEn.ok) {
                const videosDataEn = await videosRespEn.json();
                trailer = videosDataEn.results?.find(
                  (v: any) => v.type === "Trailer" && v.site === "YouTube"
                );
              }
            }
            if (trailer) {
              updatePayload.trailer_url = `https://www.youtube.com/watch?v=${trailer.key}`;
            }
          }
        }

        if (Object.keys(updatePayload).length > 0) {
          await sb.from(table).update(updatePayload).eq("id", item.id);
          updated++;
        }

        // Small delay to respect TMDB rate limiting
        await new Promise(r => setTimeout(r, 250));
      } catch (e) {
        console.error(`Error processing ${item.name}:`, e);
      }
    }

    return new Response(JSON.stringify({ updated, total: items.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("bulk-update-tmdb error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
