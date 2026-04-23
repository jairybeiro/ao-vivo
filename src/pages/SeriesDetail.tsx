import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Star, Play, Pause, ChevronDown, Bookmark, Share2 } from "lucide-react";

import MainHeader from "@/components/MainHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import VodPlayer from "@/components/VodPlayer";
import HlsAutoplayVideo from "@/components/HlsAutoplayVideo";

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
  xtream_id: number | null;
  created_at: string;
}

interface Episode {
  id: string;
  title: string;
  season: number;
  episode_num: number;
  stream_url: string;
  cover_url: string | null;
  duration_secs: number | null;
  plot: string | null;
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
  const [showAllEpisodes, setShowAllEpisodes] = useState(false);

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
  const visibleEpisodes = showAllEpisodes ? seasonEpisodes : seasonEpisodes.slice(0, 3);

  const currentIndex = activeEpisode
    ? seasonEpisodes.findIndex((e) => e.id === activeEpisode.id)
    : -1;
  const nextEpisode =
    currentIndex >= 0 && currentIndex < seasonEpisodes.length - 1
      ? seasonEpisodes[currentIndex + 1]
      : null;

  const formatDuration = (secs: number | null) => {
    if (!secs) return "";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const formatEpisodeCode = (season: number, epNum: number) => {
    return `S${String(season).padStart(2, "0")}E${String(epNum).padStart(4, "0")}`;
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("pt-BR");
    } catch { return ""; }
  };

  // Trailer source for hero autoplay
  // Remove duplicate year pattern e.g. "Title 2019 (2019)" → "Title 2019"
  const cleanName = (name: string | null | undefined): string => {
    if (!name) return "";
    return name.replace(/\s*\((\d{4})\)\s*$/, (_, yr) => name.includes(yr) ? '' : ` (${yr})`).trim();
  };

  const trailerSrc = series?.trailer_mp4_url || series?.trailer_url || null;
  const isYouTubeTrailer = trailerSrc?.includes("youtube") || trailerSrc?.includes("youtu.be");
  const autoplayTrailer = trailerSrc && !isYouTubeTrailer ? trailerSrc : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!series) return null;

  // Playing mode
  if (activeEpisode) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
        <VodPlayer
          src={activeEpisode.stream_url}
          title={`${cleanName(series.name)} - T${activeEpisode.season} E${activeEpisode.episode_num}`}
          subtitle=""
          poster={activeEpisode.cover_url || series.backdrop_url || undefined}
          contentType="episode"
          contentId={activeEpisode.id}
          contentName={`${cleanName(series.name)} - ${activeEpisode.title}`}
          contentCoverUrl={series.cover_url}
          nextEpisode={
            nextEpisode
              ? { title: nextEpisode.title, onPlay: () => setActiveEpisode(nextEpisode) }
              : null
          }
          onBack={() => setActiveEpisode(null)}
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

  // Browse mode
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <MainHeader transparent />
      </div>

      {/* Hero - Boxed player style */}
      <section className="relative w-full pt-[60px]">
        {/* Background blur behind the boxed player */}
        <div className="absolute inset-0 overflow-hidden">
          {series.backdrop_url && (
            <img
              src={series.backdrop_url}
              alt=""
              className="w-full h-full object-cover scale-110 blur-2xl opacity-30"
            />
          )}
          <div className="absolute inset-0 bg-background/70" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 md:px-8 pt-8 pb-0">
          {/* Boxed player/image container */}
          <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl bg-black">
            {autoplayTrailer ? (
              <>
                <HlsAutoplayVideo
                  src={autoplayTrailer}
                  poster={series.backdrop_url || series.cover_url || undefined}
                  className="w-full h-full object-cover"
                />
                {/* Central play button over trailer */}
                <button
                  onClick={() => seasonEpisodes.length > 0 && setActiveEpisode(seasonEpisodes[0])}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-20 h-20 rounded-full bg-primary/90 hover:bg-primary flex items-center justify-center shadow-2xl transition-transform hover:scale-110"
                >
                  <Play className="w-8 h-8 text-primary-foreground fill-primary-foreground ml-1" />
                </button>
              </>
            ) : series.backdrop_url ? (
              <>
                <img src={series.backdrop_url} alt={series.name} className="w-full h-full object-cover" />
                <button
                  onClick={() => seasonEpisodes.length > 0 && setActiveEpisode(seasonEpisodes[0])}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-20 h-20 rounded-full bg-primary/90 hover:bg-primary flex items-center justify-center shadow-2xl transition-transform hover:scale-110"
                >
                  <Play className="w-8 h-8 text-primary-foreground fill-primary-foreground ml-1" />
                </button>
              </>
            ) : series.cover_url ? (
              <>
                <img src={series.cover_url} alt={series.name} className="w-full h-full object-cover" />
                <button
                  onClick={() => seasonEpisodes.length > 0 && setActiveEpisode(seasonEpisodes[0])}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-20 h-20 rounded-full bg-primary/90 hover:bg-primary flex items-center justify-center shadow-2xl transition-transform hover:scale-110"
                >
                  <Play className="w-8 h-8 text-primary-foreground fill-primary-foreground ml-1" />
                </button>
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-muted to-background flex items-center justify-center">
                <Play className="w-16 h-16 text-muted-foreground/30" />
              </div>
            )}

            {/* Bottom gradient scrim */}
            <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

            {/* Back button */}
            <button onClick={() => navigate(-1)} className="absolute top-4 left-4 z-30 w-9 h-9 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Title & actions below the player box */}
          <div className="mt-6 pb-4">
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded">SÉRIE</span>
              <span className="text-muted-foreground text-sm">{series.category}</span>
            </div>

            <h1 className={`font-black text-foreground leading-tight ${isMobile ? "text-2xl" : "text-4xl"}`}>
              {cleanName(series.name)}
            </h1>

            <div className="flex items-center gap-3 mt-5">
              <button
                onClick={() => seasonEpisodes.length > 0 && setActiveEpisode(seasonEpisodes[0])}
                className="flex items-center gap-2 bg-foreground text-background font-semibold rounded-md px-6 py-3 hover:bg-foreground/90 transition text-sm"
              >
                <Play className="w-4 h-4 fill-current" />
                Assistir Agora
              </button>
              <button className="w-11 h-11 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground/50 transition">
                <Bookmark className="w-5 h-5" />
              </button>
              <button className="w-11 h-11 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground/50 transition">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Content: Synopsis + Metadata */}
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Synopsis */}
          <div className="lg:col-span-2 space-y-8">
            {series.plot && (
              <div>
                <h2 className="text-lg font-bold text-foreground mb-3">Sinopse do conteúdo</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">{series.plot}</p>
              </div>
            )}

            {/* Episodes */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-black text-foreground tracking-wide uppercase">Episódios</h2>
                {seasons.length > 0 && (
                  <SeasonDropdown
                    seasons={seasons}
                    selected={selectedSeason}
                    onSelect={(s) => { setSelectedSeason(s); setShowAllEpisodes(false); }}
                  />
                )}
              </div>

              <div className="space-y-4">
                {visibleEpisodes.map((ep) => (
                  <EpisodeCard
                    key={ep.id}
                    episode={ep}
                    seriesName={series.name}
                    onPlay={() => setActiveEpisode(ep)}
                    formatDuration={formatDuration}
                    formatEpisodeCode={formatEpisodeCode}
                  />
                ))}
              </div>

              {seasonEpisodes.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-8">Nenhum episódio nesta temporada.</p>
              )}

              {!showAllEpisodes && seasonEpisodes.length > 3 && (
                <button
                  onClick={() => setShowAllEpisodes(true)}
                  className="w-full flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground font-black uppercase tracking-wider text-sm py-5 mt-2 border-t border-border transition"
                >
                  Exibir mais episódios
                  <ChevronDown className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Right: Metadata sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-muted/50 rounded-xl p-6 space-y-5 sticky top-24">
              <h3 className="text-primary font-bold uppercase tracking-wider text-sm">Metadados</h3>

              <MetaItem label="Gênero" value={series.category} />
              {series.rating && series.rating > 0 && (
                <MetaItem label="Avaliação">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-bold text-foreground">{series.rating}</span>
                  </div>
                </MetaItem>
              )}
              <MetaItem label="Temporadas" value={String(seasons.length)} />
              <MetaItem label="Episódios" value={String(episodes.length)} />
              {series.xtream_id && <MetaItem label="Servidor Origem" value={String(series.xtream_id)} />}
              {series.created_at && <MetaItem label="Added At" value={formatDate(series.created_at)} />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// --- Sub-components ---

const MetaItem = ({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) => (
  <div>
    <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
    {children || <p className="text-foreground font-semibold text-sm mt-0.5">{value}</p>}
  </div>
);

const SeasonDropdown = ({ seasons, selected, onSelect }: { seasons: number[]; selected: number; onSelect: (s: number) => void }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 border border-border rounded-md px-4 py-2 text-sm text-foreground hover:bg-muted transition"
      >
        Temporada {selected}
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 bg-popover border border-border rounded-lg shadow-xl z-40 min-w-[160px]">
          {seasons.map((s) => (
            <button
              key={s}
              onClick={() => { onSelect(s); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition ${s === selected ? "text-primary font-bold" : "text-foreground"}`}
            >
              Temporada {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const EpisodeCard = ({
  episode,
  seriesName,
  onPlay,
  formatDuration,
  formatEpisodeCode,
}: {
  episode: Episode;
  seriesName: string;
  onPlay: () => void;
  formatDuration: (s: number | null) => string;
  formatEpisodeCode: (season: number, epNum: number) => string;
}) => (
  <button
    onClick={onPlay}
    className="w-full flex items-start gap-5 p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/40 transition text-left group"
  >
    {/* Thumbnail */}
    <div className="relative w-40 md:w-48 aspect-video rounded-lg overflow-hidden shrink-0 bg-muted">
      {episode.cover_url ? (
        <img src={episode.cover_url} alt={episode.title} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/10 flex items-center justify-center">
          <Play className="w-6 h-6 text-muted-foreground/40" />
        </div>
      )}
      <div className="absolute bottom-1.5 right-1.5 bg-primary/90 text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded">
        {episode.episode_num}
      </div>
    </div>

    {/* Info */}
    <div className="flex-1 min-w-0 py-0.5">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-black text-foreground text-sm md:text-base group-hover:text-primary transition">
          {episode.episode_num}. {seriesName} - {formatEpisodeCode(episode.season, episode.episode_num)}
        </h3>
        {episode.duration_secs && (
          <span className="text-xs text-muted-foreground shrink-0 mt-0.5 font-medium">{formatDuration(episode.duration_secs)}</span>
        )}
      </div>
      {episode.plot && (
        <p className="text-sm text-muted-foreground mt-2 line-clamp-3 leading-relaxed">{episode.plot}</p>
      )}
    </div>
  </button>
);

// Episode overlay for the player — Netflix-style two-level navigation
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
  const [view, setView] = useState<"seasons" | "episodes">("episodes");
  const hasMultipleSeasons = seasons.length > 1;

  // Active episode pinned at top as card. Others listed below in original order, scrollable.
  const activeEp = seasonEpisodes.find((e) => e.id === activeEpisodeId) || null;
  const otherEpisodes = seasonEpisodes.filter((e) => e.id !== activeEpisodeId);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Season list view
  if (view === "seasons") {
    return (
      <div className="space-y-3 max-h-[70vh] flex flex-col">
        <h3 className="text-white font-bold text-base">Temporadas</h3>
        <div className="space-y-1 overflow-y-auto overscroll-contain pr-1 flex-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full">
          {seasons.map((s) => (
            <button
              key={s}
              onClick={() => { onSelectSeason(s); setView("episodes"); }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition ${
                s === selectedSeason
                  ? "bg-white/10 text-white font-semibold"
                  : "text-white/70 hover:bg-white/5"
              }`}
            >
              {s === selectedSeason && (
                <svg className="w-4 h-4 text-white shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              )}
              <span className="text-sm">Temporada {s}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Episodes list view
  return (
    <div className="space-y-3 max-h-[70vh] flex flex-col">
      <div className="flex items-center gap-2">
        {hasMultipleSeasons && (
          <button
            onClick={() => setView("seasons")}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 transition shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
        )}
        <h3 className="text-white font-bold text-base">Temporada {selectedSeason}</h3>
      </div>

      {/* Pinned active episode card (always on top) */}
      {activeEp && (
        <div className="flex items-start gap-3 p-2 rounded-lg bg-white/10 ring-1 ring-primary/50 shrink-0">
          <span className="w-5 text-center font-bold text-sm shrink-0 mt-3 text-primary">
            {activeEp.episode_num}
          </span>
          <div className="relative w-28 aspect-video rounded overflow-hidden shrink-0 bg-white/5">
            {activeEp.cover_url ? (
              <img src={activeEp.cover_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/20">
                <Play className="w-5 h-5" />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                <Pause className="w-3.5 h-3.5 text-white fill-white" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20">
              <div className="h-full bg-primary" style={{ width: "40%" }} />
            </div>
          </div>
          <div className="flex-1 min-w-0 py-0.5">
            <p className="text-sm font-medium text-white truncate">{activeEp.title}</p>
            {activeEp.plot && (
              <p className="text-[11px] text-white/40 mt-1 line-clamp-2 leading-relaxed">{activeEp.plot}</p>
            )}
          </div>
        </div>
      )}

      {/* Other episodes list — ~6 visible, scrollable for more */}
      <div
        ref={listRef}
        className="space-y-1 overflow-y-auto overscroll-contain pr-1 flex-1 max-h-[240px] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full"
        style={{ scrollbarGutter: "stable" }}
      >
        {otherEpisodes.map((ep) => (
          <button
            key={ep.id}
            onClick={() => onSelectEpisode(ep)}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left hover:bg-white/5 transition"
          >
            <span className="w-5 text-center font-bold text-sm shrink-0 text-white/40">
              {ep.episode_num}
            </span>
            <p className="text-sm text-white/70 truncate flex-1">{ep.title}</p>
            {ep.duration_secs && (
              <span className="text-[11px] text-white/30 shrink-0">{formatDuration(ep.duration_secs)}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
export default SeriesDetail;
