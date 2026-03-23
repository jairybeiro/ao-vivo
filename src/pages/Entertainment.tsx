import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Film, Clapperboard, Star, PlayCircle, ChevronRight } from "lucide-react";
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

    // Group by category_tag
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

  const tags = Object.keys(collections);

  return (
    <div className="min-h-screen bg-background">
      <MainHeader />

      {/* Hero */}
      {heroItem && heroItem.backdrop_url && (
        <div className="relative w-full aspect-[21/9] max-h-[480px] overflow-hidden">
          <img
            src={heroItem.backdrop_url}
            alt={heroItem.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <div className="absolute bottom-8 left-8 right-8 max-w-xl space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{TAG_EMOJIS[heroItem.category_tag] || "🎬"}</span>
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                {heroItem.category_tag}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground drop-shadow-lg">{heroItem.name}</h1>
            {heroItem.rating && (
              <div className="flex items-center gap-1 text-sm text-foreground/80">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                {heroItem.rating}
              </div>
            )}
            {heroItem.plot && (
              <p className="text-sm text-foreground/70 line-clamp-2">{heroItem.plot}</p>
            )}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => handleClick(heroItem)}
                className="flex items-center gap-2 px-5 py-2.5 bg-foreground text-background rounded-md font-semibold text-sm hover:bg-foreground/90 transition"
              >
                <PlayCircle className="w-5 h-5" />
                Assistir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collections */}
      <main className="container mx-auto px-4 py-6 space-y-8">
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
                    className="flex-shrink-0 w-36 md:w-44 cursor-pointer group"
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
