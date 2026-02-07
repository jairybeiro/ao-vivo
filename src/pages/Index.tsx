import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import CategoryTabs from "@/components/CategoryTabs";
import ChannelCard from "@/components/ChannelCard";
import { SidebarAd, BelowPlayerAd } from "@/components/ads";
import { useChannels } from "@/hooks/useChannels";
import { useActiveAds } from "@/hooks/useAds";
import { useFavorites } from "@/hooks/useFavorites";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tv, Lock, Search, Star, Info } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const CATEGORIES = ["Todos", "Favoritos", "Notícias", "Esportes", "Filmes", "Variedades", "Locais"];

const Index = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { channels, loading } = useChannels();
  const { getSidebarAd, getBelowPlayerAd } = useActiveAds();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const filteredChannels = useMemo(() => {
    let result = channels;

    // Filtro por categoria
    if (selectedCategory === "Favoritos") {
      result = result.filter((ch) => isFavorite(ch.id));
    } else if (selectedCategory !== "Todos") {
      result = result.filter((ch) => ch.category === selectedCategory);
    }

    // Filtro por busca
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((ch) => ch.name.toLowerCase().includes(q));
    }

    return result;
  }, [channels, selectedCategory, searchQuery, isFavorite]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setMenuOpen(false);
  };

  const sidebarAd = getSidebarAd();
  const belowPlayerAd = getBelowPlayerAd();

  const sidebarAdData = sidebarAd ? {
    id: sidebarAd.id, title: sidebarAd.title, description: sidebarAd.description,
    ctaText: sidebarAd.ctaText, ctaUrl: sidebarAd.ctaUrl || undefined, imageUrl: sidebarAd.imageUrl || undefined,
  } : undefined;

  const belowPlayerAdData = belowPlayerAd ? {
    id: belowPlayerAd.id, title: belowPlayerAd.title, description: belowPlayerAd.description,
    ctaText: belowPlayerAd.ctaText, ctaUrl: belowPlayerAd.ctaUrl || undefined, imageUrl: belowPlayerAd.imageUrl || undefined,
  } : undefined;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-3 md:px-4 py-2 md:py-4 flex-shrink-0 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-primary flex items-center justify-center">
              <Tv className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
            </div>
            <div className="hidden lg:block">
              <h1 className="text-base md:text-xl font-bold text-foreground">StreamPlayer</h1>
              <p className="text-xs text-muted-foreground">Hub de canais ao vivo</p>
            </div>
          </div>

          {/* Desktop: Category Tabs */}
          {!isMobile && (
            <div className="flex-1">
              <CategoryTabs
                categories={CATEGORIES}
                selectedCategory={selectedCategory}
                onSelectCategory={handleCategoryChange}
              />
            </div>
          )}

          {isMobile && <div className="flex-1" />}

          <Button variant="outline" size="sm" onClick={() => navigate("/premium")} className="flex-shrink-0 hidden sm:flex">
            <Lock className="w-4 h-4 mr-2" />
            Premium
          </Button>

          {/* Mobile menu */}
          {isMobile && (
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="flex-shrink-0 md:hidden w-10 h-10">
                  <div className="flex flex-col gap-1.5 w-6">
                    <span className="h-0.5 w-full bg-foreground rounded-full" />
                    <span className="h-0.5 w-full bg-foreground rounded-full" />
                    <span className="h-0.5 w-full bg-foreground rounded-full" />
                  </div>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 p-0">
                <div className="p-4 border-b">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                      <Tv className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <h2 className="text-lg font-bold">StreamPlayer</h2>
                  </div>
                </div>
                <div className="p-2">
                  <p className="px-3 py-2 text-xs text-muted-foreground uppercase font-semibold">Categorias</p>
                  {CATEGORIES.map((category) => (
                    <button
                      key={category}
                      onClick={() => handleCategoryChange(category)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-2 ${
                        selectedCategory === category
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      {category === "Favoritos" && <Star className="w-4 h-4" />}
                      {category}
                    </button>
                  ))}
                </div>
                <div className="p-2 border-t mt-auto">
                  <button
                    onClick={() => { setMenuOpen(false); navigate("/premium"); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Lock className="w-4 h-4" />
                    Área Premium
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-3 md:px-4 py-2 flex-shrink-0">
        <div className="relative max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar canal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
      </div>

      {/* UX Notice */}
      <div className="px-3 md:px-4 flex-shrink-0">
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-accent/50 border border-border text-xs text-muted-foreground max-w-2xl">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>Ao tocar em "Assistir", o player abrirá em nova aba. Anúncios podem aparecer — basta fechar e retornar ao vídeo.</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row px-3 md:px-4 pb-3 md:pb-6 gap-3 md:gap-6 overflow-hidden mt-2">
        {/* Channel List */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Carregando canais...</div>
          ) : filteredChannels.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Tv className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{selectedCategory === "Favoritos" ? "Nenhum canal favorito ainda" : "Nenhum canal encontrado"}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredChannels.map((channel) => (
                <ChannelCard
                  key={channel.id}
                  channel={channel}
                  isFavorite={isFavorite(channel.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          )}

          {/* Mobile Ad */}
          <div className="mt-3 lg:hidden">
            <BelowPlayerAd ad={belowPlayerAdData} />
          </div>
        </div>

        {/* Sidebar Ad (Desktop) */}
        <div className="hidden lg:flex lg:flex-none lg:w-80 flex-col gap-3">
          <SidebarAd ad={sidebarAdData} />
        </div>
      </main>
    </div>
  );
};

export default Index;
