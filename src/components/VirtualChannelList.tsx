import { useState } from "react";
import { Radio, ChevronDown, ChevronUp } from "lucide-react";
import type { DBChannel } from "@/hooks/useChannels";
import { toProxyAssetUrl } from "@/lib/streamProxy";

const INITIAL_VISIBLE = 6;

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
  const [expanded, setExpanded] = useState(false);

  if (channels.length === 0) {
    return null;
  }

  const visibleChannels = expanded ? channels : channels.slice(0, INITIAL_VISIBLE);
  const hasMore = channels.length > INITIAL_VISIBLE;

  return (
    <div className="rounded-lg border border-border bg-card/50 overflow-hidden">
      <div className="flex flex-col gap-1 p-2">
        {visibleChannels.map((channel) => {
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
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors border-t border-border"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Mostrar menos
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Mostrar mais ({channels.length - INITIAL_VISIBLE})
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default VirtualChannelList;
