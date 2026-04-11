import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Film, ChevronRight, Play, Briefcase, Tv, Star, Search, X, ChevronDown } from "lucide-react";
import MainHeader from "@/components/MainHeader";
import CineBusinessCardPopover from "@/components/CineBusinessCardPopover";
import CineBusinessCard from "@/components/CineBusinessCard";
import { useIsMobile } from "@/hooks/use-mobile";
import FullscreenTrailerPlayer from "@/components/FullscreenTrailerPlayer";
import HlsAutoplayVideo from "@/components/HlsAutoplayVideo";
import { extractYouTubeId, isDirectVideoUrl } from "@/lib/videoSource";

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

interface SeriesItem {
  id: string;
  name: string;
  category: string;
  cover_url: string | null;
  backdrop_url: string | null;
  rating: number | null;
  plot: string | null;
}

const Entertainment = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<"filmes" | "series">("filmes");
  const [cineBusinessItems, setCineBusinessItems] = useState<CineBusinessItem[]>([]);
  const [cineBusinessByCategory, setCineBusinessByCategory] = useState<Record<string, CineBusinessItem[]>>({});
  const [seriesItems, setSeriesItems] = useState<SeriesItem[]>([]);
  const [seriesByCategory, setSeriesByCategory] = useState<Record<string, SeriesItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [heroItem, setHeroItem] = useState<CineBusinessItem | null>(null);
  const [isTrailerPlayerOpen, setIsTrailerPlayerOpen] = useState(false);
  const [selectedTrailerUrl, setSelectedTrailerUrl] = useState<string | null>(null);
  const [seriesSearch, setSeriesSearch] = useState("");
  const [seriesCategory, setSeriesCategory] = useState<string | null>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
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

  const fetchSeriesContent = useCallback(async () => {
    const { data } = await supabase
      .from("vod_series")
      .select("id, name, category, cover_url, backdrop_url, rating, plot")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    const items = (data || []) as SeriesItem[];
    setSeriesItems(items);
    const grouped: Record<string, SeriesItem[]> = {};
    items.forEach((item) => {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    });
    setSeriesByCategory(grouped);
  }, []);

  useEffect(() => {
    fetchCineBusinessContent();
    fetchSeriesContent();
  }, [fetchCineBusinessContent, fetchSeriesContent]);

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
  const seriesCategories = useMemo(() => Object.keys(seriesByCategory).sort(), [seriesByCategory]);

  const filteredSeriesByCategory = useMemo(() => {
    const searchLower = seriesSearch.toLowerCase();
    const result: Record<string, SeriesItem[]> = {};
    const cats = seriesCategory ? [seriesCategory] : Object.keys(seriesByCategory);
    cats.forEach((cat) => {
      const items = seriesByCategory[cat];
      if (!items) return;
      const filtered = searchLower ? items.filter((i) => i.name.toLowerCase().includes(searchLower)) : items;
      if (filtered.length > 0) result[cat] = filtered;
    });
    return result;
  }, [seriesByCategory, seriesSearch, seriesCategory]);

  // Prioridade: trailer_mp4_url (MP4/M3U8) > trailer_url (YouTube)
  const heroVideoUrl = heroItem?.trailer_mp4_url || heroItem?.trailer_url || null;

  const heroYoutubeId = extractYouTubeId(heroVideoUrl);
  const heroIsDirectVideo = isDirectVideoUrl(heroVideoUrl);

  return (
    <div className="min-h-screen bg-background">
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

      {/* ===== TABS + COLLECTIONS ===== */}
      <main id="collections" className="container mx-auto px-4 py-8 space-y-6 -mt-8 relative z-20">
        {/* Tab switcher + filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("filmes")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition ${
                activeTab === "filmes" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Briefcase className="w-4 h-4" />
              Filmes
            </button>
            <button
              onClick={() => setActiveTab("series")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition ${
                activeTab === "series" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Tv className="w-4 h-4" />
              Séries
            </button>
          </div>

          {/* Search + Category (visible only on Séries tab) */}
          {activeTab === "series" && (
            <div className="flex items-center gap-2 flex-1 justify-end">
              {/* Search */}
              <div className="relative max-w-[220px] w-full">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar série..."
                  value={seriesSearch}
                  onChange={(e) => setSeriesSearch(e.target.value)}
                  className="w-full pl-8 pr-8 py-2 rounded-lg bg-muted/60 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {seriesSearch && (
                  <button onClick={() => setSeriesSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Category dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted/60 border border-border text-sm font-medium text-foreground hover:bg-muted transition whitespace-nowrap"
                >
                  {seriesCategory || "Categorias"}
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showCategoryDropdown && (
                  <div className="absolute right-0 top-full mt-1 bg-popover border border-border rounded-lg shadow-xl z-40 min-w-[180px] max-h-[300px] overflow-y-auto">
                    <button
                      onClick={() => { setSeriesCategory(null); setShowCategoryDropdown(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition ${!seriesCategory ? "text-primary font-bold" : "text-foreground"}`}
                    >
                      Todas
                    </button>
                    {seriesCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => { setSeriesCategory(cat); setShowCategoryDropdown(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition ${cat === seriesCategory ? "text-primary font-bold" : "text-foreground"}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-16">Carregando conteúdos...</div>
        ) : activeTab === "filmes" ? (
          /* FILMES TAB */
          cineBusinessItems.length === 0 ? (
            <div className="text-center text-muted-foreground py-16">
              <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum conteúdo disponível.</p>
            </div>
          ) : (
            <div className="space-y-10">
              {categories.map((category) => (
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
              ))}
            </div>
          )
        ) : (
          /* SÉRIES TAB */
          seriesItems.length === 0 ? (
            <div className="text-center text-muted-foreground py-16">
              <Tv className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma série disponível.</p>
            </div>
          ) : Object.keys(filteredSeriesByCategory).length === 0 ? (
            <div className="text-center text-muted-foreground py-16">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum resultado encontrado.</p>
            </div>
          ) : (
            <div className="space-y-10">
              {Object.keys(filteredSeriesByCategory).map((category) => (
                <section key={category} className="space-y-3">
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <span className="text-xl">📺</span>
                    {category}
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {filteredSeriesByCategory[category].map((item) => (
                      <div
                        key={item.id}
                        onClick={() => navigate(`/series/${item.id}`)}
                        className="cursor-pointer group"
                      >
                        <div className="aspect-[2/3] bg-muted rounded-lg overflow-hidden relative shadow-lg group-hover:scale-105 group-hover:shadow-2xl transition-all duration-300">
                          {item.cover_url ? (
                            <img src={item.cover_url} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                              <Tv className="w-8 h-8 text-primary" />
                            </div>
                          )}
                          {item.rating && item.rating > 0 && (
                            <div className="absolute top-1.5 right-1.5 bg-background/80 text-xs px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                              {Number(item.rating).toFixed(1)}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                            <Play className="w-10 h-10 text-white opacity-0 group-hover:opacity-90 transition-opacity fill-white" />
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-xs font-medium truncate text-foreground">{item.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{item.category}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )
        )}
      </main>
    </div>
  );
};

export default Entertainment;
