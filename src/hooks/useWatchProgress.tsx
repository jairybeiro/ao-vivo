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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const finished = params.duration > 0 && params.currentTime / params.duration > 0.95;

      await supabase.from("user_watch_progress").upsert(
        {
          user_id: session.user.id,
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setLoading(false); return; }

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

const ADULT_KEYWORDS = ['adult', 'adulto', 'xxx', 'porn', '18+', 'erotic', 'erótic'];
const isAdultCategory = (cat: string) =>
  ADULT_KEYWORDS.some(kw => cat.toLowerCase().includes(kw));

export const useContinueWatching = (showAdult = false) => {
  const [items, setItems] = useState<WatchProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("user_watch_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("finished", false)
        .order("updated_at", { ascending: false })
        .limit(20);

      if (!data) { setLoading(false); return; }

      const filtered = data.filter((d: any) => d.current_time_secs > 10) as unknown as WatchProgress[];

      if (showAdult || filtered.length === 0) {
        setItems(filtered);
        setLoading(false);
        return;
      }

      // Cross-reference with vod_movies and vod_series to find adult categories
      const movieIds = filtered.filter(i => i.content_type === "movie").map(i => i.content_id);
      const episodeIds = filtered.filter(i => i.content_type === "episode").map(i => i.content_id);

      const adultContentIds = new Set<string>();

      if (movieIds.length > 0) {
        const { data: movies } = await supabase
          .from("vod_movies")
          .select("id, category")
          .in("id", movieIds);
        movies?.forEach((m: any) => {
          if (isAdultCategory(m.category)) adultContentIds.add(m.id);
        });
      }

      if (episodeIds.length > 0) {
        const { data: episodes } = await supabase
          .from("vod_episodes")
          .select("id, series_id")
          .in("id", episodeIds);
        if (episodes && episodes.length > 0) {
          const seriesIds = [...new Set(episodes.map((e: any) => e.series_id))];
          const { data: seriesList } = await supabase
            .from("vod_series")
            .select("id, category")
            .in("id", seriesIds);
          const adultSeriesIds = new Set(
            seriesList?.filter((s: any) => isAdultCategory(s.category)).map((s: any) => s.id) || []
          );
          episodes.forEach((e: any) => {
            if (adultSeriesIds.has(e.series_id)) adultContentIds.add(e.id);
          });
        }
      }

      setItems(filtered.filter(i => !adultContentIds.has(i.content_id)));
      setLoading(false);
    };
    fetchData();
  }, [showAdult]);

  return { items, loading };
};
