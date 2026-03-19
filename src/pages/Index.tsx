import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import VirtualChannelList from "@/components/VirtualChannelList";
import PlayerContainer from "@/components/PlayerContainer";
import { useChannels, DBChannel } from "@/hooks/useChannels";
import { useFavorites } from "@/hooks/useFavorites";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tv, Lock, Search, Star, Film, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const BASE_CATEGORIES = ["Todos", "Favoritos"];
const MOBILE_CATEGORIES = ["Todos"];
const LAST_CHANNEL_KEY = "streamplayer_last_channel";

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

  const { channels, categories: dbCategories, loading } = useChannels(selectedCategory);
  const { toggleFavorite, isFavorite } = useFavorites();

  const CATEGORIES = useMemo(() => {
    return [...BASE_CATEGORIES, ...dbCategories];
  }, [dbCategories]);

  const MOBILE_CATS = useMemo(() => {
    return [...MOBILE_CATEGORIES, ...dbCategories];
  }, [dbCategories]);

  // Mobile: track if user picked a category to show list
  const [mobileShowList, setMobileShowList] = useState(false);

  // Restore last channel once channels load
  useEffect(() => {
    if (selectedChannel || channels.length === 0) return;
    try {
      const saved = localStorage.getItem(LAST_CHANNEL_KEY);
      if (saved) {
        const lastId = JSON.parse(saved) as string;
        const found = channels.find((ch) => ch.id === lastId);
        if (found) {
          setSelectedChannel(found);
          return;
        }
      }
    } catch { /* ignore */ }
    // Fallback: select first channel
    setSelectedChannel(channels[0]);
  }, [channels, selectedChannel]);

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

  const handleMobileCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setMobileShowList(true);
  };

  const handleSelectChannel = useCallback((channel: DBChannel) => {
    setSelectedChannel(channel);
    try {
      localStorage.setItem(LAST_CHANNEL_KEY, JSON.stringify(channel.id));
    } catch { /* ignore */ }
  }, []);

  const emptyState = (
    <div className="flex-1 flex items-center justify-center text-muted-foreground">
      <div className="text-center py-12">
        <Tv className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>{selectedCategory === "Favoritos" ? "Nenhum canal favorito ainda" : "Nenhum canal encontrado"}</p>
      </div>
    </div>
  );

  return (
    <div ref={mainRef} tabIndex={-1} className="h-screen flex flex-col overflow-hidden" style={{ outline: "none" }}>
      {/* Fixed Header */}
      <div className="flex-shrink-0 px-3 md:px-4 py-2 md:py-4 border-b border-border bg-card/50 backdrop-blur-sm z-20" style={{ paddingTop: `calc(env(safe-area-inset-top, 0px) + 8px)` }}>
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
                <div className="p-2 border-t mt-auto space-y-1">
                  <button
                    onClick={() => { setMenuOpen(false); navigate("/vod"); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Film className="w-4 h-4" />
                    Filmes & Séries
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>

      {/* Main Content - fills remaining height */}
      <main className="flex-1 min-h-0 flex flex-col lg:flex-row px-3 md:px-4 pb-3 md:pb-4 gap-3 md:gap-4 mt-2">
        {/* Player Area */}
        <div className="flex-1 min-h-0 flex flex-col gap-3">
          {selectedChannel && (
            <div className="flex-shrink-0">
              <PlayerContainer channel={selectedChannel} />
            </div>
          )}

          {/* Mobile: Search + Channel List below player - scrollable */}
          {isMobile && (
            <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-y-auto">
              {/* Search */}
              <div className="flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar canal..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (e.target.value.trim()) setMobileShowList(true);
                    }}
                    className="pl-9 bg-card border-border"
                  />
                </div>
              </div>
              {/* Category chips */}
              <div className="flex-shrink-0 flex flex-wrap gap-1.5">
                {MOBILE_CATS.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleMobileCategoryChange(cat)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedCategory === cat && mobileShowList
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {cat === "Favoritos" && "⭐ "}{cat}
                  </button>
                ))}
              </div>
              {/* Channel list - only when category selected */}
              {mobileShowList && (
                <div className="flex-1 min-h-0 flex flex-col gap-1">
                  <div className="flex items-center justify-between px-1">
                    <p className="text-xs text-muted-foreground">
                      {selectedCategory} • {filteredChannels.length} canais
                    </p>
                    <button
                      onClick={() => { setMobileShowList(false); setSelectedCategory("Todos"); setSearchQuery(""); }}
                      className="p-1 rounded-full hover:bg-muted"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Carregando canais...</div>
                  ) : filteredChannels.length === 0 ? (
                    emptyState
                  ) : (
                    <VirtualChannelList
                      channels={filteredChannels}
                      selectedChannelId={selectedChannel?.id}
                      isFavorite={isFavorite}
                      onToggleFavorite={toggleFavorite}
                      onSelect={(ch) => { handleSelectChannel(ch); setMobileShowList(false); }}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Desktop: Sidebar with independent scroll */}
        {!isMobile && (
          <div className="hidden lg:flex lg:flex-none lg:w-80 flex-col gap-3 min-h-0">
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
            <div className="flex-shrink-0 flex flex-wrap gap-1.5">
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
            {/* Channel list with independent scroll */}
            <div className="flex-1 min-h-0 overflow-y-auto rounded-lg">
              {loading ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground py-12">
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
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
