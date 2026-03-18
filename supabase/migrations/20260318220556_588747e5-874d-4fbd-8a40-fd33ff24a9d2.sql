
CREATE OR REPLACE FUNCTION public.search_vod_movies(search_term text)
RETURNS SETOF vod_movies
LANGUAGE sql STABLE
AS $$
  SELECT * FROM public.vod_movies
  WHERE public.unaccent(lower(name)) ILIKE '%' || public.unaccent(lower(search_term)) || '%'
  ORDER BY created_at DESC
  LIMIT 100;
$$;

CREATE OR REPLACE FUNCTION public.search_vod_series(search_term text)
RETURNS SETOF vod_series
LANGUAGE sql STABLE
AS $$
  SELECT * FROM public.vod_series
  WHERE public.unaccent(lower(name)) ILIKE '%' || public.unaccent(lower(search_term)) || '%'
  ORDER BY created_at DESC
  LIMIT 100;
$$;
