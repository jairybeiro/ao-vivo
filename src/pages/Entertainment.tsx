import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Film, ChevronRight, Play, Briefcase } from "lucide-react";
import MainHeader from "@/components/MainHeader";
import CineBusinessCardPopover from "@/components/CineBusinessCardPopover";
import CineBusinessCard from "@/components/CineBusinessCard";
import { useIsMobile } from "@/hooks/use-mobile";
import FullscreenTrailerPlayer from "@/components/FullscreenTrailerPlayer";
import HlsAutoplayVideo from "@/components/HlsAutoplayVideo";

interface CineBusinessItem {
  id: string;
  name: string;
  category: string;
  cover_url: string | null;
  backdrop_url: string | null;
  rating: number | null;
  trailer_url: string | null;
  trailer_mp4_url: string | null;
  sinopse: string | null;
}

const Entertainment = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [cineBusinessItems, setCineBusinessItems] = useState<CineBusinessItem[]>([]);
  const [cineBusinessByCategory, setCineBusinessByCategory] = useState<Record<string, CineBusinessItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [heroItem, setHeroItem] = useState<CineBusinessItem | null>(null);
  const [isTrailerPlayerOpen, setIsTrailerPlayerOpen] = useState(false);
  const [selectedTrailerUrl, setSelectedTrailerUrl] = useState<string | null>(null);

  const fetchCineBusinessContent = useCallback(async () => {
    setLoading(true);

    try {
      // Fetch ONLY CineBusiness content
      const { data: cineBizData, error } = await supabase
        .from("vod_movies")
        .select("id, name, category, cover_url, backdrop_url, rating, sinopse, trailer_url, trailer_mp4_url")
        .in("category", ["Negócios", "Empreendedorismo", "Mentalidade", "Liderança", "Finanças", "Marketing", "Produtividade", "Tecnologia", "Desenvolvimento Pessoal", "Startups"])
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching CineBusiness:", error);
        setCineBusinessItems([]);
        setCineBusinessByCategory({});
      } else {
        const items = (cineBizData || []) as CineBusinessItem[];
        setCineBusinessItems(items);

        // Group by category
        const grouped: Record<string, CineBusinessItem[]> = {};
        items.forEach((item) => {
          if (!item.category) return;
          if (!grouped[item.category]) grouped[item.category] = [];
          grouped[item.category].push(item);
        });
        setCineBusinessByCategory(grouped);

        // Pick hero: prefer items with trailer_mp4_url or trailer_url
        const withTrailer = items.filter((i) => i.trailer_mp4_url || i.trailer_url);
        const candidates = withTrailer.length > 0 ? withTrailer : items;
        if (candidates.length > 0) {
          setHeroItem(candidates[Math.floor(Math.random() * candidates.length)]);
        }
      }
    } catch (err) {
      console.error("Error:", err);
      setCineBusinessItems([]);
      setCineBusinessByCategory({});
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCineBusinessContent();
  }, [fetchCineBusinessContent]);

  const handleCineBusinessClick = (item: CineBusinessItem) => {
    navigate(`/cinebusiness/${item.id}`);
  };

  const scrollToContent = () => {
    document.getElementById("collections")?.scrollIntoView({ behavior: "smooth" });
  };

  const handlePlayTrailer = (trailerUrl: string | null) => {
    if (trailerUrl) {
      setSelectedTrailerUrl(trailerUrl);
      setIsTrailerPlayerOpen(true);
    }
  };

  const categories = Object.keys(cineBusinessByCategory);
  // Prioridade: trailer_mp4_url (MP4/M3U8) > trailer_url (YouTube)
  const heroVideoUrl = heroItem?.trailer_mp4_url || heroItem?.trailer_url || null;

  // Detect video type for hero
  const extractYouTubeId = (url: string): string | null => {
    const match = url.match(/(?:v=|\/embed\/|youtu\.be\/)([^&?#]+)/);
    return match ? match[1] : null;
  };
  const heroYoutubeId = heroVideoUrl ? extractYouTubeId(heroVideoUrl) : null;
  const heroIsDirectVideo = heroVideoUrl && !heroYoutubeId && /\.(mp4|m3u8|m3u)/i.test(heroVideoUrl);

  return (
    <div className="min-h-screen bg-background overflow-y-auto" style={{ height: "100vh" }}>
      {/* Header */}
      <div className={`fixed top-0 left-0 right-0 z-50 ${isMobile ? "bg-[#0f0f0f]" : ""}`}>
        <MainHeader transparent={!isMobile} />
      </div>

      {/* ===== HERO SECTION ===== */}
      <section className={`relative w-full ${isMobile ? 'bg-[#0f0f0f] pt-14' : 'bg-[#0f0f0f] pt-16'}`}>
        {/* Ambilight layer - desktop only */}
        {!isMobile && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {heroItem?.backdrop_url ? (
              <img src={heroItem.backdrop_url} alt="" className="w-full h-full object-cover scale-110 blur-3xl opacity-50" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[hsl(var(--secondary))] to-[#0f0f0f]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-[#0f0f0f] opacity-70" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f0f] via-transparent to-[#0f0f0f] opacity-50" />
          </div>
        )}

        {/* Player container */}
        <div className={`relative z-10 ${isMobile ? '' : 'flex items-center justify-center'}`} style={isMobile ? {} : { minHeight: "70vh" }}>
          <div className={`relative w-full ${isMobile ? 'aspect-video' : 'max-w-5xl mx-auto aspect-video overflow-hidden rounded-xl border border-white/10'}`}>
            {/* Video/Image */}
            {heroIsDirectVideo ? (
              <HlsAutoplayVideo
                src={heroVideoUrl!}
                poster={heroItem?.backdrop_url}
                delayMs={3000}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : heroYoutubeId ? (
              <iframe
                src={`https://www.youtube.com/embed/${heroYoutubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${heroYoutubeId}&modestbranding=1&showinfo=0&rel=0&iv_load_policy=3`}
                className="absolute inset-0 w-full h-full object-cover scale-110"
                allow="autoplay; encrypted-media"
                frameBorder="0"
                style={{ pointerEvents: "none" }}
                title={heroItem?.name || ""}
              />
            ) : heroItem?.backdrop_url ? (
              <img src={heroItem.backdrop_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--secondary))] to-[#0f0f0f]" />
            )}

            {/* Netflix-style gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent pointer-events-none" />

            {/* Overlay Content */}
            <div className={`absolute bottom-0 left-0 right-0 z-20 ${isMobile ? 'p-4 pb-5' : 'p-8 pb-10'}`}>
              <h1
                className={`font-black text-white leading-[1.05] tracking-tight ${isMobile ? 'text-xl' : 'text-3xl lg:text-4xl'}`}
                style={{ fontFamily: "'Helvetica Neue', 'Arial Black', 'Inter', sans-serif" }}
              >
                CONTEÚDOS QUE{" "}
                <span className="text-[hsl(var(--player-accent))]">INSPIRAM</span>
              </h1>

              {heroItem?.name && (
                <p className={`font-semibold text-white/90 mt-1.5 ${isMobile ? 'text-sm' : 'text-lg'}`}>
                  {heroItem.name}
                </p>
              )}

              <p className={`text-white/70 leading-relaxed mt-1 ${isMobile ? 'text-xs line-clamp-2' : 'text-sm max-w-lg line-clamp-3'}`}>
                {heroItem?.sinopse || "Conteúdos de negócios, empreendedorismo e desenvolvimento pessoal."}
              </p>

              <div className={`flex items-center gap-2 text-white/50 mt-1.5 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
                <span className="text-green-400 font-bold">Premium</span>
                <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-bold">HD</span>
                <span>Curadoria Exclusiva</span>
              </div>

              <div className={`flex items-center gap-2.5 ${isMobile ? 'mt-3' : 'mt-4'}`}>
                {heroItem && (
                  <button
                    onClick={() => handlePlayTrailer(heroVideoUrl)}
                    className={`flex items-center justify-center gap-2 bg-[hsl(var(--player-accent))] text-white font-bold rounded-md shadow-lg active:scale-[0.97] transition-transform ${isMobile ? 'flex-1 py-2.5 text-xs' : 'px-7 py-3 text-sm hover:brightness-110'}`}
                  >
                    <Play className={`fill-white ${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
                    COMEÇAR AGORA
                  </button>
                )}
                <button
                  onClick={scrollToContent}
                  className={`flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-md active:scale-[0.97] transition-all ${isMobile ? 'px-4 py-2.5 text-xs' : 'px-6 py-3 text-sm hover:bg-white/30'}`}
                >
                  <Film className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
                  Explorar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom fade into collections */}
        {!isMobile && <div className="h-16 bg-gradient-to-b from-transparent to-[#0f0f0f] relative z-10" />}
      </section>


      {/* Fullscreen Trailer Player */}
      <FullscreenTrailerPlayer
        isOpen={isTrailerPlayerOpen}
        onClose={() => setIsTrailerPlayerOpen(false)}
        trailerUrl={selectedTrailerUrl}
        title={heroItem?.name || "Trailer"}
      />

      {/* ===== CINEBUSINESS COLLECTIONS ===== */}
      <main id="collections" className="container mx-auto px-4 py-8 space-y-10 -mt-8 relative z-20">
        {loading ? (
          <div className="text-center text-muted-foreground py-16">Carregando conteúdos...</div>
        ) : cineBusinessItems.length === 0 ? (
          <div className="text-center text-muted-foreground py-16">
            <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum conteúdo disponível.</p>
            <p className="text-xs mt-1">Adicione conteúdos no painel Admin → CineBusiness.</p>
          </div>
        ) : (
          categories.map((category) => (
            <section key={category} className="space-y-3">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <span className="text-xl">💼</span>
                {category}
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {cineBusinessByCategory[category].map((item) => (
                  isMobile ? (
                    <CineBusinessCard
                      key={item.id}
                      id={item.id}
                      name={item.name}
                      category={item.category}
                      cover_url={item.cover_url}
                      backdrop_url={item.backdrop_url}
                      rating={item.rating}
                      trailer_url={item.trailer_mp4_url || item.trailer_url}
                      onClick={() => handleCineBusinessClick(item)}
                    />
                  ) : (
                    <CineBusinessCardPopover
                      key={item.id}
                      id={item.id}
                      name={item.name}
                      category={item.category}
                      cover_url={item.cover_url}
                      backdrop_url={item.backdrop_url}
                      rating={item.rating}
                      trailer_url={item.trailer_mp4_url || item.trailer_url}
                      sinopse={item.sinopse}
                      onClick={() => handleCineBusinessClick(item)}
                      onPlayTrailer={handlePlayTrailer}
                    />
                  )
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
