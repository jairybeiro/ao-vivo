import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Star, Play, Clock, Calendar, Globe, Users, ChevronRight, Info, X } from "lucide-react";
import MainHeader from "@/components/MainHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import HlsAutoplayVideo from "@/components/HlsAutoplayVideo";
import FullscreenTrailerPlayer from "@/components/FullscreenTrailerPlayer";

interface CineBusinessItem {
  id: string;
  name: string;
  category: string;
  cover_url: string | null;
  backdrop_url: string | null;
  rating: number | null;
  sinopse: string | null;
  trailer_url: string | null;
  trailer_mp4_url: string | null;
  stream_url: string | null;
  tmdb_id: number | null;
  link_checkout?: string | null;
  tempo_anuncio?: number | null;
  url_imagem_anuncio?: string | null;
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
    cast: Array<{ name: string; character: string | null; profile_path: string | null }>;
    director: { name: string; profile_path: string | null } | null;
  };
  images: string[];
  recommendations: Array<{
    tmdb_id: number;
    name: string;
    poster_path: string | null;
    vote_average: number | null;
  }>;
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

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

const CineBusinessDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [item, setItem] = useState<CineBusinessItem | null>(null);
  const [tmdb, setTmdb] = useState<TmdbDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTrailerPlayer, setShowTrailerPlayer] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const checkoutTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Checkout modal timer
  useEffect(() => {
    if (item?.link_checkout && item.tempo_anuncio) {
      checkoutTimerRef.current = setTimeout(() => {
        setShowCheckoutModal(true);
      }, (item.tempo_anuncio || 30) * 1000);
    }
    return () => clearTimeout(checkoutTimerRef.current);
  }, [item?.link_checkout, item?.tempo_anuncio]);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("vod_movies")
        .select("*")
        .eq("id", id)
        .in("category", ["Negócios", "Empreendedorismo", "Mentalidade", "Liderança", "Finanças", "Marketing", "Produtividade", "Tecnologia", "Desenvolvimento Pessoal", "Startups"])
        .single();

      if (!data) {
        setLoading(false);
        navigate("/entretenimento");
        return;
      }

      const cineItem: CineBusinessItem = {
        id: data.id,
        name: data.name,
        category: data.category,
        cover_url: data.cover_url,
        backdrop_url: data.backdrop_url,
        rating: data.rating,
        sinopse: data.sinopse || null,
        trailer_url: data.trailer_url || null,
        trailer_mp4_url: (data as any).trailer_mp4_url || null,
        stream_url: (data as any).stream_url || null,
        tmdb_id: (data as any).tmdb_id || null,
        link_checkout: (data as any).link_checkout || null,
        tempo_anuncio: (data as any).tempo_anuncio || null,
        url_imagem_anuncio: (data as any).url_imagem_anuncio || null,
      };
      setItem(cineItem);

      // Fetch TMDB details if available
      const lookupId = cineItem.tmdb_id;
      try {
        if (lookupId) {
          const { data: tmdbData } = await supabase.functions.invoke("tmdb-lookup", {
            body: { tmdb_id: lookupId, type: "movie", full_details: true },
          });
          if (tmdbData && !tmdbData.error) {
            setTmdb(tmdbData);
          }
        } else {
          // Fallback: search by name
          const { data: tmdbData } = await supabase.functions.invoke("tmdb-lookup", {
            body: { search_name: cineItem.name, type: "movie" },
          });
          if (tmdbData && !tmdbData.error) {
            setTmdb(tmdbData);
          }
        }
      } catch {
        // silent fail
      }

      setLoading(false);
    };

    fetchData();
  }, [id, navigate]);

  // Priority: trailer_mp4_url (MP4/M3U8) > trailer_url (YouTube) > tmdb.trailer_url
  const trailerMp4 = item?.trailer_mp4_url;
  const trailerUrl = item?.trailer_url || tmdb?.trailer_url;
  
  // For display: prefer direct video (mp4/m3u8) over YouTube
  const bgSource = trailerMp4 || trailerUrl;
  const youtubeId = bgSource ? extractYouTubeId(bgSource) : null;
  const isDirectVideo = bgSource && !youtubeId && /\.(mp4|m3u8|m3u)/i.test(bgSource);
  
  const tag = item?.category;
  const hasTrailer = !!(trailerMp4 || trailerUrl);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Conteúdo não encontrado</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-y-auto">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <MainHeader transparent={!isMobile} />
      </div>

      {/* Hero Section */}
      <section className={`relative w-full ${isMobile ? 'bg-[#0f0f0f] pt-14' : 'bg-[#0f0f0f] pt-16'}`}>
        {/* Ambilight Background - desktop only */}
        {!isMobile && (
          <div className="absolute inset-0 z-0 overflow-hidden">
            {item.backdrop_url && (
              <img
                src={item.backdrop_url}
                alt=""
                className="w-full h-full object-cover scale-110 blur-3xl opacity-30"
              />
            )}
            <div className="absolute inset-0 bg-background/80" />
          </div>
        )}

        {/* Player Area */}
        <div className={`relative z-10 ${isMobile ? '' : 'flex items-center justify-center'}`} style={isMobile ? {} : { minHeight: "70vh" }}>
          <div className={`relative w-full ${isMobile ? 'aspect-video' : 'max-w-5xl mx-auto aspect-video overflow-hidden rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.6)] border border-white/10'}`}>
            {isDirectVideo ? (
              <HlsAutoplayVideo
                src={bgSource}
                poster={item.backdrop_url}
                delayMs={3000}
                className="w-full h-full object-cover"
              />
            ) : youtubeId ? (
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${youtubeId}&modestbranding=1&rel=0`}
                className="w-full h-full scale-105 pointer-events-none"
                allow="autoplay"
              />
            ) : item.backdrop_url ? (
              <img
                src={item.backdrop_url}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900" />
            )}

            {/* Netflix-style gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent pointer-events-none" />

            {/* Back Button */}
            <button
              onClick={() => navigate(-1)}
              className="absolute top-3 left-3 z-30 w-9 h-9 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Overlay Content */}
            <div className={`absolute bottom-0 left-0 right-0 z-20 ${isMobile ? 'p-4 pb-5' : 'p-8 pb-10'}`}>
              {/* Title and Rating */}
              <div className="flex items-end justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h1 className={`font-bold text-white ${isMobile ? 'text-xl' : 'text-3xl md:text-4xl'}`}>{item.name}</h1>
                  {tag && (
                    <p className="text-xs md:text-sm text-white/60 mt-1">
                      {TAG_EMOJIS[tag] || "📌"} {tag}
                    </p>
                  )}
                </div>
                {item.rating && item.rating > 0 && (
                  <div className={`flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-lg shrink-0 ${isMobile ? 'px-2.5 py-1.5' : 'px-4 py-2'}`}>
                    <Star className={`text-yellow-500 fill-yellow-500 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                    <span className={`font-bold text-white ${isMobile ? 'text-sm' : 'text-lg'}`}>{item.rating}</span>
                  </div>
                )}
              </div>

              {/* Meta Info */}
              <div className="flex flex-wrap gap-3 text-xs md:text-sm text-white/60 mt-2">
                {tmdb?.release_date && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(tmdb.release_date).getFullYear()}
                  </div>
                )}
                {tmdb?.runtime && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {tmdb.runtime} min
                  </div>
                )}
                {tmdb?.original_language && (
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" />
                    {tmdb.original_language.toUpperCase()}
                  </div>
                )}
              </div>

              {/* Sinopse */}
              {(item.sinopse || tmdb?.plot) && (
                <p className={`text-white/70 leading-relaxed mt-2 ${isMobile ? 'text-xs line-clamp-2' : 'text-sm max-w-lg line-clamp-3'}`}>
                  {item.sinopse || tmdb?.plot}
                </p>
              )}

              {/* Action Buttons */}
              <div className={`flex gap-2.5 ${isMobile ? 'mt-3' : 'mt-4'}`}>
                {hasTrailer && (
                  <button
                    onClick={() => setShowTrailerPlayer(true)}
                    className={`flex items-center gap-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors ${isMobile ? 'px-4 py-2.5 text-xs flex-1' : 'px-6 py-3 text-sm'}`}
                  >
                    <Play className={`fill-current ${isMobile ? 'w-3.5 h-3.5' : 'w-5 h-5'}`} />
                    Assistir Trailer
                  </button>
                )}
                {item.link_checkout && (
                  <button
                    onClick={() => window.open(item.link_checkout, "_blank")}
                    className={`flex items-center justify-center gap-2 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-lg hover:bg-white/30 transition-colors ${isMobile ? 'px-4 py-2.5 text-xs flex-1' : 'px-6 py-3 text-sm'}`}
                  >
                    Comprar Acesso
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        {!isMobile && <div className="h-12 bg-gradient-to-b from-transparent to-background relative z-10" />}
      </section>

      {/* TMDB Details */}
      {tmdb && (
        <section className="max-w-5xl mx-auto px-4 md:px-6 py-12 space-y-12">
          {/* Genres */}
          {tmdb.genres && tmdb.genres.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">Gêneros</h2>
              <div className="flex flex-wrap gap-2">
                {tmdb.genres.map((genre) => (
                  <span
                    key={genre}
                    className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Cast */}
          {tmdb.credits?.cast && tmdb.credits.cast.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Elenco
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {tmdb.credits.cast.slice(0, 12).map((member, idx) => (
                  <div key={idx} className="text-center">
                    {member.profile_path && (
                      <img
                        src={`https://image.tmdb.org/t/p/w185${member.profile_path}`}
                        alt={member.name}
                        className="w-full aspect-[2/3] object-cover rounded-lg mb-2"
                      />
                    )}
                    <p className="text-sm font-semibold text-foreground line-clamp-1">{member.name}</p>
                    {member.character && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{member.character}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Director */}
          {tmdb.credits?.director && (
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">Diretor</h2>
              <p className="text-foreground">{tmdb.credits.director.name}</p>
            </div>
          )}
        </section>
      )}

      {/* Trailer Player Modal */}
      {showTrailerPlayer && (
        <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
          <button
            onClick={() => setShowTrailerPlayer(false)}
            className="absolute top-4 right-4 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="w-full h-full">
            <VodPlayer
              src={trailerMp4 || trailerUrl || ""}
              title={item.name}
              poster={item.cover_url || item.backdrop_url || undefined}
              contentType="movie"
              onBack={() => setShowTrailerPlayer(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CineBusinessDetail;
