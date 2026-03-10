import StreamPlayerComponent from "./StreamPlayer";
import EmbedPlayer from "./EmbedPlayer";
import { DBChannel } from "@/hooks/useChannels";
import { useResolveStream } from "@/hooks/useResolveStream";
import { findHlsUrl } from "@/lib/hlsUtils";
import { Loader2 } from "lucide-react";

interface PlayerContainerProps {
  channel: DBChannel;
}

/**
 * PlayerContainer - Decides which player to render based on channel data.
 *
 * Priority:
 * 1. If channel has embedUrl → resolve real stream URL via edge function first
 * 2. If channel has an HLS streamUrl (.m3u8/.m3u/.txt) → use StreamPlayer SDK
 * 3. If channel has embedUrl and resolution failed → use EmbedPlayer (iframe)
 * 4. Fallback → try first streamUrl with StreamPlayer SDK
 */
const PlayerContainer = ({ channel }: PlayerContainerProps) => {
  const { resolvedUrl, loading: resolving, error: resolveError, finalStreamUrls } = useResolveStream(
    channel.embedUrl,
    channel.streamUrls
  );

  // Show loading while resolving embed URL
  if (resolving) {
    return (
      <div className="w-full aspect-video bg-black rounded-lg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
        <span className="text-white/70 text-sm ml-3">Resolvendo stream...</span>
      </div>
    );
  }

  // If we resolved a URL from embed, use it as primary
  if (resolvedUrl) {
    return (
      <StreamPlayerComponent
        source={resolvedUrl}
        sources={finalStreamUrls.length > 1 ? finalStreamUrls : undefined}
        title={channel.name}
        fallbackEmbedUrl={channel.embedUrl || undefined}
      />
    );
  }

  // Standard flow: check for HLS in existing stream URLs
  const hlsStreamUrl = findHlsUrl(channel.streamUrls);

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
