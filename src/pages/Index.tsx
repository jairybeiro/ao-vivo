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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Tv className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">StreamPlayer</h1>
                <p className="text-xs text-muted-foreground">Transmissões ao vivo</p>
              </div>
            </div>
            <Link to="/admin/login">
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Category Tabs */}
      <div className="container mx-auto px-4 py-4">
        <CategoryTabs
          categories={CATEGORIES}
          selectedCategory={selectedCategory}
          onSelectCategory={handleCategoryChange}
        />
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-3">
            {selectedChannel ? (
              <VideoPlayer
                streamUrls={selectedChannel.streamUrls}
                channelName={selectedChannel.name}
              />
            ) : (
              <div className="aspect-video bg-card rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Tv className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {loading ? "Carregando canais..." : "Nenhum canal disponível nesta categoria"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Channel List Sidebar */}
          <div className="lg:col-span-1">
            <ChannelList
              channels={filteredChannels}
              selectedChannel={selectedChannel}
              onSelectChannel={setSelectedChannel}
              loading={loading}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
