import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import VideoPlayer from "@/components/VideoPlayer";
import ChannelList from "@/components/ChannelList";
import CategoryTabs from "@/components/CategoryTabs";
import { useChannels, type DBChannel } from "@/hooks/useChannels";
import { Tv, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

const CATEGORIES = ["Notícias", "Esporte", "Filmes", "Séries"];

const Index = () => {
  const { channels, loading } = useChannels();
  const [selectedCategory, setSelectedCategory] = useState("Notícias");
  const [selectedChannel, setSelectedChannel] = useState<DBChannel | null>(null);

  const filteredChannels = useMemo(() => {
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
    const newFiltered = channels.filter((ch) => ch.category === category);
    if (newFiltered.length > 0) {
      setSelectedChannel(newFiltered[0]);
    } else {
      setSelectedChannel(null);
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header - Fixed */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm flex-shrink-0 z-50">
        <div className="px-3 md:px-4 py-2 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-primary flex items-center justify-center">
                <Tv className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-base md:text-xl font-bold text-foreground">StreamPlayer</h1>
                <p className="text-xs text-muted-foreground hidden md:block">Transmissões ao vivo</p>
              </div>
            </div>
            <Link to="/admin/login">
              <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10">
                <Settings className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Category Tabs - Fixed */}
      <div className="px-3 md:px-4 py-2 md:py-4 flex-shrink-0">
        <CategoryTabs
          categories={CATEGORIES}
          selectedCategory={selectedCategory}
          onSelectCategory={handleCategoryChange}
        />
      </div>

      {/* Main Content - Flex layout */}
      <main className="flex-1 flex flex-col lg:flex-row px-3 md:px-4 pb-3 md:pb-6 gap-3 md:gap-6 overflow-hidden">
        {/* Video Player - Fixed on mobile */}
        <div className="flex-shrink-0 lg:flex-1">
          {selectedChannel ? (
            <VideoPlayer
              streamUrls={selectedChannel.streamUrls}
              channelName={selectedChannel.name}
            />
          ) : (
            <div className="aspect-video bg-card rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Tv className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground mx-auto mb-2 md:mb-4" />
                <p className="text-sm md:text-base text-muted-foreground">
                  {loading ? "Carregando canais..." : "Nenhum canal disponível nesta categoria"}
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
