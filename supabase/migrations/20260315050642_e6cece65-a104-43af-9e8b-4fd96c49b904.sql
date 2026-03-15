CREATE UNIQUE INDEX IF NOT EXISTS vod_movies_xtream_id_key ON vod_movies(xtream_id) WHERE xtream_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS vod_series_xtream_id_key ON vod_series(xtream_id) WHERE xtream_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS vod_episodes_xtream_id_key ON vod_episodes(xtream_id) WHERE xtream_id IS NOT NULL;