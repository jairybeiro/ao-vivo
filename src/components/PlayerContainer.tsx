import DirectStreamPlayer from "./DirectStreamPlayer";
import EmbedPlayer from "./EmbedPlayer";
import { DBChannel } from "@/hooks/useChannels";
import { findHlsUrl } from "@/lib/hlsUtils";

interface PlayerContainerProps {
  channel: DBChannel;
  forceEmbed?: boolean;
}

/**
 * PlayerContainer - Decides which player to render based on channel data.
 *
 * Priority:
 * 1. If forceEmbed is true → always use EmbedPlayer
 * 2. If channel has an HLS streamUrl (.m3u8/.m3u/.txt) → use DirectStreamPlayer (HLS.js)
 * 3. If channel has embedUrl → use EmbedPlayer (iframe)
 * 4. Fallback → try first streamUrl with DirectStreamPlayer
 */
const PlayerContainer = ({ channel, forceEmbed = false }: PlayerContainerProps) => {
  const hlsStreamUrl = findHlsUrl(channel.streamUrls);

  // Force embed mode
  if (forceEmbed && channel.embedUrl) {
    return (
      <EmbedPlayer
        embedUrl={channel.embedUrl}
        channelName={channel.name}
        enablePreRoll={false}
      />
    );
  }

  // Priority: direct HLS stream
  if (hlsStreamUrl) {
    console.log("Loading HLS stream:", hlsStreamUrl);
    return (
      <DirectStreamPlayer
        streamUrl={hlsStreamUrl}
        channelName={channel.name}
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
  if (channel.streamUrls?.[0]) {
    return (
      <DirectStreamPlayer
        streamUrl={channel.streamUrls[0]}
        channelName={channel.name}
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
