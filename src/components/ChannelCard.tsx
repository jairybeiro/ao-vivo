import { Radio } from "lucide-react";
import type { DBChannel } from "@/hooks/useChannels";

interface ChannelCardProps {
  channel: DBChannel;
  isSelected?: boolean;
  isFavorite: boolean;
  onToggleFavorite: (channelId: string) => void;
  onSelect: (channel: DBChannel) => void;
}

const ChannelCard = ({ channel, isSelected, onSelect }: ChannelCardProps) => {
  return (
    <div
      className={`bg-card border rounded-xl p-4 flex items-center gap-4 transition-colors cursor-pointer ${
        isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
      }`}
      onClick={() => onSelect(channel)}
    >
      {channel.logo ? (
        <img
          src={channel.logo}
          alt={channel.name}
          className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-muted"
        />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
          <Radio className="w-5 h-5 text-muted-foreground" />
        </div>
      )}

      <h3 className="font-semibold text-foreground truncate">{channel.name}</h3>
    </div>
  );
};

export default ChannelCard;
