ALTER TABLE public.vod_movies ADD COLUMN IF NOT EXISTS linked_content_id uuid DEFAULT NULL;
ALTER TABLE public.vod_series ADD COLUMN IF NOT EXISTS linked_content_id uuid DEFAULT NULL;