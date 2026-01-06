import { Radio } from "lucide-react";
import type { DBChannel } from "@/hooks/useChannels";
import { Skeleton } from "@/components/ui/skeleton";

interface ChannelListProps {
  channels: DBChannel[];
  selectedChannel: DBChannel | null;
  onSelectChannel: (channel: DBChannel) => void;
  loading?: boolean;
}

const ChannelList = ({ channels, selectedChannel, onSelectChannel, loading }: ChannelListProps) => {
  if (loading) {
    return (
      <div className="h-full bg-sidebar rounded-lg border border-sidebar-border overflow-hidden">
        <div className="p-4 border-b border-sidebar-border">
          <Skeleton className="h-6 w-24 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="p-2 space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-sidebar rounded-lg border border-sidebar-border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-sidebar-foreground">Canais</h2>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {channels.length} {channels.length === 1 ? "canal disponível" : "canais disponíveis"}
        </p>
      </div>

      {/* Channel List */}
      <div className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-400px)]">
        {channels.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Radio className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum canal nesta categoria</p>
          </div>
        ) : (
          channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => onSelectChannel(channel)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                selectedChannel?.id === channel.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-sidebar-accent text-sidebar-foreground"
              }`}
            >
              {channel.logo ? (
                <img
                  src={channel.logo}
                  alt={channel.name}
                  className="w-10 h-10 rounded-md object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-md bg-accent flex items-center justify-center">
                  <Radio className="w-5 h-5" />
                </div>
              )}
              <div className="flex-1 text-left">
                <p className="font-medium">{channel.name}</p>
                <p className={`text-xs ${selectedChannel?.id === channel.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  Transmissão ao vivo
                </p>
              </div>
              {selectedChannel?.id === channel.id && (
                <div className="w-2 h-2 rounded-full bg-live animate-live-pulse" />
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default ChannelList;
