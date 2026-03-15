import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface VodMovie {
  id: string;
  name: string;
  category: string;
  stream_url: string;
  cover_url: string | null;
  rating: number | null;
}

export interface VodSeries {
  id: string;
  name: string;
  category: string;
  cover_url: string | null;
  plot: string | null;
  rating: number | null;
}

export interface VodEpisode {
  id: string;
  series_id: string;
  season: number;
  episode_num: number;
  title: string;
  stream_url: string;
  cover_url: string | null;
  duration_secs: number | null;
}

const ADULT_KEYWORDS = ['adult', 'adulto', 'xxx', 'porn', '18+', 'erotic', 'erótic'];

const isAdultCategory = (cat: string) =>
  ADULT_KEYWORDS.some(kw => cat.toLowerCase().includes(kw));

export const useVodMovies = (categoryFilter?: string, showAdult = false) => {
  const [movies, setMovies] = useState<VodMovie[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase.from("vod_movies").select("category");
    if (data) {
      const all = [...new Set(data.map((r: any) => r.category))].sort();
      setCategories(showAdult ? all : all.filter(c => !isAdultCategory(c)));
    }
  }, [showAdult]);

  const fetchMovies = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("vod_movies")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (categoryFilter && categoryFilter !== "Todos") {
      query = query.eq("category", categoryFilter);
    }

    const { data, error } = await query;
    if (!error && data) {
      const mapped = data.map((m: any) => ({
        id: m.id,
        name: m.name,
        category: m.category,
        stream_url: m.stream_url,
        cover_url: m.cover_url,
        rating: m.rating,
      }));
      setMovies(
        showAdult ? mapped : mapped.filter(m => !isAdultCategory(m.category))
      );
    }
    setLoading(false);
  }, [categoryFilter, showAdult]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { fetchMovies(); }, [fetchMovies]);

  return { movies, categories, loading, refetch: fetchMovies };
};

export const useVodSeries = (categoryFilter?: string) => {
  const [series, setSeries] = useState<VodSeries[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase.from("vod_series").select("category");
    if (data) {
      const unique = [...new Set(data.map((r: any) => r.category))].sort();
      setCategories(unique);
    }
  }, []);

  const fetchSeries = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("vod_series")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (categoryFilter && categoryFilter !== "Todos") {
      query = query.eq("category", categoryFilter);
    }

    const { data, error } = await query;
    if (!error && data) {
      setSeries(
        data.map((s: any) => ({
          id: s.id,
          name: s.name,
          category: s.category,
          cover_url: s.cover_url,
          plot: s.plot,
          rating: s.rating,
        }))
      );
    }
    setLoading(false);
  }, [categoryFilter]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { fetchSeries(); }, [fetchSeries]);

  return { series, categories, loading, refetch: fetchSeries };
};

export const useVodEpisodes = (seriesId: string | undefined) => {
  const [episodes, setEpisodes] = useState<VodEpisode[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEpisodes = useCallback(async () => {
    if (!seriesId) { setEpisodes([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from("vod_episodes")
      .select("*")
      .eq("series_id", seriesId)
      .order("season")
      .order("episode_num");

    if (!error && data) {
      setEpisodes(
        data.map((e: any) => ({
          id: e.id,
          series_id: e.series_id,
          season: e.season,
          episode_num: e.episode_num,
          title: e.title,
          stream_url: e.stream_url,
          cover_url: e.cover_url,
          duration_secs: e.duration_secs,
        }))
      );
    }
    setLoading(false);
  }, [seriesId]);

  useEffect(() => { fetchEpisodes(); }, [fetchEpisodes]);

  const seasons = useMemo(() => {
    const map = new Map<number, VodEpisode[]>();
    episodes.forEach(ep => {
      const arr = map.get(ep.season) || [];
      arr.push(ep);
      map.set(ep.season, arr);
    });
    return map;
  }, [episodes]);

  return { episodes, seasons, loading, refetch: fetchEpisodes };
};
