import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Star, Play, ChevronDown, Bookmark, Share2 } from "lucide-react";
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
  const cleanName = (name: string) => name.replace(/\s*\((\d{4})\)\s*$/, (_, yr) => name.includes(yr) ? '' : ` (${yr})`).trim();

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
      <div className="fixed inset-0 z-[9999] bg-black">
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
          onEnded={() => { if (nextEpisode) setActiveEpisode(nextEpisode); }}
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

// Episode overlay for the player
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
}) => (
  <div className="space-y-4">
    <h3 className="text-white font-bold text-lg">Temporada {selectedSeason}</h3>
    {seasons.length > 1 && (
      <div className="flex gap-2 flex-wrap">
        {seasons.map((s) => (
          <button
            key={s}
            onClick={() => onSelectSeason(s)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition ${
              s === selectedSeason ? "bg-primary text-primary-foreground" : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            T{s}
          </button>
        ))}
      </div>
    )}
    <div className="space-y-1">
      {seasonEpisodes.map((ep) => (
        <button
          key={ep.id}
          onClick={() => onSelectEpisode(ep)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition text-sm ${
            ep.id === activeEpisodeId ? "bg-primary/20 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
          }`}
        >
          <span className={`w-6 text-center font-bold text-xs shrink-0 ${ep.id === activeEpisodeId ? "text-primary" : ""}`}>
            {ep.episode_num}
          </span>
          <span className="flex-1 truncate">{ep.title}</span>
          {ep.duration_secs && <span className="text-xs text-white/40 shrink-0">{formatDuration(ep.duration_secs)}</span>}
        </button>
      ))}
    </div>
  </div>
);

export default SeriesDetail;
