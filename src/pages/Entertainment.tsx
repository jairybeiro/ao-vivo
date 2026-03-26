import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Film, Clapperboard, Star, PlayCircle, ChevronRight, Play } from "lucide-react";
import MainHeader from "@/components/MainHeader";
import HlsAutoplayVideo from "@/components/HlsAutoplayVideo";
import { useIsMobile } from "@/hooks/use-mobile";

interface CuratedItem {
  id: string;
  name: string;
  type: "movie" | "series";
  category_tag: string;
  cover_url: string | null;
  backdrop_url: string | null;
  rating: number | null;
  trailer_url: string | null;
  trailer_mp4_url: string | null;
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
  const isMobile = useIsMobile();
  const [collections, setCollections] = useState<Record<string, CuratedItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [heroItem, setHeroItem] = useState<CuratedItem | null>(null);

  const fetchCurated = useCallback(async () => {
    setLoading(true);

    const [{ data: movies }, { data: series }] = await Promise.all([
      supabase
        .from("vod_movies")
        .select("id, name, cover_url, backdrop_url, rating, trailer_url, trailer_mp4_url, category_tag")
        .not("category_tag", "is", null)
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("vod_series")
        .select("id, name, cover_url, backdrop_url, rating, trailer_url, trailer_mp4_url, category_tag, plot")
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

    // Pick hero: prefer items with trailer_mp4_url, then backdrop
    const withVideo = items.filter((i) => i.trailer_mp4_url);
    const withBackdrop = items.filter((i) => i.backdrop_url);
    const candidates = withVideo.length > 0 ? withVideo : withBackdrop;
    if (candidates.length > 0) {
      setHeroItem(candidates[Math.floor(Math.random() * candidates.length)]);
    }

    setLoading(false);
  }, []);

  useEffect(() => { fetchCurated(); }, [fetchCurated]);

  // Resolve hero video: trailer_mp4_url (HD direct) is the only video source
  const heroVideoUrl = heroItem?.trailer_mp4_url || null;

  const handleClick = (item: CuratedItem) => {
    navigate(`/entretenimento/${item.type}/${item.id}`);
  };

  const scrollToContent = () => {
    document.getElementById("collections")?.scrollIntoView({ behavior: "smooth" });
  };

  const tags = Object.keys(collections);

  return (
    <div className="min-h-screen bg-background overflow-y-auto" style={{ height: "100vh" }}>
      {/* Transparent header overlaid on hero */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <MainHeader transparent />
      </div>

      {/* ===== FULL-SCREEN HERO WITH NETFLIX AMBILIGHT ===== */}
      <section
        className="relative w-full overflow-hidden"
        style={{ background: "#0f0f0f", height: "85vh" }}
      >
        <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true" focusable="false">
          <defs>
            <clipPath id="hero-player-clip" clipPathUnits="objectBoundingBox">
              <path d="M0,0 H1 V1 C0.78,0.935 0.22,0.935 0,1 Z" />
            </clipPath>
          </defs>
        </svg>

        {/* === CAMADA 1: Reflexo Desfocado (Ambilight) === */}
        {(heroVideoUrl || heroItem?.backdrop_url) && (
          <div
            className="absolute inset-0 z-[1] hidden md:block"
            style={{
              filter: "blur(45px)",
              opacity: 0.75,
              transform: "scale(1.5)",
            }}
          >
            {heroVideoUrl ? (
              <HlsAutoplayVideo
                src={heroVideoUrl}
                poster={heroItem?.backdrop_url}
                delayMs={5000}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
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
        <div className="absolute inset-0 z-[2] flex items-center justify-center md:pt-14">
          <div className="relative w-full h-full md:w-[92vw] md:h-[80vh]">
            <div
              className="absolute inset-0 overflow-hidden"
              style={{
                borderRadius: isMobile ? "0px" : "18px",
                clipPath: isMobile ? "none" : "url(#hero-player-clip)",
              }}
            >
              {heroVideoUrl ? (
                <HlsAutoplayVideo
                  src={heroVideoUrl}
                  poster={heroItem?.backdrop_url}
                  delayMs={5000}
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
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
            <svg className="absolute inset-0 w-full h-full pointer-events-none hidden md:block" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M2,0 H98 Q100,0 100,2 V100 C78,93.5 22,93.5 0,100 V2 Q0,0 2,0 Z" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.3" vectorEffect="non-scaling-stroke" style={{ strokeWidth: '1px' }} />
            </svg>
          </div>
        </div>

        {/* === CAMADA 3: Gradiente Perceptual === */}
        <div
          className="absolute inset-0 z-[3] pointer-events-none"
          style={{
            background: `linear-gradient(180deg, transparent 65%, rgba(15,15,15,0.6) 85%, #0f0f0f 100%)`,
          }}
        />
        <div
          className="absolute inset-0 z-[3] pointer-events-none hidden md:block"
          style={{
            background: `linear-gradient(90deg, #0f0f0f 0%, transparent 15%, transparent 85%, #0f0f0f 100%)`,
          }}
        />

        {/* === CAMADA 4: Conteúdo Hero === */}
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
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                {collections[tag].map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleClick(item)}
                    className="cursor-pointer group"
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
