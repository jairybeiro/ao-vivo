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

// Helper: fetch all existing xtream_ids from a table
async function getAllExistingXtreamIds(supabase: any, table: string): Promise<Set<number>> {
  const ids = new Set<number>();
  let from = 0;
  const batchSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select('xtream_id')
      .range(from, from + batchSize - 1);
    if (error || !data || data.length === 0) break;
    for (const row of data) ids.add(row.xtream_id);
    if (data.length < batchSize) break;
    from += batchSize;
  }
  return ids;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));

    const dns = body.dns || '';
    const username = body.username || '';
    const password = body.password || '';
    const importType = body.type || 'both';
    const page = body.page || 0;
    const pageSize = body.pageSize || 200;
    const mode = body.mode || 'import';

    if (!dns || !username || !password) {
      return new Response(
        JSON.stringify({ error: 'DNS, username and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const baseUrl = dns.replace(/\/$/, '');

    const ADULT_KEYWORDS = ['adult', 'adulto', 'xxx', 'porn', '18+', 'erotic', 'erótic'];
    const isAdultCat = (cat: string) => ADULT_KEYWORDS.some(kw => cat.toLowerCase().includes(kw));

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ========== CHECK MODE ==========
    if (mode === 'check') {
      let moviesInApi = 0;
      let seriesInApi = 0;
      let moviesInDb = 0;
      let seriesInDb = 0;

      if (importType === 'movies' || importType === 'both') {
        const vodResp = await fetch(
          `${baseUrl}/player_api.php?username=${username}&password=${password}&action=get_vod_streams`
        );
        const vodStreams: XtreamVod[] = await vodResp.json();
        moviesInApi = vodStreams.length;

        const existingIds = await getAllExistingXtreamIds(supabase, 'vod_movies');
        moviesInDb = existingIds.size;
      }

      if (importType === 'series' || importType === 'both') {
        const serResp = await fetch(
          `${baseUrl}/player_api.php?username=${username}&password=${password}&action=get_series`
        );
        const seriesList: XtreamSeries[] = await serResp.json();
        seriesInApi = seriesList.length;

        const existingIds = await getAllExistingXtreamIds(supabase, 'vod_series');
        seriesInDb = existingIds.size;
      }

      return new Response(
        JSON.stringify({
          mode: 'check',
          moviesInApi,
          moviesInDb,
          newMovies: Math.max(0, moviesInApi - moviesInDb),
          seriesInApi,
          seriesInDb,
          newSeries: Math.max(0, seriesInApi - seriesInDb),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========== IMPORT MODE ==========
    // Key optimization: fetch ALL from API, filter out existing, paginate only NEW items
    let moviesInserted = 0;
    let seriesInserted = 0;
    let episodesInserted = 0;
    let errors = 0;
    let totalNew = 0;
    let hasMore = false;

    // ========== MOVIES ==========
    if (importType === 'movies') {
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

      // Get ALL existing IDs from DB at once
      const existingIds = await getAllExistingXtreamIds(supabase, 'vod_movies');
      
      // Filter to only NEW items
      const newItems = vodStreams.filter(s => !existingIds.has(s.stream_id));
      totalNew = newItems.length;

      console.log(`[import-vod] Movies: ${vodStreams.length} in API, ${existingIds.size} in DB, ${totalNew} new`);

      if (totalNew === 0) {
        return new Response(
          JSON.stringify({ success: true, moviesInserted: 0, seriesInserted: 0, episodesInserted: 0, errors: 0, totalNew: 0, hasMore: false, page }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Paginate only the new items
      const startIdx = page * pageSize;
      const slice = newItems.slice(startIdx, startIdx + pageSize);
      hasMore = (startIdx + pageSize) < totalNew;

      console.log(`[import-vod] Processing ${slice.length} new movies (page ${page})`);

      const movieRows = slice.map(s => ({
        name: s.name,
        category: vodCatMap.get(s.category_id) || 'Filmes',
        stream_url: `${baseUrl}/movie/${username}/${password}/${s.stream_id}.${s.container_extension || 'mp4'}`,
        cover_url: s.stream_icon || null,
        rating: s.rating ? parseFloat(s.rating) || null : null,
        xtream_id: s.stream_id,
        is_active: true,
      }));

      const batchSize = 500;
      for (let i = 0; i < movieRows.length; i += batchSize) {
        const batch = movieRows.slice(i, i + batchSize);
        const { error } = await supabase
          .from('vod_movies')
          .upsert(batch, { onConflict: 'xtream_id', ignoreDuplicates: true });
        if (error) {
          console.error(`[import-vod] Movie batch error:`, error.message);
          errors++;
        } else {
          moviesInserted += batch.length;
        }
      }
    }

    // ========== SERIES ==========
    if (importType === 'series') {
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

      // Get ALL existing series IDs at once
      const existingIds = await getAllExistingXtreamIds(supabase, 'vod_series');
      
      // Filter to only NEW series
      const newSeries = seriesList.filter(s => !existingIds.has(s.series_id));
      totalNew = newSeries.length;

      console.log(`[import-vod] Series: ${seriesList.length} in API, ${existingIds.size} in DB, ${totalNew} new`);

      if (totalNew === 0) {
        return new Response(
          JSON.stringify({ success: true, moviesInserted: 0, seriesInserted: 0, episodesInserted: 0, errors: 0, totalNew: 0, hasMore: false, page }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Paginate only the new series
      const startIdx = page * pageSize;
      const seriesToProcess = newSeries.slice(startIdx, startIdx + pageSize);
      hasMore = (startIdx + pageSize) < totalNew;

      console.log(`[import-vod] Processing ${seriesToProcess.length} new series (page ${page})`);

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
          .upsert(seriesRows, { onConflict: 'xtream_id', ignoreDuplicates: true });
        if (error) {
          console.error('[import-vod] Series upsert error:', error.message);
          errors++;
        } else {
          seriesInserted += seriesRows.length;
        }
      }

      // Fetch episodes only for new series
      for (const ser of seriesToProcess) {
        try {
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

            if (episodeRows.length > 0) {
              for (let i = 0; i < episodeRows.length; i += 200) {
                const batch = episodeRows.slice(i, i + 200);
                const { error } = await supabase
                  .from('vod_episodes')
                  .upsert(batch, { onConflict: 'xtream_id', ignoreDuplicates: true });
                if (error) {
                  console.error(`[import-vod] Episode error (${ser.name}):`, error.message);
                  errors++;
                } else {
                  episodesInserted += batch.length;
                }
              }
            }
          }
        } catch (serErr) {
          console.error(`[import-vod] Series error (${ser.name}):`, serErr);
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
        totalNew,
        hasMore,
        page,
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
