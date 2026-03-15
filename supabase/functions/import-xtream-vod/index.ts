import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface XtreamVod {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon: string;
  category_id: string;
  rating: string;
  container_extension: string;
}

interface XtreamSeries {
  series_id: number;
  name: string;
  cover: string;
  plot: string;
  category_id: string;
  rating: string;
}

interface XtreamCategory {
  category_id: string;
  category_name: string;
}

interface XtreamEpisode {
  id: string;
  episode_num: number;
  title: string;
  container_extension: string;
  info?: {
    duration_secs?: number;
    movie_image?: string;
  };
}

interface XtreamSeriesInfo {
  episodes: Record<string, XtreamEpisode[]>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));

    const dns = body.dns || 'http://ipsmart.icu';
    const username = body.username || '5541996151706';
    const password = body.password || '5541996151706';
    const importType = body.type || 'both'; // 'movies', 'series', 'both'

    const baseUrl = dns.replace(/\/$/, '');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let moviesInserted = 0;
    let moviesUpdated = 0;
    let seriesInserted = 0;
    let episodesInserted = 0;
    let errors = 0;

    // ========== MOVIES ==========
    if (importType === 'movies' || importType === 'both') {
      console.log('[import-vod] Fetching VOD categories...');
      const vodCatResp = await fetch(
        `${baseUrl}/player_api.php?username=${username}&password=${password}&action=get_vod_categories`
      );
      const vodCategories: XtreamCategory[] = await vodCatResp.json();
      const vodCatMap = new Map<string, string>();
      for (const cat of vodCategories) {
        vodCatMap.set(cat.category_id, cat.category_name);
      }

      console.log('[import-vod] Fetching VOD streams...');
      const vodResp = await fetch(
        `${baseUrl}/player_api.php?username=${username}&password=${password}&action=get_vod_streams`
      );
      const vodStreams: XtreamVod[] = await vodResp.json();
      console.log(`[import-vod] Got ${vodStreams.length} movies`);

      // Get existing by xtream_id
      const { data: existingMovies } = await supabase
        .from('vod_movies')
        .select('xtream_id');
      const existingMovieIds = new Set((existingMovies || []).map(m => m.xtream_id));

      const newMovies = vodStreams
        .filter(s => !existingMovieIds.has(s.stream_id))
        .map(s => ({
          name: s.name,
          category: vodCatMap.get(s.category_id) || 'Filmes',
          stream_url: `${baseUrl}/movie/${username}/${password}/${s.stream_id}.${s.container_extension || 'mp4'}`,
          cover_url: s.stream_icon || null,
          rating: s.rating ? parseFloat(s.rating) || null : null,
          xtream_id: s.stream_id,
          is_active: true,
        }));

      // Insert in batches
      const batchSize = 100;
      for (let i = 0; i < newMovies.length; i += batchSize) {
        const batch = newMovies.slice(i, i + batchSize);
        const { error } = await supabase.from('vod_movies').insert(batch);
        if (error) {
          console.error(`[import-vod] Movie batch ${i} error:`, error.message);
          errors++;
        } else {
          moviesInserted += batch.length;
        }
      }

      // Update existing movies' stream URLs
      const toUpdate = vodStreams.filter(s => existingMovieIds.has(s.stream_id));
      for (const s of toUpdate) {
        const streamUrl = `${baseUrl}/movie/${username}/${password}/${s.stream_id}.${s.container_extension || 'mp4'}`;
        const { error } = await supabase
          .from('vod_movies')
          .update({ stream_url: streamUrl, is_active: true })
          .eq('xtream_id', s.stream_id);
        if (!error) moviesUpdated++;
      }
    }

    // ========== SERIES ==========
    if (importType === 'series' || importType === 'both') {
      console.log('[import-vod] Fetching series categories...');
      const serCatResp = await fetch(
        `${baseUrl}/player_api.php?username=${username}&password=${password}&action=get_series_categories`
      );
      const serCategories: XtreamCategory[] = await serCatResp.json();
      const serCatMap = new Map<string, string>();
      for (const cat of serCategories) {
        serCatMap.set(cat.category_id, cat.category_name);
      }

      console.log('[import-vod] Fetching series...');
      const serResp = await fetch(
        `${baseUrl}/player_api.php?username=${username}&password=${password}&action=get_series`
      );
      const seriesList: XtreamSeries[] = await serResp.json();
      console.log(`[import-vod] Got ${seriesList.length} series`);

      // Get existing by xtream_id
      const { data: existingSeries } = await supabase
        .from('vod_series')
        .select('id, xtream_id');
      const existingSeriesMap = new Map<number, string>();
      for (const s of existingSeries || []) {
        if (s.xtream_id) existingSeriesMap.set(s.xtream_id, s.id);
      }

      // Process series (limit to first 200 to avoid timeout)
      const seriesToProcess = seriesList.slice(0, 200);

      for (const ser of seriesToProcess) {
        try {
          let seriesDbId = existingSeriesMap.get(ser.series_id);

          if (!seriesDbId) {
            // Insert new series
            const { data: inserted, error } = await supabase
              .from('vod_series')
              .insert({
                name: ser.name,
                category: serCatMap.get(ser.category_id) || 'Séries',
                cover_url: ser.cover || null,
                plot: ser.plot || null,
                rating: ser.rating ? parseFloat(ser.rating) || null : null,
                xtream_id: ser.series_id,
                is_active: true,
              })
              .select('id')
              .single();

            if (error) {
              console.error(`[import-vod] Series insert error (${ser.name}):`, error.message);
              errors++;
              continue;
            }
            seriesDbId = inserted.id;
            seriesInserted++;
          }

          // Fetch episodes for this series
          const epResp = await fetch(
            `${baseUrl}/player_api.php?username=${username}&password=${password}&action=get_series_info&series_id=${ser.series_id}`
          );
          const seriesInfo: XtreamSeriesInfo = await epResp.json();

          if (seriesInfo.episodes) {
            // Get existing episodes for this series
            const { data: existingEps } = await supabase
              .from('vod_episodes')
              .select('xtream_id')
              .eq('series_id', seriesDbId);
            const existingEpIds = new Set((existingEps || []).map(e => e.xtream_id));

            for (const [seasonNum, episodes] of Object.entries(seriesInfo.episodes)) {
              if (!Array.isArray(episodes)) continue;
              for (const ep of episodes) {
                const epXtreamId = parseInt(ep.id);
                if (existingEpIds.has(epXtreamId)) continue;

                const { error } = await supabase.from('vod_episodes').insert({
                  series_id: seriesDbId,
                  season: parseInt(seasonNum) || 1,
                  episode_num: ep.episode_num || 1,
                  title: ep.title || `Episódio ${ep.episode_num}`,
                  stream_url: `${baseUrl}/series/${username}/${password}/${ep.id}.${ep.container_extension || 'mp4'}`,
                  cover_url: ep.info?.movie_image || null,
                  duration_secs: ep.info?.duration_secs || null,
                  xtream_id: epXtreamId,
                });

                if (error) {
                  errors++;
                } else {
                  episodesInserted++;
                }
              }
            }
          }
        } catch (serErr) {
          console.error(`[import-vod] Series processing error (${ser.name}):`, serErr);
          errors++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        moviesInserted,
        moviesUpdated,
        seriesInserted,
        episodesInserted,
        errors,
        totalSeriesInApi: importType !== 'movies' ? 'check logs' : 'n/a',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[import-vod] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Import failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
