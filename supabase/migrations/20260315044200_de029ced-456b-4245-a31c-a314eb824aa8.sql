
-- Table for VOD movies
CREATE TABLE public.vod_movies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Filmes',
  stream_url text NOT NULL,
  cover_url text,
  rating numeric(3,1),
  xtream_id integer,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table for VOD series
CREATE TABLE public.vod_series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Séries',
  cover_url text,
  plot text,
  rating numeric(3,1),
  xtream_id integer,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table for series episodes
CREATE TABLE public.vod_episodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id uuid NOT NULL REFERENCES public.vod_series(id) ON DELETE CASCADE,
  season integer NOT NULL DEFAULT 1,
  episode_num integer NOT NULL DEFAULT 1,
  title text NOT NULL,
  stream_url text NOT NULL,
  cover_url text,
  duration_secs integer,
  xtream_id integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_vod_movies_category ON public.vod_movies(category);
CREATE INDEX idx_vod_movies_xtream_id ON public.vod_movies(xtream_id);
CREATE INDEX idx_vod_series_category ON public.vod_series(category);
CREATE INDEX idx_vod_series_xtream_id ON public.vod_series(xtream_id);
CREATE INDEX idx_vod_episodes_series ON public.vod_episodes(series_id);
CREATE INDEX idx_vod_episodes_xtream_id ON public.vod_episodes(xtream_id);

-- RLS
ALTER TABLE public.vod_movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vod_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vod_episodes ENABLE ROW LEVEL SECURITY;

-- Movies policies
CREATE POLICY "Anyone can view active movies" ON public.vod_movies FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage movies" ON public.vod_movies FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Series policies
CREATE POLICY "Anyone can view active series" ON public.vod_series FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage series" ON public.vod_series FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Episodes policies
CREATE POLICY "Anyone can view episodes" ON public.vod_episodes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.vod_series WHERE id = vod_episodes.series_id AND is_active = true)
);
CREATE POLICY "Admins can manage episodes" ON public.vod_episodes FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Updated at triggers
CREATE TRIGGER update_vod_movies_updated_at BEFORE UPDATE ON public.vod_movies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vod_series_updated_at BEFORE UPDATE ON public.vod_series FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vod_episodes_updated_at BEFORE UPDATE ON public.vod_episodes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
