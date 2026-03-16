import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface WatchProgress {
  id: string;
  user_id: string;
  content_type: "movie" | "episode";
  content_id: string;
  current_time_secs: number;
  duration_secs: number;
  content_name: string;
  content_cover_url: string | null;
  finished: boolean;
  updated_at: string;
}

export const useSaveWatchProgress = () => {
  const saveProgress = useCallback(
    async (params: {
      contentType: "movie" | "episode";
      contentId: string;
      currentTime: number;
      duration: number;
      contentName: string;
      contentCoverUrl?: string | null;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const finished = params.duration > 0 && params.currentTime / params.duration > 0.95;

      await supabase.from("user_watch_progress").upsert(
        {
          user_id: user.id,
          content_type: params.contentType,
          content_id: params.contentId,
          current_time_secs: params.currentTime,
          duration_secs: params.duration,
          content_name: params.contentName,
          content_cover_url: params.contentCoverUrl || null,
          finished,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,content_type,content_id" }
      );
    },
    []
  );

  return { saveProgress };
};

export const useGetWatchProgress = (contentType: "movie" | "episode", contentId: string | undefined) => {
  const [progress, setProgress] = useState<WatchProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contentId) { setLoading(false); return; }
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("user_watch_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("content_type", contentType)
        .eq("content_id", contentId)
        .maybeSingle();

      if (data && !data.finished) {
        setProgress(data as unknown as WatchProgress);
      }
      setLoading(false);
    };
    fetch();
  }, [contentType, contentId]);

  return { progress, loading };
};

export const useContinueWatching = () => {
  const [items, setItems] = useState<WatchProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("user_watch_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("finished", false)
        .order("updated_at", { ascending: false })
        .limit(20);

      if (data) {
        setItems(data.filter((d: any) => d.current_time_secs > 10) as unknown as WatchProgress[]);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  return { items, loading };
};
