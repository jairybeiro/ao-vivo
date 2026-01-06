interface EmbedPlayerProps {
  embedUrl: string;
  channelName?: string;
}

const EmbedPlayer = ({ embedUrl, channelName = "Canal" }: EmbedPlayerProps) => {
  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      <iframe
        src={embedUrl}
        title={channelName}
        width="100%"
        height="100%"
        frameBorder="0"
        scrolling="no"
        allowFullScreen
        allow="encrypted-media; autoplay; fullscreen"
        className="w-full h-full"
      />
    </div>
  );
};

export default EmbedPlayer;
