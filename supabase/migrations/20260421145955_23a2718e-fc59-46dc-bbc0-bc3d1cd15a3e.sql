-- Limpar todo o catálogo VOD (filmes, séries e episódios)
DELETE FROM public.vod_episodes;
DELETE FROM public.vod_series;
DELETE FROM public.vod_movies;