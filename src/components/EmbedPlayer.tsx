import { ArrowLeft } from "lucide-react";

interface EmbedPlayerProps {
  embedUrl: string;
  onBack?: () => void;
}

const EmbedPlayer = ({ embedUrl, onBack }: EmbedPlayerProps) => {
  const isYouTube = embedUrl.includes('youtube.com') || embedUrl.includes('youtu.be');
  
  const getProcessedUrl = (url: string) => {
    if (!isYouTube) return url;
    
    // Extrai o ID do vídeo para garantir o formato /embed/
    let videoId = "";
    if (url.includes('watch?v=')) {
      videoId = url.split('v=')[1]?.split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('embed/')[1]?.split('?')[0];
    }

    if (videoId) {
      const baseUrl = `https://www.youtube.com/embed/${videoId}`;
      const params = new URLSearchParams(url.split('?')[1] || "");
      params.set('enablejsapi', '1');
      params.set('autoplay', '1');
      params.set('mute', '1');
      params.set('playsinline', '1');
      return `${baseUrl}?${params.toString()}`;
    }
    
    return `${url}${url.includes('?') ? '&' : '?'}enablejsapi=1`;
  };

  return (
    <div className="relative w-full h-full">
      <iframe
        src={getProcessedUrl(embedUrl)}
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
