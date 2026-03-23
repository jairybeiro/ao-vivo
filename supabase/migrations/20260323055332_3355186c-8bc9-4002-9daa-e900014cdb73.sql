ALTER TABLE public.vod_movies ADD COLUMN IF NOT EXISTS tmdb_id integer;
ALTER TABLE public.vod_series ADD COLUMN IF NOT EXISTS tmdb_id integer;