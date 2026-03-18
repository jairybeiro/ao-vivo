
CREATE OR REPLACE FUNCTION public.search_vod_movies_public(search_term text, cat text DEFAULT NULL)
RETURNS SETOF vod_movies
LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT * FROM public.vod_movies
  WHERE is_active = true
    AND public.unaccent(lower(name)) ILIKE '%' || public.unaccent(lower(search_term)) || '%'
    AND (cat IS NULL OR category = cat)
  ORDER BY name;
$$;

CREATE OR REPLACE FUNCTION public.search_vod_series_public(search_term text, cat text DEFAULT NULL)
RETURNS SETOF vod_series
LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT * FROM public.vod_series
  WHERE is_active = true
    AND public.unaccent(lower(name)) ILIKE '%' || public.unaccent(lower(search_term)) || '%'
    AND (cat IS NULL OR category = cat)
  ORDER BY name;
$$;
