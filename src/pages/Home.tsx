import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import MainHeader from "@/components/MainHeader";
import { HeroSection } from "@/components/cinebusiness/HeroSection";
import { ContentRow } from "@/components/cinebusiness/ContentRow";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface VodMovie {
  id: string;
  name: string;
  category: string;
  cover_url: string | null;
  backdrop_url: string | null;
  trailer_url: string | null;
  rating: number | null;
  sinopse?: string | null;
}

const Home = () => {
  const [movies, setMovies] = useState<VodMovie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovies = async () => {
      const { data, error } = await supabase
        .from("vod_movies")
        .select("id, name, category, cover_url, backdrop_url, trailer_url, rating, sinopse")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(200);

      if (!error && data) setMovies(data as VodMovie[]);
      setLoading(false);
    };
    fetchMovies();
  }, []);

  // Hero items: movies with backdrop and trailer (top rated)
  const heroItems = useMemo(() => {
    return movies
      .filter((m) => m.backdrop_url && m.trailer_url)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 5);
  }, [movies]);

  // Group by category
  const categorized = useMemo(() => {
    const map = new Map<string, VodMovie[]>();
    movies.forEach((m) => {
      const cat = m.category || "Geral";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(m);
    });
    return Array.from(map.entries());
  }, [movies]);

  // Top rated row
  const topRated = useMemo(() => {
    return [...movies]
      .filter((m) => m.rating && m.rating >= 7)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 12);
  }, [movies]);

  // Recent additions
  const recent = useMemo(() => movies.slice(0, 12), [movies]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MainHeader transparent />

      {/* Hero */}
      {heroItems.length > 0 && <HeroSection items={heroItems} />}

      {/* Content Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="relative z-10 px-4 md:px-8 lg:px-12 pb-16 space-y-10"
        style={{ marginTop: heroItems.length > 0 ? "-6rem" : "2rem" }}
      >
        {/* Recently added */}
        {recent.length > 0 && (
          <ContentRow title="Adicionados Recentemente" items={recent} />
        )}

        {/* Top Rated */}
        {topRated.length > 0 && (
          <ContentRow title="Mais Bem Avaliados" items={topRated} />
        )}

        {/* By Category */}
        {categorized.map(([cat, items]) => (
          <ContentRow key={cat} title={cat} items={items} />
        ))}

        {/* Empty state */}
        {movies.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Nenhum conteúdo encontrado</h2>
            <p className="text-muted-foreground">
              Adicione conteúdos no painel administrativo para começar.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Home;
