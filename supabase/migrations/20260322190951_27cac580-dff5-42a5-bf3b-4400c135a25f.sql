ALTER TABLE public.vod_movies ADD COLUMN IF NOT EXISTS category_tag text;
ALTER TABLE public.vod_series ADD COLUMN IF NOT EXISTS category_tag text;