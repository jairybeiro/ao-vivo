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
    const seriesPage = body.seriesPage || 0; // pagination for series
    const seriesPageSize = body.seriesPageSize || 50; // how many series per call

    const baseUrl = dns.replace(/\/$/, '');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let moviesInserted = 0;
    let seriesInserted = 0;
    let episodesInserted = 0;
    let errors = 0;
    let totalSeriesInApi = 0;
    let totalMoviesInApi = 0;
    let hasMoreSeries = false;

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
      totalMoviesInApi = vodStreams.length;
      console.log(`[import-vod] Got ${vodStreams.length} movies`);

      const movieRows = vodStreams.map(s => ({
        name: s.name,
        category: vodCatMap.get(s.category_id) || 'Filmes',
        stream_url: `${baseUrl}/movie/${username}/${password}/${s.stream_id}.${s.container_extension || 'mp4'}`,
        cover_url: s.stream_icon || null,
        rating: s.rating ? parseFloat(s.rating) || null : null,
        xtream_id: s.stream_id,
        is_active: true,
      }));

      // Upsert in batches
      const batchSize = 200;
      for (let i = 0; i < movieRows.length; i += batchSize) {
        const batch = movieRows.slice(i, i + batchSize);
        const { error } = await supabase
          .from('vod_movies')
          .upsert(batch, { onConflict: 'xtream_id', ignoreDuplicates: false });
        if (error) {
          console.error(`[import-vod] Movie batch ${i} error:`, error.message);
          errors++;
        } else {
          moviesInserted += batch.length;
        }
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

      console.log('[import-vod] Fetching series list...');
      const serResp = await fetch(
        `${baseUrl}/player_api.php?username=${username}&password=${password}&action=get_series`
      );
      const seriesList: XtreamSeries[] = await serResp.json();
      totalSeriesInApi = seriesList.length;
      console.log(`[import-vod] Got ${seriesList.length} series total, processing page ${seriesPage} (size ${seriesPageSize})`);

      // Paginate series processing
      const startIdx = seriesPage * seriesPageSize;
      const seriesToProcess = seriesList.slice(startIdx, startIdx + seriesPageSize);
      hasMoreSeries = (startIdx + seriesPageSize) < seriesList.length;

      // Batch upsert series metadata first
      const seriesRows = seriesToProcess.map(ser => ({
        name: ser.name,
        category: serCatMap.get(ser.category_id) || 'Séries',
        cover_url: ser.cover || null,
        plot: ser.plot || null,
        rating: ser.rating ? parseFloat(ser.rating) || null : null,
        xtream_id: ser.series_id,
        is_active: true,
      }));

      if (seriesRows.length > 0) {
        const { error } = await supabase
          .from('vod_series')
          .upsert(seriesRows, { onConflict: 'xtream_id', ignoreDuplicates: false });
        if (error) {
          console.error('[import-vod] Series batch upsert error:', error.message);
          errors++;
        } else {
          seriesInserted += seriesRows.length;
        }
      }

      // Now fetch episodes for each series in this page
      for (const ser of seriesToProcess) {
        try {
          // Get the DB id for this series
          const { data: seriesRow } = await supabase
            .from('vod_series')
            .select('id')
            .eq('xtream_id', ser.series_id)
            .single();

          if (!seriesRow) continue;

          const epResp = await fetch(
            `${baseUrl}/player_api.php?username=${username}&password=${password}&action=get_series_info&series_id=${ser.series_id}`
          );
          const seriesInfo: XtreamSeriesInfo = await epResp.json();

          if (seriesInfo.episodes) {
            const episodeRows: any[] = [];
            for (const [seasonNum, episodes] of Object.entries(seriesInfo.episodes)) {
              if (!Array.isArray(episodes)) continue;
              for (const ep of episodes) {
                episodeRows.push({
                  series_id: seriesRow.id,
                  season: parseInt(seasonNum) || 1,
                  episode_num: ep.episode_num || 1,
                  title: ep.title || `Episódio ${ep.episode_num}`,
                  stream_url: `${baseUrl}/series/${username}/${password}/${ep.id}.${ep.container_extension || 'mp4'}`,
                  cover_url: ep.info?.movie_image || null,
                  duration_secs: ep.info?.duration_secs || null,
                  xtream_id: parseInt(ep.id),
                });
              }
            }

            // Batch upsert episodes
            if (episodeRows.length > 0) {
              const epBatchSize = 100;
              for (let i = 0; i < episodeRows.length; i += epBatchSize) {
                const batch = episodeRows.slice(i, i + epBatchSize);
                const { error } = await supabase
                  .from('vod_episodes')
                  .upsert(batch, { onConflict: 'xtream_id', ignoreDuplicates: false });
                if (error) {
                  console.error(`[import-vod] Episode batch error (${ser.name}):`, error.message);
                  errors++;
                } else {
                  episodesInserted += batch.length;
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
        seriesInserted,
        episodesInserted,
        errors,
        totalMoviesInApi,
        totalSeriesInApi,
        hasMoreSeries,
        seriesPage,
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
