import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import EmbedPlayer from "@/components/EmbedPlayer";
import VideoPlayer from "@/components/VideoPlayer";
import ChannelList from "@/components/ChannelList";
import CategoryTabs from "@/components/CategoryTabs";
import { SidebarAd, BelowPlayerAd } from "@/components/ads";
import { useChannels, type DBChannel } from "@/hooks/useChannels";
import { useActiveAds } from "@/hooks/useAds";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tv, Lock } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

// Helper para verificar se tem URLs de stream válidas (não placeholder)
const hasValidStreamUrls = (urls: string[]) => {
  return urls.some(url => url.trim() !== "" && url !== "placeholder" && url.endsWith(".m3u8"));
};

const CATEGORIES = ["Todos", "Notícias", "Esportes", "Filmes", "Variedades", "Locais"];

const Index = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { channels, loading } = useChannels();
  const { getSidebarAd, getBelowPlayerAd, getPrerollAd } = useActiveAds();
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedChannel, setSelectedChannel] = useState<DBChannel | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const filteredChannels = useMemo(() => {
    if (selectedCategory === "Todos") {
      return channels;
    }
    return channels.filter((ch) => ch.category === selectedCategory);
  }, [channels, selectedCategory]);

  // Auto-select first channel when category changes or channels load
  useMemo(() => {
    if (filteredChannels.length > 0 && !selectedChannel) {
      setSelectedChannel(filteredChannels[0]);
    }
  }, [filteredChannels]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setMenuOpen(false);
    const newFiltered = category === "Todos" 
      ? channels 
      : channels.filter((ch) => ch.category === category);
    if (newFiltered.length > 0) {
      setSelectedChannel(newFiltered[0]);
    } else {
      setSelectedChannel(null);
    }
  };

  // Preparar dados dos anúncios para os componentes
  const sidebarAd = getSidebarAd();
  const belowPlayerAd = getBelowPlayerAd();
  const prerollAd = getPrerollAd();

  const sidebarAdData = sidebarAd ? {
    id: sidebarAd.id,
    title: sidebarAd.title,
    description: sidebarAd.description,
    ctaText: sidebarAd.ctaText,
    ctaUrl: sidebarAd.ctaUrl || undefined,
    imageUrl: sidebarAd.imageUrl || undefined,
  } : undefined;

  const belowPlayerAdData = belowPlayerAd ? {
    id: belowPlayerAd.id,
    title: belowPlayerAd.title,
    description: belowPlayerAd.description,
    ctaText: belowPlayerAd.ctaText,
    ctaUrl: belowPlayerAd.ctaUrl || undefined,
    imageUrl: belowPlayerAd.imageUrl || undefined,
  } : undefined;

  const prerollAdData = prerollAd ? {
    id: prerollAd.id,
    title: prerollAd.title,
    description: prerollAd.description,
    ctaText: prerollAd.ctaText,
    ctaUrl: prerollAd.ctaUrl || undefined,
    imageUrl: prerollAd.imageUrl || undefined,
    duration: prerollAd.duration,
  } : undefined;


  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header with Logo + Categories - Fixed */}
      <div className="px-3 md:px-4 py-2 md:py-4 flex-shrink-0 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          {/* Logo and Title - always left */}
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-primary flex items-center justify-center">
              <Tv className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
            </div>
            <div className="hidden lg:block">
              <h1 className="text-base md:text-xl font-bold text-foreground">StreamPlayer</h1>
              <p className="text-xs text-muted-foreground">Transmissões ao vivo</p>
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

          {/* Spacer for mobile */}
          {isMobile && <div className="flex-1" />}

          {/* Premium Button - Desktop only */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/premium")}
            className="flex-shrink-0 hidden sm:flex"
          >
            <Lock className="w-4 h-4 mr-2" />
            Premium
          </Button>

          {/* Mobile hamburger menu - right side */}
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
                      className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                        selectedCategory === category 
                          ? "bg-primary text-primary-foreground" 
                          : "hover:bg-muted"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
                <div className="p-2 border-t mt-auto">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/premium");
                    }}
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

      {/* Main Content - Flex layout */}
      <main className="flex-1 flex flex-col lg:flex-row px-3 md:px-4 pb-3 md:pb-6 gap-3 md:gap-6 overflow-hidden">
        {/* Player Section */}
        <div className="flex-shrink-0 lg:flex-1">
          {selectedChannel?.embedUrl ? (
            // Prioridade 1: Usar EmbedPlayer se tem embed_url
            <EmbedPlayer
              embedUrl={selectedChannel.embedUrl}
              channelName={selectedChannel.name}
              preRollAd={prerollAdData}
              enablePreRoll={!!prerollAd}
            />
          ) : selectedChannel && hasValidStreamUrls(selectedChannel.streamUrls) ? (
            // Prioridade 2: Usar VideoPlayer se tem URLs m3u8 válidas
            <VideoPlayer
              streamUrls={selectedChannel.streamUrls.filter(url => url.endsWith(".m3u8"))}
              channelName={selectedChannel.name}
            />
          ) : (
            // Fallback: Placeholder
            <div className="aspect-video bg-card rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Tv className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground mx-auto mb-2 md:mb-4" />
                <p className="text-sm md:text-base text-muted-foreground">
                  {loading ? "Carregando canais..." : selectedChannel ? "Canal sem URL configurada" : "Nenhum canal disponível nesta categoria"}
                </p>
              </div>
            </div>
          )}

          {/* Mobile Ad - Below Player */}
          <div className="mt-3 lg:hidden">
            <BelowPlayerAd ad={belowPlayerAdData} />
          </div>
        </div>

        {/* Right Sidebar - Channel List + Ad (Desktop) */}
        <div className="flex-1 lg:flex-none lg:w-80 min-h-0 overflow-hidden flex flex-col gap-3">
          <ChannelList
            channels={filteredChannels}
            selectedChannel={selectedChannel}
            onSelectChannel={setSelectedChannel}
            loading={loading}
          />
          
          {/* Desktop Ad - Below Channel List */}
          <SidebarAd ad={sidebarAdData} />
        </div>
      </main>
    </div>
  );
};

export default Index;
