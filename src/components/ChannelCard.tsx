import { Radio, Star, StarOff, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DBChannel } from "@/hooks/useChannels";

interface ChannelCardProps {
  channel: DBChannel;
  isSelected?: boolean;
  isFavorite: boolean;
  onToggleFavorite: (channelId: string) => void;
  onSelect: (channel: DBChannel) => void;
}

const ChannelCard = ({ channel, isSelected, isFavorite, onToggleFavorite, onSelect }: ChannelCardProps) => {
  return (
    <div
      className={`bg-card border rounded-xl p-4 flex items-center gap-4 transition-colors cursor-pointer ${
        isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
      }`}
      onClick={() => onSelect(channel)}
    >
      {/* Logo */}
      {channel.logo ? (
        <img
          src={channel.logo}
          alt={channel.name}
          className="w-14 h-14 rounded-lg object-cover flex-shrink-0 bg-muted"
        />
      ) : (
        <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
          <Radio className="w-6 h-6 text-muted-foreground" />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground truncate">{channel.name}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{channel.category}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="w-2 h-2 rounded-full bg-live animate-live-pulse" />
          <span className="text-xs text-muted-foreground">Ao vivo</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(channel.id); }}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
          aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        >
          {isFavorite ? (
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
          ) : (
            <StarOff className="w-5 h-5 text-muted-foreground" />
          )}
        </button>

        <Button
          size="sm"
          onClick={(e) => { e.stopPropagation(); onSelect(channel); }}
          variant={isSelected ? "default" : "outline"}
          className="gap-1.5"
        >
          <Play className="w-4 h-4" />
          Assistir
        </Button>
      </div>
    </div>
  );
};

export default ChannelCard;
