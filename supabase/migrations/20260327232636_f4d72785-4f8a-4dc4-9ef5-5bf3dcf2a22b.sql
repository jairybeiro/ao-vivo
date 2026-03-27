
ALTER TABLE public.vod_movies
  ADD COLUMN IF NOT EXISTS link_checkout text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tempo_anuncio integer DEFAULT 30,
  ADD COLUMN IF NOT EXISTS url_imagem_anuncio text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS sinopse text DEFAULT NULL;

ALTER TABLE public.vod_series
  ADD COLUMN IF NOT EXISTS link_checkout text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tempo_anuncio integer DEFAULT 30,
  ADD COLUMN IF NOT EXISTS url_imagem_anuncio text DEFAULT NULL;
