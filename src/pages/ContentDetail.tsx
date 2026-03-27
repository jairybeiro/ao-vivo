import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Star, Play, Clock, Calendar, Globe, Users, ChevronRight, Info, X } from "lucide-react";
import MainHeader from "@/components/MainHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import VodPlayer from "@/components/VodPlayer";
import HlsAutoplayVideo from "@/components/HlsAutoplayVideo";
import { CheckoutModal } from "@/components/cinebusiness/CheckoutModal";

interface CastMember {
  name: string;
  character: string | null;
  profile_path: string | null;
}

interface TmdbDetails {
  name: string;
  plot: string | null;
  backdrop_url: string | null;
  cover_url: string | null;
  rating: number | null;
  trailer_url: string | null;
  original_language?: string | null;
  genres: string[];
  runtime: number | null;
  release_date: string | null;
  tagline: string | null;
  vote_count: number;
  credits: {
    cast: CastMember[];
    director: { name: string; profile_path: string | null } | null;
  };
  images: string[];
  recommendations: {
    tmdb_id: number;
    name: string;
    poster_path: string | null;
    vote_average: number | null;
  }[];
}

interface DbItem {
  id: string;
  name: string;
  stream_url?: string;
  category_tag: string | null;
  cover_url: string | null;
  backdrop_url: string | null;
  trailer_url: string | null;
  trailer_mp4_url: string | null;
  rating: number | null;
  plot?: string | null;
  xtream_id: number;
  tmdb_id: number | null;
  linked_content_id?: string | null;
  link_checkout?: string | null;
  tempo_anuncio?: number | null;
  url_imagem_anuncio?: string | null;
}

const TAG_EMOJIS: Record<string, string> = {
  "Estratégia": "🎯",
  "Mentalidade": "🧠",
  "Liderança": "👑",
  "Empreendedorismo": "🚀",
  "Superação": "💪",
  "Criatividade": "🎨",
  "Negociação": "🤝",
  "Motivação": "🔥",
};

const TAG_DESCRIPTIONS: Record<string, string> = {
  "Estratégia": "Este conteúdo desenvolve seu pensamento estratégico e capacidade de planejamento.",
  "Mentalidade": "Transforme sua mentalidade e desenvolva uma visão de crescimento contínuo.",
  "Liderança": "Aprenda com líderes que transformaram indústrias e inspiraram gerações.",
  "Empreendedorismo": "Histórias reais de empreendedores que desafiaram o impossível.",
  "Superação": "Inspire-se com histórias de resiliência e superação de adversidades.",
  "Criatividade": "Expanda seus horizontes criativos e pense fora da caixa.",
  "Negociação": "Domine a arte da negociação e da persuasão estratégica.",
  "Motivação": "Recarregue sua energia e encontre o impulso para ir além.",
};

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

const ContentDetail = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [dbItem, setDbItem] = useState<DbItem | null>(null);
  const [tmdb, setTmdb] = useState<TmdbDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [galleryIdx, setGalleryIdx] = useState<number | null>(null);
  const [showTrailerPlayer, setShowTrailerPlayer] = useState(false);
  const [hasEpisodes, setHasEpisodes] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const checkoutTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Checkout modal timer
  useEffect(() => {
    if (dbItem?.link_checkout && dbItem.tempo_anuncio) {
      checkoutTimerRef.current = setTimeout(() => {
        setShowCheckoutModal(true);
      }, (dbItem.tempo_anuncio || 30) * 1000);
    }
    return () => clearTimeout(checkoutTimerRef.current);
  }, [dbItem?.link_checkout, dbItem?.tempo_anuncio]);

  useEffect(() => {
    if (!id || !type) return;

    const fetchData = async () => {
      setLoading(true);
      const table = type === "movie" ? "vod_movies" : "vod_series";
      const { data } = await supabase.from(table).select("*").eq("id", id).single();

      if (!data) {
        setLoading(false);
        return;
      }

      const item: DbItem = {
        id: data.id,
        name: data.name,
        stream_url: (data as any).stream_url,
        category_tag: data.category_tag,
        cover_url: data.cover_url,
        backdrop_url: data.backdrop_url,
        trailer_url: data.trailer_url,
        trailer_mp4_url: (data as any).trailer_mp4_url || null,
        rating: data.rating,
        plot: (data as any).plot,
        xtream_id: data.xtream_id,
        tmdb_id: (data as any).tmdb_id || null,
        linked_content_id: (data as any).linked_content_id || null,
      };
      setDbItem(item);

      // For series, check if there are episodes
      if (type === "series") {
        const { count } = await supabase
          .from("vod_episodes")
          .select("id", { count: "exact", head: true })
          .eq("series_id", id);
        setHasEpisodes((count ?? 0) > 0);
      }

      const lookupId = item.tmdb_id || item.xtream_id;

      try {
        const { data: tmdbData } = await supabase.functions.invoke("tmdb-lookup", {
          body: { tmdb_id: lookupId, type, full_details: true },
        });
        if (tmdbData && !tmdbData.error) {
          setTmdb(tmdbData);
        }
      } catch { /* silent */ }

      setLoading(false);
    };

    fetchData();
  }, [id, type]);

  // Priority for background: trailer_mp4_url > dbItem.trailer_url > tmdb.trailer_url
  const trailerMp4 = dbItem?.trailer_mp4_url;
  const trailerUrl = dbItem?.trailer_url || tmdb?.trailer_url;
  // For background hero, prefer direct video (mp4/m3u8) over YouTube
  const bgSource = trailerMp4 || trailerUrl;
  const youtubeId = bgSource ? extractYouTubeId(bgSource) : null;
  const isDirectVideo = bgSource && !youtubeId && /\.(mp4|m3u8|m3u)/i.test(bgSource);
  const isGenericEmbed = bgSource && !youtubeId && !isDirectVideo;
  const tag = dbItem?.category_tag;
  const hasTrailer = !!(trailerMp4 || trailerUrl);

  // Check if content is playable
  const hasValidStream = type === "series"
    ? hasEpisodes
    : (dbItem?.stream_url && dbItem.stream_url !== "pending" && dbItem.stream_url.startsWith("http"));

  const handleWatch = async () => {
    // 1. If content itself has a valid stream, navigate directly
    if (hasValidStream) {
      if (type === "movie") navigate(`/vod/movie/${id}`);
      else navigate(`/vod/series/${id}`);
      return;
    }

    // 2. If there's a manual linked_content_id, use it
    if (dbItem?.linked_content_id) {
      if (type === "movie") navigate(`/vod/movie/${dbItem.linked_content_id}`);
      else navigate(`/vod/series/${dbItem.linked_content_id}`);
      return;
    }

    // 3. Auto-match by tmdb_id: find another record with same tmdb_id and valid stream
    if (dbItem?.tmdb_id) {
      if (type === "movie") {
        const { data } = await supabase
          .from("vod_movies")
          .select("id, stream_url")
          .eq("tmdb_id", dbItem.tmdb_id)
          .neq("id", dbItem.id)
          .eq("is_active", true)
          .limit(1);
        if (data && data.length > 0 && data[0].stream_url && data[0].stream_url !== "pending") {
          navigate(`/vod/movie/${data[0].id}`);
          return;
        }
      } else {
        const { data } = await supabase
          .from("vod_series")
          .select("id")
          .eq("tmdb_id", dbItem.tmdb_id)
          .neq("id", dbItem.id)
          .eq("is_active", true)
          .limit(1);
        if (data && data.length > 0) {
          // Check if the matched series has episodes
          const { count } = await supabase
            .from("vod_episodes")
            .select("id", { count: "exact", head: true })
            .eq("series_id", data[0].id);
          if ((count ?? 0) > 0) {
            navigate(`/vod/series/${data[0].id}`);
            return;
          }
        }
      }
    }

    // 4. No match found
    toast.info("Conteúdo completo ainda não disponível no catálogo");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MainHeader />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-pulse text-muted-foreground">Carregando...</div>
        </div>
      </div>
    );
  }

  if (!dbItem) {
    return (
      <div className="min-h-screen bg-background">
        <MainHeader />
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <p className="text-muted-foreground">Conteúdo não encontrado</p>
          <button onClick={() => navigate("/entretenimento")} className="text-primary text-sm flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
        </div>
      </div>
    );
  }

  const title = tmdb?.name || dbItem.name;
  const plot = tmdb?.plot || dbItem.plot;
  const backdropSrc = tmdb?.backdrop_url || dbItem.backdrop_url;
  const ratingPercent = tmdb?.rating ? Math.round(tmdb.rating * 10) : null;

  return (
    <div className="h-screen overflow-y-auto bg-background">
      {/* Fixed header */}
      <div className={`fixed top-0 left-0 right-0 z-50 ${isMobile ? "bg-[#0f0f0f]" : ""}`}>
        <MainHeader transparent={!isMobile} />
      </div>

      {/* ===== HERO SECTION ===== */}
      {isMobile ? (
        /* ===== MOBILE: Compact player + content below ===== */
        <section className="relative w-full bg-[#0f0f0f] pt-16">
          {/* Compact player - no text overlay */}
          <div className="relative w-full aspect-video">
            {/* Back arrow */}
            <button
              onClick={() => navigate("/entretenimento")}
              className="absolute top-3 left-3 z-10 w-9 h-9 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-full active:scale-90 transition-transform"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            {isDirectVideo ? (
              <HlsAutoplayVideo
                src={bgSource!}
                poster={backdropSrc}
                delayMs={5000}
                showControls
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : youtubeId ? (
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&modestbranding=1&loop=1&playlist=${youtubeId}`}
                className="absolute inset-0 w-full h-full"
                allow="autoplay; encrypted-media"
                title={title}
              />
            ) : isGenericEmbed ? (
              <iframe
                src={bgSource!}
                className="absolute inset-0 w-full h-full"
                allow="autoplay; encrypted-media; fullscreen"
                sandbox="allow-scripts allow-same-origin allow-presentation"
                referrerPolicy="no-referrer"
                title={title}
              />
            ) : backdropSrc ? (
              <img src={backdropSrc} alt={title} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--secondary))] to-[#0f0f0f]" />
            )}
            {/* Bottom gradient fade */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#0f0f0f] to-transparent pointer-events-none" />
          </div>

          {/* Content below player */}
          <div className="px-4 pb-6 pt-2 space-y-3 bg-[#0f0f0f]">
            {/* Tag */}
            {tag && (
              <div className="flex items-center gap-2">
                <span className="text-lg">{TAG_EMOJIS[tag] || "🎬"}</span>
                <span className="text-[10px] font-bold text-[hsl(var(--player-accent))] uppercase tracking-widest">{tag}</span>
              </div>
            )}

            <h2 className="text-lg font-bold text-white leading-tight">{title}</h2>

            {tmdb?.tagline && (
              <p className="text-xs text-white/50 italic">"{tmdb.tagline}"</p>
            )}

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-white/50">
              {ratingPercent && <span className="text-green-400 font-bold">{ratingPercent}% relevante</span>}
              {tmdb?.release_date && <span>{new Date(tmdb.release_date).getFullYear()}</span>}
              {tmdb?.runtime && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {Math.floor(tmdb.runtime / 60)}h {tmdb.runtime % 60}min
                </span>
              )}
              <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-bold">HD</span>
            </div>

            {/* Genres */}
            {tmdb?.genres && tmdb.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tmdb.genres.map((g) => (
                  <span key={g} className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-medium text-white/70">{g}</span>
                ))}
              </div>
            )}

            {/* Synopsis */}
            {plot && (
              <p className="text-sm text-white/70 leading-relaxed line-clamp-2">{plot}</p>
            )}

            {/* CTA buttons */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleWatch}
                className="flex-1 flex items-center justify-center gap-2 bg-[hsl(var(--player-accent))] text-white font-bold py-3 rounded-md text-sm shadow-lg active:scale-[0.97] transition-transform"
              >
                <Play className="w-4 h-4 fill-white" />
                ASSISTIR
              </button>
              <button
                onClick={() => document.getElementById("details")?.scrollIntoView({ behavior: "smooth" })}
                className="flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white font-semibold px-5 py-3 rounded-md text-sm active:scale-[0.97] transition-transform"
              >
                <Info className="w-4 h-4" />
                Mais info
              </button>
            </div>

          </div>
        </section>
      ) : (
        /* ===== DESKTOP: Player with Ambilight glow + content below ===== */
        <section className="w-full bg-[#0f0f0f] pt-16">
          {/* Ambilight container - full width */}
          <div className="relative w-full flex items-center justify-center" style={{ minHeight: "60vh" }}>
            {/* Ambilight layer: duplicated video blurred behind the player */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
              {isDirectVideo ? (
                <HlsAutoplayVideo
                  src={bgSource!}
                  poster={backdropSrc}
                  delayMs={5000}
                  className="w-full h-full object-cover scale-110 blur-3xl opacity-50"
                />
              ) : backdropSrc ? (
                <img src={backdropSrc} alt="" className="w-full h-full object-cover scale-110 blur-3xl opacity-50" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[hsl(var(--secondary))] to-[#0f0f0f]" />
              )}
              {/* Fade edges into background */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-[#0f0f0f] opacity-70" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f0f] via-transparent to-[#0f0f0f] opacity-50" />
            </div>

            {/* Main player - constrained, centered, above ambilight */}
            <div className="relative w-full max-w-5xl mx-auto aspect-video z-10 overflow-hidden rounded-xl border border-white/10">
              {/* Back arrow */}
              <button
                onClick={() => navigate("/entretenimento")}
                className="absolute top-4 left-4 z-20 w-10 h-10 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70 transition"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              {isDirectVideo ? (
                <HlsAutoplayVideo
                  src={bgSource!}
                  poster={backdropSrc}
                  delayMs={5000}
                  showControls
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : youtubeId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&modestbranding=1&loop=1&playlist=${youtubeId}`}
                  className="absolute inset-0 w-full h-full"
                  allow="autoplay; encrypted-media"
                  title={title}
                />
              ) : isGenericEmbed ? (
                <iframe
                  src={bgSource!}
                  className="absolute inset-0 w-full h-full"
                  allow="autoplay; encrypted-media; fullscreen"
                  sandbox="allow-scripts allow-same-origin allow-presentation"
                  referrerPolicy="no-referrer"
                  title={title}
                />
              ) : backdropSrc ? (
                <img src={backdropSrc} alt={title} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--secondary))] to-[#0f0f0f]" />
              )}
              {/* Bottom gradient fade */}
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0f0f0f] to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Content below player */}
          <div className="max-w-5xl mx-auto px-6 pb-8 pt-4 space-y-3">
            {tag && (
              <div className="flex items-center gap-2">
                <span className="text-xl">{TAG_EMOJIS[tag] || "🎬"}</span>
                <span className="text-xs font-bold text-[hsl(var(--player-accent))] uppercase tracking-widest">{tag}</span>
              </div>
            )}
            <h1 className="text-3xl lg:text-4xl font-black text-white leading-tight">{title}</h1>
            {tmdb?.tagline && <p className="text-sm text-white/50 italic">"{tmdb.tagline}"</p>}
            <div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
              {ratingPercent && <span className="text-green-400 font-bold text-sm">{ratingPercent}% relevante</span>}
              {tmdb?.release_date && <span>{new Date(tmdb.release_date).getFullYear()}</span>}
              {tmdb?.runtime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{Math.floor(tmdb.runtime / 60)}h {tmdb.runtime % 60}min</span>}
              <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-bold">HD</span>
            </div>
            {tmdb?.genres && tmdb.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tmdb.genres.map((g) => (
                  <span key={g} className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-medium text-white/70">{g}</span>
                ))}
              </div>
            )}
            {plot && <p className="text-sm text-white/70 max-w-xl leading-relaxed line-clamp-3">{plot}</p>}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleWatch}
                className="flex items-center gap-2.5 bg-[hsl(var(--player-accent))] text-white font-bold px-8 py-3.5 rounded-md hover:brightness-110 transition-all text-base shadow-xl"
              >
                <Play className="w-5 h-5 fill-white" />
                ASSISTIR
              </button>
              <button onClick={() => document.getElementById("details")?.scrollIntoView({ behavior: "smooth" })} className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white font-semibold px-7 py-3.5 rounded-md hover:bg-white/30 transition-colors text-base">
                <Info className="w-5 h-5" />
                Mais info
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ===== CONTENT BODY ===== */}
      <main id="details" className="container mx-auto px-4 md:px-8 py-8 space-y-10 -mt-8 relative z-20">

        {/* Tag insight + Synopsis */}
        <div className="grid md:grid-cols-[1fr_280px] gap-8">
          <div className="space-y-5">
            {tag && TAG_DESCRIPTIONS[tag] && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
                <span className="text-2xl mt-0.5">{TAG_EMOJIS[tag] || "🎬"}</span>
                <div>
                  <p className="text-sm font-semibold text-primary">{tag}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{TAG_DESCRIPTIONS[tag]}</p>
                </div>
              </div>
            )}
            {plot && (
              <div>
                <h2 className="text-lg font-bold text-foreground mb-2">Sinopse</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{plot}</p>
              </div>
            )}
            {tmdb?.credits?.director && (
              <p className="text-xs text-muted-foreground">
                Direção: <span className="text-foreground font-medium">{tmdb.credits.director.name}</span>
              </p>
            )}
          </div>

          {/* Poster */}
          <div className="hidden md:block">
            {(tmdb?.cover_url || dbItem.cover_url) && (
              <img
                src={tmdb?.cover_url || dbItem.cover_url || ""}
                alt={title}
                className="w-full rounded-xl shadow-2xl"
              />
            )}
          </div>
        </div>

        {/* Cast */}
        {tmdb?.credits?.cast && tmdb.credits.cast.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Elenco
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
              {tmdb.credits.cast.map((actor, i) => (
                <div key={i} className="flex-shrink-0 w-24 text-center">
                  <div className="w-20 h-20 mx-auto rounded-full overflow-hidden bg-muted">
                    {actor.profile_path ? (
                      <img src={actor.profile_path} alt={actor.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-lg font-bold">
                        {actor.name[0]}
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-medium text-foreground mt-1.5 truncate">{actor.name}</p>
                  {actor.character && (
                    <p className="text-[10px] text-muted-foreground truncate">{actor.character}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Gallery */}
        {tmdb?.images && tmdb.images.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">Galeria</h2>
            <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
              {tmdb.images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`Cena ${i + 1}`}
                  className="flex-shrink-0 h-32 md:h-44 rounded-lg object-cover cursor-pointer hover:ring-2 ring-primary transition"
                  loading="lazy"
                  onClick={() => setGalleryIdx(i)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Gallery Lightbox */}
        {galleryIdx !== null && tmdb?.images && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setGalleryIdx(null)}
          >
            <img
              src={tmdb.images[galleryIdx]}
              alt="Galeria"
              className="max-w-full max-h-[85vh] rounded-lg shadow-2xl"
            />
          </div>
        )}

        {/* Recommendations */}
        {tmdb?.recommendations && tmdb.recommendations.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              Recomendações
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
              {tmdb.recommendations.map((rec) => (
                <div key={rec.tmdb_id} className="flex-shrink-0 w-32">
                  <div className="aspect-[2/3] bg-muted rounded-lg overflow-hidden">
                    {rec.poster_path ? (
                      <img src={rec.poster_path} alt={rec.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                        {rec.name}
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-medium truncate mt-1">{rec.name}</p>
                  {rec.vote_average && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
                      {rec.vote_average}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* ===== TRAILER PLAYER OVERLAY ===== */}
      {showTrailerPlayer && hasTrailer && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col">
          {/* Assistir Completo button — near volume controls */}
          <button
            onClick={() => {
              setShowTrailerPlayer(false);
              handleWatch();
            }}
            className="absolute bottom-[calc(env(safe-area-inset-bottom)+34px)] right-28 md:right-36 z-[70] flex items-center gap-1 bg-white/80 text-black font-semibold px-2.5 py-1 rounded hover:bg-white transition-colors text-[11px] shadow-md backdrop-blur-sm"
          >
            <Play className="w-3 h-3 fill-black" />
            {type === "series" ? "Veja Série" : "Veja Filme"}
          </button>

          {/* Player */}
          <div className="flex-1">
            {(trailerMp4 || (trailerUrl && /\.(mp4|m3u8|m3u)/i.test(trailerUrl))) ? (
              <VodPlayer
                src={trailerMp4 || trailerUrl!}
                title={`Trailer - ${title}`}
                poster={backdropSrc || undefined}
              />
            ) : trailerUrl && extractYouTubeId(trailerUrl) ? (
              <iframe
                src={`https://www.youtube.com/embed/${extractYouTubeId(trailerUrl)}?autoplay=1&controls=1&rel=0&modestbranding=1`}
                className="w-full h-full"
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
                title={`Trailer - ${title}`}
              />
            ) : (
              <iframe
                src={trailerUrl!}
                className="w-full h-full"
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
                sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
                referrerPolicy="no-referrer"
                title={`Trailer - ${title}`}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentDetail;
