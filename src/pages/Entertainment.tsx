import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Film, Clapperboard, Star, PlayCircle, ChevronRight, Play } from "lucide-react";
import MainHeader from "@/components/MainHeader";

interface CuratedItem {
  id: string;
  name: string;
  type: "movie" | "series";
  category_tag: string;
  cover_url: string | null;
  backdrop_url: string | null;
  rating: number | null;
  trailer_url: string | null;
  plot?: string | null;
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

const Entertainment = () => {
  const navigate = useNavigate();
  const [collections, setCollections] = useState<Record<string, CuratedItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [heroItem, setHeroItem] = useState<CuratedItem | null>(null);
  

  const fetchCurated = useCallback(async () => {
    setLoading(true);

    const [{ data: movies }, { data: series }] = await Promise.all([
      supabase
        .from("vod_movies")
        .select("id, name, cover_url, backdrop_url, rating, trailer_url, category_tag")
        .not("category_tag", "is", null)
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("vod_series")
        .select("id, name, cover_url, backdrop_url, rating, trailer_url, category_tag, plot")
        .not("category_tag", "is", null)
        .eq("is_active", true)
        .order("name"),
    ]);

    const items: CuratedItem[] = [
      ...(movies || []).map((m: any) => ({ ...m, type: "movie" as const })),
      ...(series || []).map((s: any) => ({ ...s, type: "series" as const })),
    ];

    const grouped: Record<string, CuratedItem[]> = {};
    items.forEach((item) => {
      if (!item.category_tag) return;
      if (!grouped[item.category_tag]) grouped[item.category_tag] = [];
      grouped[item.category_tag].push(item);
    });

    setCollections(grouped);

    // Pick hero: item with backdrop
    const withBackdrop = items.filter((i) => i.backdrop_url);
    if (withBackdrop.length > 0) {
      setHeroItem(withBackdrop[Math.floor(Math.random() * withBackdrop.length)]);
    }

    setLoading(false);
  }, []);

  useEffect(() => { fetchCurated(); }, [fetchCurated]);

  // Fetch background glow videos
  useEffect(() => {
    const fetchBgVideos = async () => {
      const { data } = await supabase
        .from("hero_bg_videos")
        .select("youtube_url")
        .eq("is_active", true);
      if (data && data.length > 0) {
        const pick = data[Math.floor(Math.random() * data.length)];
        setBgVideoUrl((pick as any).youtube_url);
      }
    };
    fetchBgVideos();
  }, []);

  const bgVideoId = useMemo(() => {
    if (!bgVideoUrl) return null;
    if (bgVideoUrl.includes("v=")) return bgVideoUrl.split("v=")[1]?.split("&")[0];
    if (bgVideoUrl.includes("youtu.be/")) return bgVideoUrl.split("youtu.be/")[1]?.split("?")[0];
    return bgVideoUrl;
  }, [bgVideoUrl]);

  const heroVideoId = useMemo(() => {
    if (!heroItem?.trailer_url) return null;
    const url = heroItem.trailer_url;
    if (url.includes("v=")) return url.split("v=")[1]?.split("&")[0];
    return url.split("/").pop();
  }, [heroItem?.trailer_url]);

  const handleClick = (item: CuratedItem) => {
    navigate(`/entretenimento/${item.type}/${item.id}`);
  };

  const scrollToContent = () => {
    document.getElementById("collections")?.scrollIntoView({ behavior: "smooth" });
  };

  const tags = Object.keys(collections);

  // The actual BG glow video ID: use dedicated bg video if available, else fallback to hero trailer
  const glowVideoId = bgVideoId || heroVideoId;

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed header over hero */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <MainHeader />
      </div>

      {/* ===== FULL-SCREEN HERO WITH NETFLIX AMBILIGHT ===== */}
      <section
        className="relative w-screen overflow-hidden"
        style={{ background: "#0f0f0f", height: "110vh" }}
      >
        <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true" focusable="false">
          <defs>
            <clipPath id="hero-player-clip" clipPathUnits="objectBoundingBox">
              <path d="M0,0 H1 V1 C0.78,0.935 0.22,0.935 0,1 Z" />
            </clipPath>
          </defs>
        </svg>

        {/* === CAMADA 1: Reflexo Desfocado (Ambilight) === */}
        {(heroVideoId || heroItem?.backdrop_url) && (
          <div
            className="absolute inset-0 z-[1]"
            style={{
              filter: "blur(60px)",
              opacity: 0.5,
              transform: "scale(1.5)",
            }}
          >
            {heroVideoId ? (
              <iframe
                src={`https://www.youtube.com/embed/${heroVideoId}?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&playlist=${heroVideoId}`}
                className="absolute w-[300%] h-[300%] top-1/2 left-1/2 pointer-events-none"
                style={{ border: 0, transform: "translate(-50%, -50%)" }}
                allow="autoplay; encrypted-media"
                title="Ambilight reflection"
              />
            ) : (
              <img
                src={heroItem!.backdrop_url!}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
          </div>
        )}

        {/* === CAMADA 2: Player Principal === */}
        <div className="absolute inset-0 z-[2] flex items-center justify-center pt-14">
          <div className="relative w-[92vw] h-[80vh]">
            {/* Player content — top rounded, bottom concave */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{
                borderRadius: "18px",
                clipPath: "url(#hero-player-clip)",
              }}
            >
              {heroVideoId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${heroVideoId}?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&playlist=${heroVideoId}`}
                  className="absolute w-[300%] h-[300%] top-1/2 left-1/2 pointer-events-none"
                  style={{ border: 0, transform: "translate(-50%, -50%)" }}
                  allow="autoplay; encrypted-media"
                  title="Hero trailer"
                />
              ) : heroItem?.backdrop_url ? (
                <img
                  src={heroItem.backdrop_url}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--secondary))] to-[#0f0f0f]" />
              )}
            </div>
          </div>
        </div>

        {/* === CAMADA 3: Gradiente Perceptual — apenas base e laterais === */}
        <div
          className="absolute inset-0 z-[3] pointer-events-none"
          style={{
            background: `linear-gradient(180deg, transparent 65%, rgba(15,15,15,0.6) 85%, #0f0f0f 100%)`,
          }}
        />
        <div
          className="absolute inset-0 z-[3] pointer-events-none"
          style={{
            background: `linear-gradient(90deg, #0f0f0f 0%, transparent 15%, transparent 85%, #0f0f0f 100%)`,
          }}
        />

        {/* === CAMADA 4: Conteúdo Hero (título, sinopse, CTAs) === */}
        <div className="absolute inset-0 z-[4] flex flex-col justify-end px-6 pb-32 md:px-14 md:pb-40">
          <div className="max-w-2xl space-y-3">
            <h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1] tracking-tight drop-shadow-2xl"
              style={{ fontFamily: "'Helvetica Neue', 'Arial Black', 'Inter', sans-serif" }}
            >
              TRAILERS QUE
              <br />
              <span className="text-[hsl(var(--player-accent))]">INSPIRAM</span>
            </h1>

            {heroItem?.name && (
              <p className="text-base sm:text-lg md:text-xl font-semibold text-white/90 drop-shadow-lg">
                {heroItem.name}
              </p>
            )}

            <p className="text-sm sm:text-base md:text-lg text-white/75 max-w-lg leading-relaxed drop-shadow-lg line-clamp-3">
              {heroItem?.plot || "A curadoria definitiva para expandir sua visão e mentalidade através do cinema."}
            </p>

            <div className="flex items-center gap-3 text-xs text-white/60">
              <span className="text-green-400 font-bold text-sm">98% Relevante</span>
              <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-bold">HD</span>
              <span>Curadoria Exclusiva</span>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={scrollToContent}
                className="flex items-center gap-2.5 bg-[hsl(var(--player-accent))] text-white font-bold px-6 py-3 md:px-8 md:py-3.5 rounded-md hover:brightness-110 transition-all text-sm md:text-base shadow-xl"
              >
                <Play className="w-5 h-5 fill-white" />
                COMEÇAR AGORA
              </button>
              <button
                onClick={scrollToContent}
                className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white font-semibold px-5 py-3 md:px-7 md:py-3.5 rounded-md hover:bg-white/30 transition-colors text-sm md:text-base"
              >
                <Film className="w-5 h-5" />
                Explorar
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== COLLECTIONS ===== */}
      <main id="collections" className="container mx-auto px-4 py-8 space-y-10 -mt-8 relative z-20">
        {loading ? (
          <div className="text-center text-muted-foreground py-16">Carregando coleções...</div>
        ) : tags.length === 0 ? (
          <div className="text-center text-muted-foreground py-16">
            <Film className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum conteúdo curado disponível.</p>
            <p className="text-xs mt-1">Adicione conteúdos no painel Admin → Curadoria.</p>
          </div>
        ) : (
          tags.map((tag) => (
            <section key={tag} className="space-y-3">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <span className="text-xl">{TAG_EMOJIS[tag] || "🎬"}</span>
                {tag}
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
                {collections[tag].map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleClick(item)}
                    className="flex-shrink-0 w-48 md:w-56 cursor-pointer group"
                  >
                    <div className="aspect-[2/3] bg-muted rounded-lg overflow-hidden relative">
                      {item.cover_url ? (
                        <img
                          src={item.cover_url}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {item.type === "movie" ? (
                            <Film className="w-8 h-8 text-muted-foreground" />
                          ) : (
                            <Clapperboard className="w-8 h-8 text-muted-foreground" />
                          )}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <PlayCircle className="w-10 h-10 text-white" />
                      </div>
                      {item.rating && item.rating > 0 && (
                        <div className="absolute top-1.5 right-1.5 bg-background/80 text-xs px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          {item.rating}
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-medium truncate mt-1.5">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {item.type === "movie" ? "Filme" : "Série"}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  );
};

export default Entertainment;
