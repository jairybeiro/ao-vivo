import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CategoryTabs from "@/components/CategoryTabs";
import VirtualChannelList from "@/components/VirtualChannelList";
import PlayerContainer from "@/components/PlayerContainer";
import { useChannels, DBChannel } from "@/hooks/useChannels";
import { useFavorites } from "@/hooks/useFavorites";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tv, Lock, Search, Star, Film } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const BASE_CATEGORIES = ["Todos", "Favoritos"];

const Index = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mainRef.current?.focus();
  }, []);
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<DBChannel | null>(null);

  // Server-side category filtering
  const { channels, categories: dbCategories, loading } = useChannels(selectedCategory);
  const { toggleFavorite, isFavorite } = useFavorites();

  const CATEGORIES = useMemo(() => {
    return [...BASE_CATEGORIES, ...dbCategories];
  }, [dbCategories]);

  const filteredChannels = useMemo(() => {
    let result = channels;

    if (selectedCategory === "Favoritos") {
      result = result.filter((ch) => isFavorite(ch.id));
    }

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

  const handleSelectChannel = (channel: DBChannel) => {
    setSelectedChannel(channel);
  };

  const emptyState = (
    <div className="flex-1 flex items-center justify-center text-muted-foreground">
      <div className="text-center py-12">
        <Tv className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>{selectedCategory === "Favoritos" ? "Nenhum canal favorito ainda" : "Nenhum canal encontrado"}</p>
      </div>
    </div>
  );

  return (
    <div ref={mainRef} tabIndex={-1} className="min-h-screen bg-background flex flex-col" style={{ outline: "none" }}>
      {/* Header */}
      <div className="px-3 md:px-4 py-2 md:py-4 flex-shrink-0 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-primary flex items-center justify-center">
              <Tv className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
            </div>
            <div className="hidden lg:block">
              <h1 className="text-base md:text-xl font-bold text-foreground">StreamPlayer</h1>
              <p className="text-xs text-muted-foreground">TV ao vivo</p>
            </div>
          </div>

          <div className="flex-1" />

          <Button variant="outline" size="sm" onClick={() => navigate("/vod")} className="flex-shrink-0 hidden sm:flex">
            <Film className="w-4 h-4 mr-2" />
            Filmes
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/premium")} className="flex-shrink-0 hidden sm:flex">
            <Lock className="w-4 h-4 mr-2" />
            Premium
          </Button>

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
                <div className="p-2 overflow-y-auto max-h-[60vh]">
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
                <div className="p-2 border-t mt-auto space-y-1">
                  <button
                    onClick={() => { setMenuOpen(false); navigate("/vod"); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Film className="w-4 h-4" />
                    Filmes & Séries
                  </button>
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row px-3 md:px-4 pb-3 md:pb-6 gap-3 md:gap-6 mt-2">
        {/* Player Area */}
        <div className="flex-1 min-h-0 flex flex-col gap-3">
          {selectedChannel && (
            <div className="flex-shrink-0 lg:sticky lg:top-2 lg:z-10">
              <PlayerContainer channel={selectedChannel} />
            </div>
          )}

          {/* Mobile: Search + Virtual Channel List below player */}
          {isMobile && (
            <>
              <div className="flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar canal..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-card border-border"
                  />
                </div>
              </div>
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Carregando canais...</div>
              ) : filteredChannels.length === 0 ? (
                emptyState
              ) : (
                <VirtualChannelList
                  channels={filteredChannels}
                  selectedChannelId={selectedChannel?.id}
                  isFavorite={isFavorite}
                  onToggleFavorite={toggleFavorite}
                  onSelect={handleSelectChannel}
                />
              )}
            </>
          )}
        </div>

        {/* Desktop: Virtual Channel List Sidebar */}
        {!isMobile && (
          <div className="hidden lg:flex lg:flex-none lg:w-80 flex-col gap-3">
            <div className="flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar canal..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-card border-border"
                />
              </div>
            </div>
            {/* Category filter chips */}
            <div className="flex-shrink-0 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {cat === "Favoritos" && "⭐ "}{cat}
                </button>
              ))}
            </div>
            {loading ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Carregando canais...
              </div>
            ) : filteredChannels.length === 0 ? (
              emptyState
            ) : (
              <VirtualChannelList
                channels={filteredChannels}
                selectedChannelId={selectedChannel?.id}
                isFavorite={isFavorite}
                onToggleFavorite={toggleFavorite}
                onSelect={handleSelectChannel}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
