import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { defaultChannels } from "@/data/channels";
import { toProxyAssetUrl } from "@/lib/streamProxy";

export interface DBChannel {
  id: string;
  name: string;
  category: string;
  logo: string | null;
  streamUrls: string[];
  embedUrl: string | null;
  isLive: boolean;
}

export const useChannels = (categoryFilter?: string) => {
  const [channels, setChannels] = useState<DBChannel[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const fetchCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from("channels")
      .select("category");

    if (!error && data) {
      const unique = [...new Set(data.map((r) => r.category))].sort();
      setCategories(unique);
    }
  }, []);

  const fetchChannels = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("channels")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: true });

    if (categoryFilter && categoryFilter !== "Todos" && categoryFilter !== "Favoritos") {
      query = query.eq("category", categoryFilter);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching channels:", error);
      setChannels(
        defaultChannels.map((ch) => ({
          id: ch.id,
          name: ch.name,
          category: "Notícias",
          logo: toProxyAssetUrl(ch.logo),
          streamUrls: ch.streamUrls,
          embedUrl: null,
          isLive: true,
        }))
      );
    } else if (data && data.length > 0) {
      setChannels(
        data.map((ch) => ({
          id: ch.id,
          name: ch.name,
          category: ch.category,
          logo: toProxyAssetUrl(ch.logo),
          streamUrls: ch.stream_urls,
          embedUrl: ch.embed_url || null,
          isLive: ch.is_live ?? true,
        }))
      );
      setTotalCount(count ?? data.length);
    } else {
      setChannels(
        defaultChannels.map((ch) => ({
          id: ch.id,
          name: ch.name,
          category: "Notícias",
          logo: toProxyAssetUrl(ch.logo),
          streamUrls: ch.streamUrls,
          embedUrl: null,
          isLive: true,
        }))
      );
    }
    setLoading(false);
  }, [categoryFilter]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  return { channels, categories, loading, totalCount, refetch: fetchChannels };
};
