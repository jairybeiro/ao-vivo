
-- Drop partial unique indexes that don't work with upsert
DROP INDEX IF EXISTS vod_movies_xtream_id_key;
DROP INDEX IF EXISTS vod_series_xtream_id_key;
DROP INDEX IF EXISTS vod_episodes_xtream_id_key;
DROP INDEX IF EXISTS idx_vod_movies_xtream_id;
DROP INDEX IF EXISTS idx_vod_series_xtream_id;
DROP INDEX IF EXISTS idx_vod_episodes_xtream_id;

-- Clean all data for fresh import
TRUNCATE TABLE vod_episodes CASCADE;
TRUNCATE TABLE vod_series CASCADE;
TRUNCATE TABLE vod_movies CASCADE;

-- Make xtream_id NOT NULL with proper unique constraint
ALTER TABLE vod_movies ALTER COLUMN xtream_id SET NOT NULL;
ALTER TABLE vod_movies ADD CONSTRAINT vod_movies_xtream_id_unique UNIQUE (xtream_id);

ALTER TABLE vod_series ALTER COLUMN xtream_id SET NOT NULL;
ALTER TABLE vod_series ADD CONSTRAINT vod_series_xtream_id_unique UNIQUE (xtream_id);

ALTER TABLE vod_episodes ALTER COLUMN xtream_id SET NOT NULL;
ALTER TABLE vod_episodes ADD CONSTRAINT vod_episodes_xtream_id_unique UNIQUE (xtream_id);
