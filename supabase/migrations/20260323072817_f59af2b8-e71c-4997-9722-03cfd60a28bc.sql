
CREATE TABLE public.hero_bg_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_url TEXT NOT NULL,
  label TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.hero_bg_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active bg videos"
ON public.hero_bg_videos FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage bg videos"
ON public.hero_bg_videos FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
