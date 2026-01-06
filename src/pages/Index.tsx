import { useState } from "react";
import VideoPlayer from "@/components/VideoPlayer";
import ChannelList from "@/components/ChannelList";
import { defaultChannels, type Channel } from "@/data/channels";
import { Tv } from "lucide-react";

const Index = () => {
  const [channels] = useState<Channel[]>(defaultChannels);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(defaultChannels[0] || null);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Tv className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">StreamPlayer</h1>
              <p className="text-xs text-muted-foreground">Transmissões ao vivo</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-3">
            {selectedChannel ? (
              <VideoPlayer
                src={selectedChannel.streamUrl}
                channelName={selectedChannel.name}
              />
            ) : (
              <div className="aspect-video bg-card rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Tv className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Selecione um canal para começar</p>
                </div>
              </div>
            )}
          </div>

          {/* Channel List Sidebar */}
          <div className="lg:col-span-1">
            <ChannelList
              channels={channels}
              selectedChannel={selectedChannel}
              onSelectChannel={setSelectedChannel}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
