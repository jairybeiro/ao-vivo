
CREATE TABLE public.shorts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  cover_url text,
  media_url text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.shorts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shorts TO authenticated;
GRANT ALL ON public.shorts TO service_role;

ALTER TABLE public.shorts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active shorts"
  ON public.shorts FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert shorts"
  ON public.shorts FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update shorts"
  ON public.shorts FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete shorts"
  ON public.shorts FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_shorts_updated_at
  BEFORE UPDATE ON public.shorts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
