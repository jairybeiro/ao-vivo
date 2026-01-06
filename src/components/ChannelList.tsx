import { Radio, Plus } from "lucide-react";
import type { Channel } from "@/data/channels";

interface ChannelListProps {
  channels: Channel[];
  selectedChannel: Channel | null;
  onSelectChannel: (channel: Channel) => void;
}

const ChannelList = ({ channels, selectedChannel, onSelectChannel }: ChannelListProps) => {
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
      <div className="p-2 space-y-1 overflow-y-auto max-h-[calc(100%-80px)]">
        {channels.map((channel) => (
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
        ))}

        {/* Add Channel Placeholder */}
        <button className="w-full flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-sidebar-border hover:border-primary/50 transition-colors text-muted-foreground hover:text-foreground">
          <div className="w-10 h-10 rounded-md border-2 border-dashed border-current flex items-center justify-center">
            <Plus className="w-5 h-5" />
          </div>
          <span className="font-medium">Adicionar canal</span>
        </button>
      </div>
    </div>
  );
};

export default ChannelList;
