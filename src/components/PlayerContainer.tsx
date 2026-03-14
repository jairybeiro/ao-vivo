import StreamPlayerComponent from "./StreamPlayer";
import EmbedPlayer from "./EmbedPlayer";
import { DBChannel } from "@/hooks/useChannels";
import { findHlsUrl } from "@/lib/hlsUtils";
import { toProxyStreamUrl } from "@/lib/streamProxy";

interface PlayerContainerProps {
  channel: DBChannel;
}

/**
 * PlayerContainer - Simple player that plays what's saved in the database.
 *
 * Priority:
 * 1. If channel has an HLS streamUrl (.m3u8/.m3u/.txt) → use StreamPlayer SDK
 * 2. If channel has embedUrl → use EmbedPlayer (iframe fallback)
 * 3. Fallback → try first streamUrl with StreamPlayer SDK
 */
const PlayerContainer = ({ channel }: PlayerContainerProps) => {
  const hlsStreamUrl = findHlsUrl(channel.streamUrls);
  const playableStreamUrls = channel.streamUrls
    .filter((url) => url && url !== "placeholder")
    .map((url) => toProxyStreamUrl(url));

  if (hlsStreamUrl) {
    return (
      <StreamPlayerComponent
        source={toProxyStreamUrl(hlsStreamUrl)}
        sources={playableStreamUrls.length > 1 ? playableStreamUrls : undefined}
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

  // Last resort: try first stream URL
  if (playableStreamUrls[0]) {
    return (
      <StreamPlayerComponent
        source={playableStreamUrls[0]}
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
