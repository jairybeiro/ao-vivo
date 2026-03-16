import { Radio } from "lucide-react";
import type { DBChannel } from "@/hooks/useChannels";
import { toProxyAssetUrl } from "@/lib/streamProxy";

interface VirtualChannelListProps {
  channels: DBChannel[];
  selectedChannelId?: string;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
  onSelect: (channel: DBChannel) => void;
}

const VirtualChannelList = ({
  channels,
  selectedChannelId,
  onSelect,
}: VirtualChannelListProps) => {
  if (channels.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border bg-card/50 overflow-hidden">
      <div className="flex flex-col gap-1 p-2">
        {channels.map((channel) => {
          const isSelected = selectedChannelId === channel.id;
          const logoUrl = toProxyAssetUrl(channel.logo);

          return (
            <div
              key={channel.id}
              className={`h-[56px] bg-card border rounded-xl px-4 flex items-center gap-4 transition-colors cursor-pointer ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
              onClick={() => onSelect(channel)}
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={channel.name}
                  className="w-8 h-8 rounded-lg object-cover flex-shrink-0 bg-muted"
                  loading="lazy"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Radio className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground text-sm truncate">
                  {channel.name}
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  {channel.category}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VirtualChannelList;
