import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useVodEpisodes } from "@/hooks/useVod";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Play } from "lucide-react";
import { toProxyStreamUrl } from "@/lib/streamProxy";
import type { VodSeries, VodEpisode } from "@/hooks/useVod";

const VodSeriesPlayer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [series, setSeries] = useState<VodSeries | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentEpisode, setCurrentEpisode] = useState<VodEpisode | null>(null);
  const [activeSeason, setActiveSeason] = useState("1");
  const videoRef = useRef<HTMLVideoElement>(null);

  const { episodes, seasons, loading: epsLoading } = useVodEpisodes(id);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
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
    fetch();
  }, [id]);

  // Auto-select first episode
  useEffect(() => {
    if (!currentEpisode && episodes.length > 0) {
      setCurrentEpisode(episodes[0]);
      setActiveSeason(String(episodes[0].season));
    }
  }, [episodes, currentEpisode]);

  const handleEpisodeClick = (ep: VodEpisode) => {
    setCurrentEpisode(ep);
    videoRef.current?.load();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Série não encontrada</p>
      </div>
    );
  }

  const seasonNumbers = [...seasons.keys()].sort((a, b) => a - b);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card/50 backdrop-blur-sm p-3 flex items-center gap-3 border-b border-border">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar
        </Button>
        <div className="min-w-0">
          <h1 className="text-sm font-medium text-foreground truncate">{series.name}</h1>
          {currentEpisode && (
            <p className="text-xs text-muted-foreground truncate">
              S{currentEpisode.season}E{currentEpisode.episode_num} - {currentEpisode.title}
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Player */}
        <div className="flex-1 bg-black flex items-center justify-center">
          {currentEpisode ? (
            <video
              ref={videoRef}
              src={currentEpisode.stream_url}
              controls
              autoPlay
              className="w-full max-h-[60vh] lg:max-h-[calc(100vh-56px)]"
              poster={currentEpisode.cover_url || series.cover_url || undefined}
            />
          ) : (
            <div className="text-muted-foreground text-sm">Selecione um episódio</div>
          )}
        </div>

        {/* Episode List */}
        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-border bg-card">
          {epsLoading ? (
            <div className="p-4 text-muted-foreground text-sm">Carregando episódios...</div>
          ) : seasonNumbers.length === 0 ? (
            <div className="p-4 text-muted-foreground text-sm">Nenhum episódio encontrado</div>
          ) : (
            <Tabs value={activeSeason} onValueChange={setActiveSeason}>
              <div className="p-2 border-b border-border">
                <TabsList className="w-full flex-wrap h-auto gap-1">
                  {seasonNumbers.map(s => (
                    <TabsTrigger key={s} value={String(s)} className="text-xs">
                      T{s}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              {seasonNumbers.map(s => (
                <TabsContent key={s} value={String(s)} className="m-0">
                  <ScrollArea className="h-[30vh] lg:h-[calc(100vh-120px)]">
                    <div className="space-y-1 p-2">
                      {(seasons.get(s) || []).map(ep => (
                        <button
                          key={ep.id}
                          onClick={() => handleEpisodeClick(ep)}
                          className={`w-full text-left p-2 rounded-md text-sm flex items-center gap-2 transition-colors ${
                            currentEpisode?.id === ep.id
                              ? "bg-primary/20 text-primary"
                              : "hover:bg-muted text-foreground"
                          }`}
                        >
                          <Play className="w-3 h-3 shrink-0" />
                          <span className="truncate">
                            E{ep.episode_num} - {ep.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
};

export default VodSeriesPlayer;
