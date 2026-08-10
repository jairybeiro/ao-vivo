import { ArrowLeft } from "lucide-react";

interface EmbedPlayerProps {
  embedUrl: string;
  onBack?: () => void;
}

const EmbedPlayer = ({ embedUrl, onBack }: EmbedPlayerProps) => {
  return (
    <div className="relative w-full h-full">
      <iframe
        src={`${embedUrl}${embedUrl.includes('?') ? '&' : '?'}enablejsapi=1`}
        className="w-full h-full"
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
        referrerPolicy="no-referrer"
        title="Embed Player"
      />
      {onBack && (
        <button
          onClick={onBack}
          aria-label="Voltar"
          style={{
            top: "calc(env(safe-area-inset-top, 0px) + 16px)",
            left: "calc(env(safe-area-inset-left, 0px) + 20px)",
          }}
          className="absolute z-[10000] w-11 h-11 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
};

export default EmbedPlayer;
