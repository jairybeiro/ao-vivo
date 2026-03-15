// Web Worker for VOD import - runs independently of tab focus

interface ImportMessage {
  type: 'start' | 'cancel';
  config?: {
    dns: string;
    username: string;
    password: string;
    importType: 'movies' | 'series' | 'both';
    supabaseUrl: string;
    supabaseKey: string;
  };
}

interface ImportResult {
  moviesInserted: number;
  seriesInserted: number;
  episodesInserted: number;
  errors: number;
  totalInApi: number;
  hasMore: boolean;
  page: number;
}

let cancelled = false;

const callImport = async (
  config: NonNullable<ImportMessage['config']>,
  type: 'movies' | 'series',
  page: number,
  pageSize: number
): Promise<ImportResult> => {
  const response = await fetch(`${config.supabaseUrl}/functions/v1/import-xtream-vod`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: config.supabaseKey,
      Authorization: `Bearer ${config.supabaseKey}`,
    },
    body: JSON.stringify({
      dns: config.dns,
      username: config.username,
      password: config.password,
      type,
      page,
      pageSize,
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Erro na importação');
  return data;
};

const importPaginated = async (
  config: ImportMessage['config']!,
  type: 'movies' | 'series',
  pageSize: number
) => {
  let page = 0;
  const totals = { movies: 0, series: 0, episodes: 0, errors: 0 };

  self.postMessage({
    type: 'progress',
    phase: `Carregando ${type === 'movies' ? 'filmes' : 'séries'}...`,
    current: 0,
    total: 1,
  });

  const first = await callImport(config, type, 0, pageSize);
  const totalItems = first.totalInApi;
  totals.movies += first.moviesInserted;
  totals.series += first.seriesInserted;
  totals.episodes += first.episodesInserted;
  totals.errors += first.errors;

  const totalPages = Math.ceil(totalItems / pageSize);

  self.postMessage({
    type: 'progress',
    phase: `${type === 'movies' ? 'Filmes' : 'Séries'}: página 1 de ${totalPages} (${totalItems} itens)`,
    current: 1,
    total: totalPages,
  });

  page = 1;
  while (first.hasMore && page < totalPages) {
    if (cancelled) throw new Error('Cancelado');

    self.postMessage({
      type: 'progress',
      phase: `${type === 'movies' ? 'Filmes' : 'Séries'}: página ${page + 1} de ${totalPages}`,
      current: page + 1,
      total: totalPages,
    });

    const result = await callImport(config, type, page, pageSize);
    totals.movies += result.moviesInserted;
    totals.series += result.seriesInserted;
    totals.episodes += result.episodesInserted;
    totals.errors += result.errors;

    if (!result.hasMore) break;
    page++;
  }

  return totals;
};

self.onmessage = async (e: MessageEvent<ImportMessage>) => {
  if (e.data.type === 'cancel') {
    cancelled = true;
    return;
  }

  if (e.data.type === 'start' && e.data.config) {
    cancelled = false;
    const config = e.data.config;
    const totals = { movies: 0, series: 0, episodes: 0, errors: 0 };

    try {
      if (config.importType === 'movies' || config.importType === 'both') {
        const r = await importPaginated(config, 'movies', 500);
        totals.movies += r.movies;
        totals.errors += r.errors;
      }

      if (cancelled) throw new Error('Cancelado');

      if (config.importType === 'series' || config.importType === 'both') {
        const r = await importPaginated(config, 'series', 30);
        totals.series += r.series;
        totals.episodes += r.episodes;
        totals.errors += r.errors;
      }

      self.postMessage({ type: 'done', totals });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      self.postMessage({
        type: msg === 'Cancelado' ? 'cancelled' : 'error',
        message: msg,
        totals: totals.movies || totals.series || totals.episodes ? totals : null,
      });
    }
  }
};
