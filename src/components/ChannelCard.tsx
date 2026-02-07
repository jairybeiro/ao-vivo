import { ExternalLink, Radio, Star, StarOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DBChannel } from "@/hooks/useChannels";

interface ChannelCardProps {
  channel: DBChannel;
  isFavorite: boolean;
  onToggleFavorite: (channelId: string) => void;
}

const ChannelCard = ({ channel, isFavorite, onToggleFavorite }: ChannelCardProps) => {
  // Determinar a URL externa do canal (prioridade: embedUrl > primeira streamUrl)
  const externalUrl = channel.embedUrl || channel.streamUrls?.[0] || null;

  const handleWatch = () => {
    if (externalUrl) {
      window.open(externalUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-primary/50 transition-colors">
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
          onClick={() => onToggleFavorite(channel.id)}
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
          onClick={handleWatch}
          disabled={!externalUrl}
          className="gap-1.5"
        >
          <ExternalLink className="w-4 h-4" />
          Assistir
        </Button>
      </div>
    </div>
  );
};

export default ChannelCard;
