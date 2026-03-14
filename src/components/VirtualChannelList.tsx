import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Radio } from "lucide-react";
import type { DBChannel } from "@/hooks/useChannels";

interface VirtualChannelListProps {
  channels: DBChannel[];
  selectedChannelId?: string;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
  onSelect: (channel: DBChannel) => void;
}

const ITEM_HEIGHT = 64; // px per channel card

const VirtualChannelList = ({
  channels,
  selectedChannelId,
  isFavorite,
  onToggleFavorite,
  onSelect,
}: VirtualChannelListProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: channels.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 10,
  });

  if (channels.length === 0) {
    return null;
  }

  return (
    <div
      ref={parentRef}
      className="flex-1 min-h-0 overflow-y-auto rounded-lg border border-border bg-card/50"
      style={{ contain: "strict" }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const channel = channels[virtualItem.index];
          const isSelected = selectedChannelId === channel.id;

          return (
            <div
              key={channel.id}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
              className="px-2"
            >
              <div
                className={`h-[56px] my-1 bg-card border rounded-xl px-4 flex items-center gap-4 transition-colors cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => onSelect(channel)}
              >
                {channel.logo ? (
                  <img
                    src={channel.logo}
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
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VirtualChannelList;
