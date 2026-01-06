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
    <div className="h-full bg-sidebar rounded-lg lg:rounded-lg border border-sidebar-border overflow-hidden flex flex-col lg:max-h-[280px]">
      {/* Header */}
      <div className="p-3 md:p-4 border-b border-sidebar-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 md:w-5 md:h-5 text-primary" />
          <h2 className="text-base md:text-lg font-semibold text-sidebar-foreground">Canais</h2>
        </div>
        <p className="text-xs md:text-sm text-muted-foreground mt-1">
          {channels.length} {channels.length === 1 ? "canal disponível" : "canais disponíveis"}
        </p>
      </div>

      {/* Channel List - Scrollable, limited to ~3 items on desktop */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
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
              className={`w-full flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg transition-all duration-200 ${
                selectedChannel?.id === channel.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-sidebar-accent text-sidebar-foreground"
              }`}
            >
              {channel.logo ? (
                <img
                  src={channel.logo}
                  alt={channel.name}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-md object-cover"
                />
              ) : (
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-md bg-accent flex items-center justify-center">
                  <Radio className="w-4 h-4 md:w-5 md:h-5" />
                </div>
              )}
              <div className="flex-1 text-left min-w-0">
                <p className="font-medium text-sm md:text-base truncate">{channel.name}</p>
                <p className={`text-xs ${selectedChannel?.id === channel.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  Ao vivo
                </p>
              </div>
              {selectedChannel?.id === channel.id && (
                <div className="w-2 h-2 rounded-full bg-live animate-live-pulse flex-shrink-0" />
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default ChannelList;
