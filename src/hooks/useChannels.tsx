import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { defaultChannels } from "@/data/channels";

export interface DBChannel {
  id: string;
  name: string;
  category: string;
  logo: string | null;
  streamUrls: string[];
  isLive: boolean;
}

export const useChannels = () => {
  const [channels, setChannels] = useState<DBChannel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChannels = async () => {
      const { data, error } = await supabase
        .from("channels")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching channels:", error);
        // Fallback to default channels
        setChannels(
          defaultChannels.map((ch) => ({
            id: ch.id,
            name: ch.name,
            category: "Notícias",
            logo: ch.logo || null,
            streamUrls: ch.streamUrls,
            isLive: true,
          }))
        );
      } else if (data && data.length > 0) {
        setChannels(
          data.map((ch) => ({
            id: ch.id,
            name: ch.name,
            category: ch.category,
            logo: ch.logo,
            streamUrls: ch.stream_urls,
            isLive: ch.is_live ?? true,
          }))
        );
      } else {
        // No channels in DB, use defaults
        setChannels(
          defaultChannels.map((ch) => ({
            id: ch.id,
            name: ch.name,
            category: "Notícias",
            logo: ch.logo || null,
            streamUrls: ch.streamUrls,
            isLive: true,
          }))
        );
      }
      setLoading(false);
    };

    fetchChannels();
  }, []);

  return { channels, loading };
};
