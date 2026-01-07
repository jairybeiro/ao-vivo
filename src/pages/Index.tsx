import { useState, useMemo } from "react";
import EmbedPlayer from "@/components/EmbedPlayer";
import ChannelList from "@/components/ChannelList";
import CategoryTabs from "@/components/CategoryTabs";
import { useChannels, type DBChannel } from "@/hooks/useChannels";
import { Tv } from "lucide-react";

const CATEGORIES = ["Todos", "Notícias", "Esportes", "Filmes", "Variedades"];

const Index = () => {
  const { channels, loading } = useChannels();
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedChannel, setSelectedChannel] = useState<DBChannel | null>(null);

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
    const newFiltered = category === "Todos" 
      ? channels 
      : channels.filter((ch) => ch.category === category);
    if (newFiltered.length > 0) {
      setSelectedChannel(newFiltered[0]);
    } else {
      setSelectedChannel(null);
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header with Logo + Categories - Fixed */}
      <div className="px-3 md:px-4 py-2 md:py-4 flex-shrink-0 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          {/* Logo and Title */}
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-primary flex items-center justify-center">
              <Tv className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
            </div>
            <div className="hidden lg:block">
              <h1 className="text-base md:text-xl font-bold text-foreground">StreamPlayer</h1>
              <p className="text-xs text-muted-foreground">Transmissões ao vivo</p>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex-1">
            <CategoryTabs
              categories={CATEGORIES}
              selectedCategory={selectedCategory}
              onSelectCategory={handleCategoryChange}
            />
          </div>
        </div>
      </div>

      {/* Main Content - Flex layout */}
      <main className="flex-1 flex flex-col lg:flex-row px-3 md:px-4 pb-3 md:pb-6 gap-3 md:gap-6 overflow-hidden">
        {/* Embed Player - Fixed on mobile */}
        <div className="flex-shrink-0 lg:flex-1">
          {selectedChannel?.embedUrl ? (
            <EmbedPlayer
              embedUrl={selectedChannel.embedUrl}
              channelName={selectedChannel.name}
            />
          ) : (
            <div className="aspect-video bg-card rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Tv className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground mx-auto mb-2 md:mb-4" />
                <p className="text-sm md:text-base text-muted-foreground">
                  {loading ? "Carregando canais..." : selectedChannel ? "Canal sem URL de embed configurada" : "Nenhum canal disponível nesta categoria"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Channel List - Scrollable */}
        <div className="flex-1 lg:flex-none lg:w-80 min-h-0 overflow-hidden">
          <ChannelList
            channels={filteredChannels}
            selectedChannel={selectedChannel}
            onSelectChannel={setSelectedChannel}
            loading={loading}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
