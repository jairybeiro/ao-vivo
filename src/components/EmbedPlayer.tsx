interface EmbedPlayerProps {
  embedUrl: string;
}

const EmbedPlayer = ({ embedUrl }: EmbedPlayerProps) => {
  return (
    <iframe
      src={embedUrl}
      className="w-full h-full"
      allow="autoplay; encrypted-media; fullscreen"
      allowFullScreen
      sandbox="allow-scripts allow-same-origin allow-presentation"
      referrerPolicy="no-referrer"
      title="Embed Player"
    />
  );
};

export default EmbedPlayer;
