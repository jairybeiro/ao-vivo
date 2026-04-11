import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Star, Play, ChevronDown, Tv } from "lucide-react";
import MainHeader from "@/components/MainHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import VodPlayer from "@/components/VodPlayer";

interface Series {
  id: string;
  name: string;
  category: string;
  cover_url: string | null;
  backdrop_url: string | null;
  rating: number | null;
  plot: string | null;
  trailer_url: string | null;
  trailer_mp4_url: string | null;
}

interface Episode {
  id: string;
  title: string;
  season: number;
  episode_num: number;
  stream_url: string;
  cover_url: string | null;
  duration_secs: number | null;
}

const SeriesDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [series, setSeries] = useState<Series | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [activeEpisode, setActiveEpisode] = useState<Episode | null>(null);
  const [showSeasonPicker, setShowSeasonPicker] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    const [{ data: seriesData }, { data: episodesData }] = await Promise.all([
      supabase.from("vod_series").select("*").eq("id", id).single(),
      supabase.from("vod_episodes").select("*").eq("series_id", id).order("season").order("episode_num"),
    ]);

    if (!seriesData) {
      navigate("/entretenimento");
      return;
    }

    setSeries(seriesData as any);
    setEpisodes((episodesData || []) as Episode[]);

    // Auto-select first season
    if (episodesData && episodesData.length > 0) {
      setSelectedSeason((episodesData[0] as any).season || 1);
    }
    setLoading(false);
  }, [id, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const seasons = [...new Set(episodes.map((e) => e.season))].sort((a, b) => a - b);
  const seasonEpisodes = episodes.filter((e) => e.season === selectedSeason);

  const currentIndex = activeEpisode
    ? seasonEpisodes.findIndex((e) => e.id === activeEpisode.id)
    : -1;
  const nextEpisode =
    currentIndex >= 0 && currentIndex < seasonEpisodes.length - 1
      ? seasonEpisodes[currentIndex + 1]
      : null;

  const formatDuration = (secs: number | null) => {
    if (!secs) return "";
    const m = Math.floor(secs / 60);
    return `${m} min`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!series) return null;

  // Playing mode - fullscreen player with episode overlay
  if (activeEpisode) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black">
        <VodPlayer
          src={activeEpisode.stream_url}
          title={activeEpisode.title}
          subtitle={`${series.name} · T${activeEpisode.season}:E${activeEpisode.episode_num}`}
          poster={activeEpisode.cover_url || series.backdrop_url || undefined}
          contentType="episode"
          contentId={activeEpisode.id}
          contentName={`${series.name} - ${activeEpisode.title}`}
          contentCoverUrl={series.cover_url}
          nextEpisode={
            nextEpisode
              ? {
                  title: nextEpisode.title,
                  onPlay: () => setActiveEpisode(nextEpisode),
                }
              : null
          }
          onBack={() => setActiveEpisode(null)}
          onEnded={() => {
            if (nextEpisode) setActiveEpisode(nextEpisode);
          }}
          overlayContent={
            <EpisodeOverlay
              seasons={seasons}
              selectedSeason={selectedSeason}
              seasonEpisodes={seasonEpisodes}
              activeEpisodeId={activeEpisode.id}
              onSelectSeason={setSelectedSeason}
              onSelectEpisode={setActiveEpisode}
              formatDuration={formatDuration}
            />
          }
        />
      </div>
    );
  }

  // Browse mode - series info + episode list
  return (
    <div className="min-h-screen bg-background overflow-y-auto">
      <div className={`fixed top-0 left-0 right-0 z-50 ${isMobile ? "bg-background" : ""}`}>
        <MainHeader transparent={!isMobile} />
      </div>

      {/* Hero */}
      <section className={`relative w-full ${isMobile ? "bg-[#0f0f0f] pt-14" : "bg-[#0f0f0f] pt-16"}`}>
        {!isMobile && (
          <div className="absolute inset-0 z-0 overflow-hidden">
            {series.backdrop_url && (
              <img src={series.backdrop_url} alt="" className="w-full h-full object-cover scale-110 blur-3xl opacity-30" />
            )}
            <div className="absolute inset-0 bg-background/80" />
          </div>
        )}

        <div className={`relative z-10 ${isMobile ? "" : "flex items-center justify-center"}`} style={isMobile ? {} : { minHeight: "60vh" }}>
          <div className={`relative w-full ${isMobile ? "aspect-video" : "max-w-5xl mx-auto aspect-video overflow-hidden rounded-xl border border-white/10"}`}>
            {series.backdrop_url ? (
              <img src={series.backdrop_url} alt={series.name} className="w-full h-full object-cover" />
            ) : series.cover_url ? (
              <img src={series.cover_url} alt={series.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900" />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />

            <button onClick={() => navigate(-1)} className="absolute top-3 left-3 z-30 w-9 h-9 flex items-center justify-center rounded-full bg-black/50 text-white">
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className={`absolute bottom-0 left-0 right-0 z-20 ${isMobile ? "p-4 pb-5" : "p-8 pb-10"}`}>
              <div className="flex items-end justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h1 className={`font-bold text-white ${isMobile ? "text-xl" : "text-3xl"}`}>{series.name}</h1>
                  <p className="text-xs text-white/60 mt-1">{series.category} · {seasons.length} temporada{seasons.length > 1 ? "s" : ""} · {episodes.length} episódio{episodes.length > 1 ? "s" : ""}</p>
                </div>
                {series.rating && series.rating > 0 && (
                  <div className="flex items-center gap-1.5 bg-white/15 rounded-lg px-3 py-1.5">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-bold text-white text-sm">{series.rating}</span>
                  </div>
                )}
              </div>

              {series.plot && (
                <p className={`text-white/70 mt-2 ${isMobile ? "text-xs line-clamp-2" : "text-sm max-w-lg line-clamp-3"}`}>{series.plot}</p>
              )}

              {seasonEpisodes.length > 0 && (
                <button
                  onClick={() => setActiveEpisode(seasonEpisodes[0])}
                  className={`flex items-center gap-2 bg-primary text-primary-foreground font-semibold rounded-lg mt-3 ${isMobile ? "px-4 py-2.5 text-xs" : "px-6 py-3 text-sm"}`}
                >
                  <Play className="w-4 h-4 fill-current" />
                  Assistir T{selectedSeason}:E1
                </button>
              )}
            </div>
          </div>
        </div>

        {!isMobile && <div className="h-12 bg-gradient-to-b from-transparent to-background relative z-10" />}
      </section>

      {/* Episodes */}
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Season selector */}
        {seasons.length > 1 && (
          <div className="relative inline-block">
            <button
              onClick={() => setShowSeasonPicker(!showSeasonPicker)}
              className="flex items-center gap-2 bg-muted text-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted/80 transition"
            >
              Temporada {selectedSeason}
              <ChevronDown className="w-4 h-4" />
            </button>
            {showSeasonPicker && (
              <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-lg shadow-xl z-40 min-w-[160px]">
                {seasons.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setSelectedSeason(s); setShowSeasonPicker(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition ${s === selectedSeason ? "text-primary font-bold" : "text-foreground"}`}
                  >
                    Temporada {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Episode list */}
        <div className="space-y-3">
          {seasonEpisodes.map((ep) => (
            <button
              key={ep.id}
              onClick={() => setActiveEpisode(ep)}
              className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition text-left group"
            >
              <div className="w-10 h-10 flex items-center justify-center shrink-0 rounded-full bg-muted group-hover:bg-primary/20 transition">
                <span className="text-sm font-bold text-muted-foreground group-hover:text-primary">{ep.episode_num}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{ep.title}</p>
                <p className="text-xs text-muted-foreground">
                  T{ep.season}:E{ep.episode_num}
                  {ep.duration_secs ? ` · ${formatDuration(ep.duration_secs)}` : ""}
                </p>
              </div>
              <Play className="w-5 h-5 text-muted-foreground group-hover:text-primary shrink-0 opacity-0 group-hover:opacity-100 transition" />
            </button>
          ))}
          {seasonEpisodes.length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-8">Nenhum episódio nesta temporada.</p>
          )}
        </div>
      </main>
    </div>
  );
};

// Episode overlay for the player (seasons + episodes selector)
const EpisodeOverlay = ({
  seasons,
  selectedSeason,
  seasonEpisodes,
  activeEpisodeId,
  onSelectSeason,
  onSelectEpisode,
  formatDuration,
}: {
  seasons: number[];
  selectedSeason: number;
  seasonEpisodes: Episode[];
  activeEpisodeId: string;
  onSelectSeason: (s: number) => void;
  onSelectEpisode: (ep: Episode) => void;
  formatDuration: (s: number | null) => string;
}) => {
  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
      {/* Season tabs */}
      {seasons.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {seasons.map((s) => (
            <button
              key={s}
              onClick={() => onSelectSeason(s)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition ${
                s === selectedSeason
                  ? "bg-primary text-primary-foreground"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              T{s}
            </button>
          ))}
        </div>
      )}

      {/* Episodes */}
      <div className="space-y-1">
        {seasonEpisodes.map((ep) => (
          <button
            key={ep.id}
            onClick={() => onSelectEpisode(ep)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition text-sm ${
              ep.id === activeEpisodeId
                ? "bg-primary/20 text-white"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span className={`w-6 text-center font-bold text-xs shrink-0 ${ep.id === activeEpisodeId ? "text-primary" : ""}`}>
              {ep.episode_num}
            </span>
            <span className="flex-1 truncate">{ep.title}</span>
            {ep.duration_secs && (
              <span className="text-xs text-white/40 shrink-0">{formatDuration(ep.duration_secs)}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SeriesDetail;
