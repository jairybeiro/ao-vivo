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
      {/* Header: transparent on desktop, solid dark on mobile */}
      <div className={`fixed top-0 left-0 right-0 z-50 ${isMobile ? "bg-[#0f0f0f]" : ""}`}>
        <MainHeader transparent={!isMobile} />
      </div>

      {/* ===== HERO SECTION ===== */}
      {isMobile ? (
        /* ===== MOBILE: Netflix-style compact player + content below ===== */
        <>
          <section className="relative w-full bg-[#0f0f0f] pt-16">
            {/* Compact player - no text overlay */}
            <div className="relative w-full aspect-video">
              {heroVideoUrl ? (
                <HlsAutoplayVideo
                  src={heroVideoUrl}
                  poster={heroItem?.backdrop_url}
                  delayMs={5000}
                  showControls
                  className="absolute inset-0 w-full h-full object-cover"
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
              {/* Bottom gradient fade to dark */}
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#0f0f0f] to-transparent pointer-events-none" />
            </div>

            {/* Content below player */}
            <div className="px-4 pb-6 pt-2 space-y-3 bg-[#0f0f0f]">
            <h1
              className="text-2xl font-black text-white leading-[1] tracking-tight"
              style={{ fontFamily: "'Helvetica Neue', 'Arial Black', 'Inter', sans-serif" }}
            >
              TRAILERS QUE
              <br />
              <span className="text-[hsl(var(--player-accent))]">INSPIRAM</span>
            </h1>

            {heroItem?.name && (
              <p className="text-base font-semibold text-white/90">
                {heroItem.name}
              </p>
            )}

              <p className="text-sm text-white/70 leading-relaxed line-clamp-2">
                {heroItem?.plot || "A curadoria definitiva para expandir sua visão e mentalidade através do cinema."}
              </p>

              <div className="flex items-center gap-2 text-xs text-white/50">
                <span className="text-green-400 font-bold">98% Relevante</span>
                <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-bold">HD</span>
                <span>Curadoria Exclusiva</span>
              </div>

              <div className="flex items-center gap-3 pt-1">
                {heroItem && (
                  <button
                    onClick={() => handleClick(heroItem)}
                    className="flex-1 flex items-center justify-center gap-2 bg-[hsl(var(--player-accent))] text-white font-bold py-3 rounded-md text-sm shadow-lg active:scale-[0.97] transition-transform"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    ASSISTIR
                  </button>
                )}
                <button
                  onClick={scrollToContent}
                  className="flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white font-semibold px-5 py-3 rounded-md text-sm active:scale-[0.97] transition-transform"
                >
                  <Film className="w-4 h-4" />
                  Explorar
                </button>
              </div>
            </div>
          </section>
        </>
      ) : (
        /* ===== DESKTOP: Compact player + content below (matching mobile) ===== */
        <section className="w-full bg-[#0f0f0f] pt-16">
          {/* Ambilight container - full width */}
          <div className="relative w-full flex items-center justify-center" style={{ minHeight: "60vh" }}>
            {/* Ambilight layer: duplicated video blurred behind the player */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
              {heroVideoUrl ? (
                <HlsAutoplayVideo
                  src={heroVideoUrl}
                  poster={heroItem?.backdrop_url}
                  delayMs={5000}
                  className="w-full h-full object-cover scale-110 blur-3xl opacity-50"
                />
              ) : heroItem?.backdrop_url ? (
                <img src={heroItem.backdrop_url} alt="" className="w-full h-full object-cover scale-110 blur-3xl opacity-50" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[hsl(var(--secondary))] to-[#0f0f0f]" />
              )}
              {/* Fade edges into background */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-[#0f0f0f] opacity-70" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f0f] via-transparent to-[#0f0f0f] opacity-50" />
            </div>

            {/* Main player - constrained, centered, above ambilight */}
            <div className="relative w-full max-w-5xl mx-auto aspect-video z-10">
              {heroVideoUrl ? (
                <HlsAutoplayVideo
                  src={heroVideoUrl}
                  poster={heroItem?.backdrop_url}
                  delayMs={5000}
                  showControls
                  className="absolute inset-0 w-full h-full object-cover rounded-xl"
                />
              ) : heroItem?.backdrop_url ? (
                <img src={heroItem.backdrop_url} alt="" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--secondary))] to-[#0f0f0f] rounded-xl" />
              )}
              {/* Bottom gradient fade */}
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#0f0f0f] to-transparent pointer-events-none rounded-b-xl" />
            </div>
          </div>

          {/* Content below player */}
          <div className="max-w-5xl mx-auto px-6 pb-8 pt-4 space-y-3">
            <h1 className="text-4xl lg:text-5xl font-black text-white leading-[1] tracking-tight" style={{ fontFamily: "'Helvetica Neue', 'Arial Black', 'Inter', sans-serif" }}>
              TRAILERS QUE<br />
              <span className="text-[hsl(var(--player-accent))]">INSPIRAM</span>
            </h1>
            {heroItem?.name && (
              <p className="text-xl font-semibold text-white/90">{heroItem.name}</p>
            )}
            <p className="text-base text-white/70 max-w-lg leading-relaxed line-clamp-3">
              {heroItem?.plot || "A curadoria definitiva para expandir sua visão e mentalidade através do cinema."}
            </p>
            <div className="flex items-center gap-3 text-xs text-white/60">
              <span className="text-green-400 font-bold text-sm">98% Relevante</span>
              <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-bold">HD</span>
              <span>Curadoria Exclusiva</span>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button onClick={scrollToContent} className="flex items-center gap-2.5 bg-[hsl(var(--player-accent))] text-white font-bold px-8 py-3.5 rounded-md hover:brightness-110 transition-all text-base shadow-xl">
                <Play className="w-5 h-5 fill-white" />
                COMEÇAR AGORA
              </button>
              <button onClick={scrollToContent} className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white font-semibold px-7 py-3.5 rounded-md hover:bg-white/30 transition-colors text-base">
                <Film className="w-5 h-5" />
                Explorar
              </button>
            </div>
          </div>
        </section>
      )}

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
