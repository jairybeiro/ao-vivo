
CREATE TABLE public.user_watch_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type text NOT NULL, -- 'movie' or 'episode'
  content_id uuid NOT NULL,
  current_time_secs numeric NOT NULL DEFAULT 0,
  duration_secs numeric NOT NULL DEFAULT 0,
  content_name text NOT NULL DEFAULT '',
  content_cover_url text,
  finished boolean NOT NULL DEFAULT false,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, content_type, content_id)
);

ALTER TABLE public.user_watch_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own watch progress"
  ON public.user_watch_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watch progress"
  ON public.user_watch_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watch progress"
  ON public.user_watch_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own watch progress"
  ON public.user_watch_progress FOR DELETE
  USING (auth.uid() = user_id);
