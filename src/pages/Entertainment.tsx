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
  const [bgVideoUrl, setBgVideoUrl] = useState<string | null>(null);

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

      {/* ===== FULL-SCREEN HERO ===== */}
      <section className="relative w-screen h-screen flex items-center justify-center overflow-hidden">
        {/* Dark page background behind concave container */}
        <div className="absolute inset-0 bg-[hsl(var(--background))]" />

        {/* === BLURRED GLOW VIDEO BEHIND PLAYER === */}
        {glowVideoId && (
          <div className="absolute inset-0 z-[0] overflow-hidden">
            <iframe
              src={`https://www.youtube.com/embed/${glowVideoId}?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&playlist=${glowVideoId}`}
              className="absolute w-[120%] h-[120%] top-1/2 left-1/2 pointer-events-none"
              style={{
                border: 0,
                transform: "translate(-50%, -50%) scale(1.3)",
                filter: "blur(40px) brightness(0.6) saturate(1.5)",
                opacity: 0.7,
              }}
              allow="autoplay; encrypted-media"
              title="Background glow"
            />
            {/* Dark overlay to tame the glow */}
            <div className="absolute inset-0 bg-[hsl(var(--background))]/50" />
          </div>
        )}

        {/* Concave container — TV-screen shape */}
        <div
          className="relative w-[90vw] h-[82vh] overflow-hidden"
          style={{
            borderRadius: "20px 20px 50% 50% / 20px 20px 6% 6%",
            boxShadow:
              "0 0 80px 20px rgba(0,0,0,0.5), 0 0 160px 60px rgba(0,0,0,0.3)",
          }}
        >
          {/* Background — video or fallback image */}
          {heroVideoId ? (
            <iframe
              src={`https://www.youtube.com/embed/${heroVideoId}?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&playlist=${heroVideoId}`}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              style={{ border: 0, transform: "scale(1.2)", transformOrigin: "center center" }}
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
            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--secondary))] to-[hsl(var(--background))]" />
          )}

          {/* Scrim — transparent "hedge" for text visibility */}
          <div
            className="absolute inset-0 z-[1]"
            style={{
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.7) 100%)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent z-[1]" />

          {/* Hero content — bottom-left anchored */}
          <div className="absolute inset-0 flex flex-col justify-end px-6 pb-12 md:px-14 md:pb-16 z-[2]">
            <div className="max-w-2xl space-y-4">
              {/* Title — elegant serif-style */}
              <h1
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[0.95] tracking-tight drop-shadow-2xl"
                style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
              >
                TRAILERS QUE
                <br />
                <span className="text-[hsl(var(--player-accent))]">INSPIRAM</span>
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base md:text-lg text-white/80 max-w-lg leading-relaxed drop-shadow-lg">
                A curadoria definitiva para expandir sua visão e mentalidade através do cinema.
              </p>

              {/* Metadata badges */}
              <div className="flex items-center gap-3 text-xs text-white/60">
                <span className="text-green-400 font-bold text-sm">98% Relevante</span>
                <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-bold">HD</span>
                <span>Curadoria Exclusiva</span>
              </div>

              {/* CTA buttons */}
              <div className="flex items-center gap-3 pt-2">
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
        </div>

        {/* Bottom fade into collections */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[hsl(var(--background))] to-transparent z-10" />
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
