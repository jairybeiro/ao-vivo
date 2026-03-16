import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useVodEpisodes } from "@/hooks/useVod";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, ChevronRight } from "lucide-react";
import VodPlayer from "@/components/VodPlayer";
import type { VodSeries, VodEpisode } from "@/hooks/useVod";

const VodSeriesPlayer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [series, setSeries] = useState<VodSeries | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentEpisode, setCurrentEpisode] = useState<VodEpisode | null>(null);
  const [activeSeason, setActiveSeason] = useState("1");

  const { episodes, seasons, loading: epsLoading } = useVodEpisodes(id);

  useEffect(() => {
    if (!id) return;
    const fetchSeries = async () => {
      const { data, error } = await supabase
        .from("vod_series")
        .select("*")
        .eq("id", id)
        .single();
      if (!error && data) {
        setSeries({
          id: data.id,
          name: data.name,
          category: data.category,
          cover_url: data.cover_url,
          plot: data.plot,
          rating: data.rating,
        });
      }
      setLoading(false);
    };
    fetchSeries();
  }, [id]);

  // Auto-select first episode
  useEffect(() => {
    if (!currentEpisode && episodes.length > 0) {
      setCurrentEpisode(episodes[0]);
      setActiveSeason(String(episodes[0].season));
    }
  }, [episodes, currentEpisode]);

  // Find next episode
  const getNextEpisode = useCallback((): VodEpisode | null => {
    if (!currentEpisode) return null;
    const idx = episodes.findIndex(ep => ep.id === currentEpisode.id);
    if (idx >= 0 && idx < episodes.length - 1) return episodes[idx + 1];
    return null;
  }, [currentEpisode, episodes]);

  const playEpisode = useCallback((ep: VodEpisode) => {
    setCurrentEpisode(ep);
    setActiveSeason(String(ep.season));
  }, []);

  const nextEp = getNextEpisode();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-muted-foreground">Série não encontrada</p>
      </div>
    );
  }

  const seasonNumbers = [...seasons.keys()].sort((a, b) => a - b);

  return (
    <div className="h-screen bg-black flex flex-col lg:flex-row overflow-hidden">
      {/* Player area */}
      <div className="flex-1 min-h-0">
        {currentEpisode ? (
          <VodPlayer
            key={currentEpisode.id}
            src={currentEpisode.stream_url}
            title={series.name}
            subtitle={`S${currentEpisode.season}E${currentEpisode.episode_num} - ${currentEpisode.title}`}
            poster={currentEpisode.cover_url || series.cover_url || undefined}
            onBack={() => navigate("/vod")}
            nextEpisode={
              nextEp
                ? {
                    title: `S${nextEp.season}E${nextEp.episode_num} - ${nextEp.title}`,
                    onPlay: () => playEpisode(nextEp),
                  }
                : null
            }
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Selecione um episódio</p>
          </div>
        )}
      </div>

      {/* Episode sidebar */}
      <div className="w-full lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-white/10 bg-black/95 flex flex-col max-h-[35vh] lg:max-h-none">
        <div className="p-3 border-b border-white/10 shrink-0">
          <h2 className="text-white font-semibold text-sm truncate">{series.name}</h2>
          {series.plot && (
            <p className="text-white/50 text-xs mt-1 line-clamp-2">{series.plot}</p>
          )}
        </div>

        {epsLoading ? (
          <div className="p-4 text-white/50 text-sm">Carregando episódios...</div>
        ) : seasonNumbers.length === 0 ? (
          <div className="p-4 text-white/50 text-sm">Nenhum episódio encontrado</div>
        ) : (
          <Tabs value={activeSeason} onValueChange={setActiveSeason} className="flex-1 flex flex-col min-h-0">
            <div className="px-2 pt-2 shrink-0">
              <TabsList className="w-full flex-wrap h-auto gap-1 bg-white/5">
                {seasonNumbers.map(s => (
                  <TabsTrigger
                    key={s}
                    value={String(s)}
                    className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    T{s}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            {seasonNumbers.map(s => (
              <TabsContent key={s} value={String(s)} className="m-0 flex-1 min-h-0">
                <ScrollArea className="h-full">
                  <div className="space-y-0.5 p-2">
                    {(seasons.get(s) || []).map(ep => {
                      const isCurrent = currentEpisode?.id === ep.id;
                      return (
                        <button
                          key={ep.id}
                          onClick={() => playEpisode(ep)}
                          className={`w-full text-left p-2.5 rounded-md text-sm flex items-center gap-2 transition-all ${
                            isCurrent
                              ? "bg-primary/20 text-primary ring-1 ring-primary/30"
                              : "hover:bg-white/5 text-white/80 hover:text-white"
                          }`}
                        >
                          {isCurrent ? (
                            <ChevronRight className="w-4 h-4 shrink-0 text-primary" />
                          ) : (
                            <Play className="w-3 h-3 shrink-0 text-white/40" />
                          )}
                          <div className="min-w-0 flex-1">
                            <span className="truncate block text-xs font-medium">
                              E{ep.episode_num} - {ep.title}
                            </span>
                            {ep.duration_secs && (
                              <span className="text-[10px] text-white/40">
                                {Math.round(ep.duration_secs / 60)} min
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default VodSeriesPlayer;
