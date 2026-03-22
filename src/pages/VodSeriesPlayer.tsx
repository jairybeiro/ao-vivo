import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useVodEpisodes } from "@/hooks/useVod";
import { useIsMobile } from "@/hooks/use-mobile";

import { ListVideo } from "lucide-react";
import VodPlayer from "@/components/VodPlayer";
import DesktopEpisodesPanel from "@/components/vod/DesktopEpisodesPanel";
import MobileEpisodesPanel from "@/components/vod/MobileEpisodesPanel";
import type { VodSeries, VodEpisode } from "@/hooks/useVod";

const VodSeriesPlayer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [series, setSeries] = useState<VodSeries | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentEpisode, setCurrentEpisode] = useState<VodEpisode | null>(null);
  const [activeSeason, setActiveSeason] = useState("1");
  const [showEpisodesPanel, setShowEpisodesPanel] = useState(false);

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
          backdrop_url: (data as any).backdrop_url || null,
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
  const seasonNumbers = [...seasons.keys()].sort((a, b) => a - b);

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

  const hasEpisodes = !epsLoading && seasonNumbers.length > 0;

  const episodesButton = hasEpisodes ? (
    <button
      onClick={() => setShowEpisodesPanel(true)}
      className="text-white hover:text-white/80 transition p-1.5"
      title="Episódios"
    >
      <ListVideo className="w-5 h-5" />
    </button>
  ) : undefined;

  // Overlay content: episodes panel rendered INSIDE the player's fullscreen container
  const panelOverlay = hasEpisodes && series ? (
    isMobile ? (
      <MobileEpisodesPanel
        series={series}
        seasons={seasons}
        seasonNumbers={seasonNumbers}
        currentEpisode={currentEpisode}
        onPlayEpisode={playEpisode}
        open={showEpisodesPanel}
        onClose={() => setShowEpisodesPanel(false)}
      />
    ) : (
      <DesktopEpisodesPanel
        series={series}
        seasons={seasons}
        seasonNumbers={seasonNumbers}
        currentEpisode={currentEpisode}
        onPlayEpisode={playEpisode}
        open={showEpisodesPanel}
        onClose={() => setShowEpisodesPanel(false)}
      />
    )
  ) : undefined;

  return (
    <div className="h-screen bg-black">
      {currentEpisode ? (
        <VodPlayer
          key={currentEpisode.id}
          src={currentEpisode.stream_url}
          title={series.name}
          subtitle={isMobile
            ? `T${currentEpisode.season}:E${currentEpisode.episode_num} "${currentEpisode.title}"`
            : `S${currentEpisode.season}E${currentEpisode.episode_num} - ${currentEpisode.title}`
          }
          poster={currentEpisode.cover_url || series.cover_url || undefined}
          contentType="episode"
          contentId={currentEpisode.id}
          contentName={`${series.name} - S${currentEpisode.season}E${currentEpisode.episode_num}`}
          contentCoverUrl={currentEpisode.cover_url || series.cover_url}
          centerLabel={`${series.name}  E${currentEpisode.episode_num}  ${currentEpisode.title}`}
          onBack={() => navigate("/vod")}
          nextEpisode={
            nextEp
              ? {
                  title: `${isMobile ? "T" : "S"}${nextEp.season}${isMobile ? ":" : ""}E${nextEp.episode_num} ${isMobile ? '"' : "- "}${nextEp.title}${isMobile ? '"' : ""}`,
                  onPlay: () => playEpisode(nextEp),
                }
              : null
          }
          extraControls={episodesButton}
          overlayContent={panelOverlay}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Selecione um episódio</p>
        </div>
      )}
    </div>
  );
};

export default VodSeriesPlayer;
