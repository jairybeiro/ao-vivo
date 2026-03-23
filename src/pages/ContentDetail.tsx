import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Star, Play, Clock, Calendar, Globe, Users, ChevronRight } from "lucide-react";
import MainHeader from "@/components/MainHeader";
import { useIsMobile } from "@/hooks/use-mobile";

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
  rating: number | null;
  plot?: string | null;
  xtream_id: number;
  tmdb_id: number | null;
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
        rating: data.rating,
        plot: (data as any).plot,
        xtream_id: data.xtream_id,
      };
      setDbItem(item);

      // Fetch full TMDB details
      try {
        const { data: tmdbData } = await supabase.functions.invoke("tmdb-lookup", {
          body: { tmdb_id: item.xtream_id, type, full_details: true },
        });
        if (tmdbData && !tmdbData.error) {
          setTmdb(tmdbData);
        }
      } catch { /* silent */ }

      setLoading(false);
    };

    fetchData();
  }, [id, type]);

  const trailerUrl = tmdb?.trailer_url || dbItem?.trailer_url;
  const youtubeId = trailerUrl ? extractYouTubeId(trailerUrl) : null;
  const tag = dbItem?.category_tag;

  const handleWatch = () => {
    if (type === "movie") navigate(`/vod/movie/${id}`);
    else navigate(`/vod/series/${id}`);
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

  return (
    <div className="min-h-screen bg-background">
      <MainHeader />

      {/* Trailer Hero Section */}
      <div className="relative w-full aspect-video max-h-[70vh] bg-black overflow-hidden">
        {youtubeId ? (
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&modestbranding=1&loop=1&playlist=${youtubeId}`}
            className="absolute inset-0 w-full h-full"
            allow="autoplay; encrypted-media"
            allowFullScreen
            title={title}
          />
        ) : dbItem.backdrop_url || tmdb?.backdrop_url ? (
          <img
            src={tmdb?.backdrop_url || dbItem.backdrop_url || ""}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : null}

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />

        {/* Back button */}
        <button
          onClick={() => navigate("/entretenimento")}
          className="absolute top-4 left-4 z-20 p-2 rounded-full bg-background/40 backdrop-blur-md hover:bg-background/60 transition"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>

        {/* Floating CTA */}
        <div className="absolute bottom-8 left-6 right-6 md:left-12 md:right-12 z-20">
          <div className="max-w-2xl space-y-3">
            {tag && (
              <div className="flex items-center gap-2">
                <span className="text-2xl">{TAG_EMOJIS[tag] || "🎬"}</span>
                <span className="text-xs font-bold text-primary uppercase tracking-widest">{tag}</span>
              </div>
            )}
            <h1 className="text-3xl md:text-5xl font-black text-foreground drop-shadow-2xl leading-tight">{title}</h1>

            {tmdb?.tagline && (
              <p className="text-sm md:text-base text-foreground/70 italic">"{tmdb.tagline}"</p>
            )}

            <div className="flex flex-wrap items-center gap-3 text-xs text-foreground/60">
              {tmdb?.rating && (
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                  {tmdb.rating}/10
                  {tmdb.vote_count > 0 && <span className="text-foreground/40">({tmdb.vote_count.toLocaleString()})</span>}
                </span>
              )}
              {tmdb?.runtime && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {Math.floor(tmdb.runtime / 60)}h {tmdb.runtime % 60}min
                </span>
              )}
              {tmdb?.release_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(tmdb.release_date).getFullYear()}
                </span>
              )}
              {tmdb?.original_language && (
                <span className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  {tmdb.original_language.toUpperCase()}
                </span>
              )}
            </div>

            {tmdb?.genres && tmdb.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tmdb.genres.map((g) => (
                  <span key={g} className="px-2 py-0.5 rounded-full bg-foreground/10 backdrop-blur-sm text-[10px] font-medium text-foreground/80">
                    {g}
                  </span>
                ))}
              </div>
            )}

            {/* CTA Button */}
            <button
              onClick={handleWatch}
              className="mt-2 inline-flex items-center gap-2.5 px-6 py-3 md:px-8 md:py-3.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm md:text-base shadow-2xl hover:brightness-110 transition-all backdrop-blur-md"
            >
              <Play className="w-5 h-5 fill-current" />
              Assistir agora: {title}
            </button>
          </div>
        </div>
      </div>

      {/* Content Body */}
      <main className="container mx-auto px-4 md:px-8 py-8 space-y-10">

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

        {/* Bottom CTA */}
        <div className="text-center py-6">
          <button
            onClick={handleWatch}
            className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-lg bg-primary text-primary-foreground font-bold text-base shadow-xl hover:brightness-110 transition-all"
          >
            <Play className="w-5 h-5 fill-current" />
            Assistir agora: {title}
          </button>
        </div>
      </main>
    </div>
  );
};

export default ContentDetail;
