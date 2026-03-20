ALTER TABLE public.vod_movies ADD COLUMN IF NOT EXISTS trailer_url text DEFAULT NULL;
ALTER TABLE public.vod_series ADD COLUMN IF NOT EXISTS trailer_url text DEFAULT NULL;