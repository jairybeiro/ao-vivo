import LivePlayer from "./LivePlayer";
import EmbedPlayer from "./EmbedPlayer";
import { DBChannel } from "@/hooks/useChannels";
import { findHlsUrl } from "@/lib/hlsUtils";

interface PlayerContainerProps {
  channel: DBChannel;
}

/**
 * PlayerContainer - Routes to the correct player based on channel source.
 *
 * Priority:
 * 1. HLS stream (.m3u8/.m3u/.txt) → LivePlayer (custom controls, AO VIVO indicator)
 * 2. embedUrl → EmbedPlayer (iframe)
 * 3. Fallback → try first streamUrl with LivePlayer
 */
const PlayerContainer = ({ channel }: PlayerContainerProps) => {
  const hlsStreamUrl = findHlsUrl(channel.streamUrls);
  const firstPlayableUrl = channel.streamUrls.find(
    (url) => url && url !== "placeholder"
  );

  if (hlsStreamUrl) {
    return (
      <LivePlayer
        src={hlsStreamUrl}
        title={channel.name}
        subtitle={channel.category}
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
  if (firstPlayableUrl) {
    return (
      <LivePlayer
        src={firstPlayableUrl}
        title={channel.name}
        subtitle={channel.category}
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
