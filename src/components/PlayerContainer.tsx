import StreamPlayerComponent from "./StreamPlayer";
import EmbedPlayer from "./EmbedPlayer";
import { DBChannel } from "@/hooks/useChannels";
import { findHlsUrl } from "@/lib/hlsUtils";

interface PlayerContainerProps {
  channel: DBChannel;
}

/**
 * PlayerContainer - Decides which player to render based on channel data.
 *
 * Priority:
 * 1. If channel has an HLS streamUrl (.m3u8/.m3u/.txt) → use StreamPlayer SDK
 * 2. If channel has embedUrl → use EmbedPlayer (iframe)
 * 3. Fallback → try first streamUrl with StreamPlayer SDK
 */
const PlayerContainer = ({ channel }: PlayerContainerProps) => {
  const hlsStreamUrl = findHlsUrl(channel.streamUrls);

  // Priority: direct HLS stream via SDK (with multi-source failover)
  if (hlsStreamUrl) {
    return (
      <StreamPlayerComponent
        source={hlsStreamUrl}
        sources={channel.streamUrls.length > 1 ? channel.streamUrls : undefined}
        title={channel.name}
        fallbackEmbedUrl={channel.embedUrl || undefined}
      />
    );
  }

  // Fallback: embed iframe
  if (channel.embedUrl) {
    return (
      <EmbedPlayer
        embedUrl={channel.embedUrl}
        channelName={channel.name}
        enablePreRoll={false}
      />
    );
  }

  // Last resort: try first stream URL via SDK
  if (channel.streamUrls?.[0]) {
    return (
      <StreamPlayerComponent
        source={channel.streamUrls[0]}
        title={channel.name}
      />
    );
  }

  return (
    <div className="w-full aspect-video bg-black rounded-lg flex items-center justify-center">
      <p className="text-muted-foreground text-sm">Nenhuma fonte disponível</p>
    </div>
  );
};

export default PlayerContainer;
