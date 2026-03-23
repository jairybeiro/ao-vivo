import { useState, useEffect, useCallback } from "react";
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

  const handleClick = (item: CuratedItem) => {
    navigate(`/entretenimento/${item.type}/${item.id}`);
  };

  const scrollToContent = () => {
    document.getElementById("collections")?.scrollIntoView({ behavior: "smooth" });
  };

  const tags = Object.keys(collections);

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed header over hero */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <MainHeader />
      </div>

      {/* ===== FULL-SCREEN HERO ===== */}
      <section className="relative w-screen h-screen overflow-hidden">
        {/* Background image */}
        {heroItem?.backdrop_url ? (
          <img
            src={heroItem.backdrop_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--secondary))] to-[hsl(var(--background))]" />
        )}

        {/* Netflix-style scrim gradient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 25%, transparent 70%, rgba(0,0,0,0.85) 100%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent" />

        {/* Hero content — bottom-left anchored */}
        <div className="absolute inset-0 flex flex-col justify-end px-6 pb-16 md:px-14 md:pb-20 z-10">
          <div className="max-w-2xl space-y-4">
            {/* Title */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[0.95] tracking-tight drop-shadow-2xl">
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
                className="flex items-center gap-2.5 bg-white text-black font-bold px-6 py-3 md:px-8 md:py-3.5 rounded-md hover:bg-white/90 transition-colors text-sm md:text-base shadow-xl"
              >
                <Play className="w-5 h-5 fill-black" />
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

        {/* Bottom fade into content */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent z-10" />
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
