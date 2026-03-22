import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PlayerContainer from "@/components/PlayerContainer";
import { useChannels, DBChannel } from "@/hooks/useChannels";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileChannelCatalog from "@/components/channels/MobileChannelCatalog";
import DesktopChannelCatalog from "@/components/channels/DesktopChannelCatalog";
import { Tv } from "lucide-react";

const LAST_CHANNEL_KEY = "streamplayer_last_channel";

const Index = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [selectedChannel, setSelectedChannel] = useState<DBChannel | null>(null);
  const [catalogOpen, setCatalogOpen] = useState(false);

  const { channels, loading } = useChannels();
  const { user } = useAuth();

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
    setSelectedChannel(channels[0]);
  }, [channels, selectedChannel]);

  const handleSelectChannel = useCallback((channel: DBChannel) => {
    setSelectedChannel(channel);
    setCatalogOpen(false);
    try {
      localStorage.setItem(LAST_CHANNEL_KEY, JSON.stringify(channel.id));
    } catch { /* ignore */ }
  }, []);

  // Stacked cards icon (same as series/movies)
  const ChannelListIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="2" width="16" height="2" rx="0.5" fill="currentColor" opacity="0.5" />
      <rect x="6" y="5" width="12" height="2" rx="0.5" fill="currentColor" opacity="0.7" />
      <rect x="3" y="8" width="18" height="14" rx="1" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <polygon points="10,12 10,18 15.5,15" fill="currentColor" />
    </svg>
  );

  const catalogButton = (
    <button
      onClick={(e) => { e.stopPropagation(); setCatalogOpen(prev => !prev); }}
      className="hover:scale-110 transition active:scale-95"
      title="Lista de canais"
    >
      <ChannelListIcon />
    </button>
  );

  const extraControls = (
    <>
      {catalogButton}
    </>
  );

  const catalogOverlay = selectedChannel ? (
    isMobile ? (
      <MobileChannelCatalog
        channels={channels}
        currentChannelId={selectedChannel.id}
        onSelectChannel={handleSelectChannel}
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
      />
    ) : (
      <DesktopChannelCatalog
        channels={channels}
        currentChannelId={selectedChannel.id}
        onSelectChannel={handleSelectChannel}
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
      />
    )
  ) : null;

  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-3">
          <Tv className="w-12 h-12 text-muted-foreground/50 mx-auto" />
          <p className="text-muted-foreground text-sm">Carregando canais...</p>
        </div>
      </div>
    );
  }

  if (channels.length === 0) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-3">
          <Tv className="w-12 h-12 text-muted-foreground/50 mx-auto" />
          <p className="text-muted-foreground">Nenhum canal disponível</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black flex items-center justify-center">
      {selectedChannel && (
        <PlayerContainer
          channel={selectedChannel}
          extraControls={extraControls}
          overlayContent={catalogOverlay}
          immersive
          onBack={() => navigate("/")}
        />
      )}
    </div>
  );
};

export default Index;
