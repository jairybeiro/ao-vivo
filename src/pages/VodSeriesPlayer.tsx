import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useVodEpisodes } from "@/hooks/useVod";
import { useIsMobile } from "@/hooks/use-mobile";

import { ListVideo } from "lucide-react";
import VodPlayer from "@/components/VodPlayer";
import EpisodesSheet from "@/components/vod/EpisodesSheet";
import DesktopEpisodesPanel from "@/components/vod/DesktopEpisodesPanel";
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

  // ─── MOBILE: fullscreen player + episodes in sheet ───
  if (isMobile) {
    return (
      <div className="h-screen bg-black flex flex-col">
        <div className="flex-1 min-h-0 relative">
          {currentEpisode ? (
            <VodPlayer
              key={currentEpisode.id}
              src={currentEpisode.stream_url}
              title={series.name}
              subtitle={`T${currentEpisode.season}:E${currentEpisode.episode_num} "${currentEpisode.title}"`}
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
                      title: `T${nextEp.season}:E${nextEp.episode_num} "${nextEp.title}"`,
                      onPlay: () => playEpisode(nextEp),
                    }
                  : null
              }
              extraControls={
                !epsLoading && seasonNumbers.length > 0 ? (
                  <EpisodesSheet
                    series={series}
                    seasons={seasons}
                    seasonNumbers={seasonNumbers}
                    currentEpisode={currentEpisode}
                    onPlayEpisode={playEpisode}
                    trigger={
                      <button className="text-white hover:text-primary transition p-1.5 flex items-center gap-1 text-xs">
                        <ListVideo className="w-4 h-4" />
                        <span>Episódios</span>
                      </button>
                    }
                  />
                ) : undefined
              }
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-muted-foreground text-sm">Selecione um episódio</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── DESKTOP: fullscreen player + slide-in episodes panel ───
  return (
    <div className="h-screen bg-black relative">
      <div className="w-full h-full">
        {currentEpisode ? (
          <VodPlayer
            key={currentEpisode.id}
            src={currentEpisode.stream_url}
            title={series.name}
            subtitle={`S${currentEpisode.season}E${currentEpisode.episode_num} - ${currentEpisode.title}`}
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
                    title: `S${nextEp.season}E${nextEp.episode_num} - ${nextEp.title}`,
                    onPlay: () => playEpisode(nextEp),
                  }
                : null
            }
            extraControls={
              !epsLoading && seasonNumbers.length > 0 ? (
                <button
                  onClick={() => setShowEpisodesPanel(true)}
                  className="text-white hover:text-white/80 transition p-1.5 flex items-center gap-1.5 text-sm"
                >
                  <ListVideo className="w-5 h-5" />
                  <span>Episódios</span>
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Selecione um episódio</p>
          </div>
        )}
      </div>

      {/* Episodes slide-in panel */}
      {!epsLoading && seasonNumbers.length > 0 && (
        <DesktopEpisodesPanel
          series={series}
          seasons={seasons}
          seasonNumbers={seasonNumbers}
          currentEpisode={currentEpisode}
          onPlayEpisode={playEpisode}
          open={showEpisodesPanel}
          onClose={() => setShowEpisodesPanel(false)}
        />
      )}
    </div>
  );
};

export default VodSeriesPlayer;
