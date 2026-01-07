import { useState } from "react";
import { Play } from "lucide-react";

interface EmbedPlayerProps {
  embedUrl: string;
  channelName?: string;
}

const EmbedPlayer = ({ embedUrl, channelName = "Canal" }: EmbedPlayerProps) => {
  // Estado controla se o overlay protetor está ativo
  const [overlayActive, setOverlayActive] = useState(true);

  // Handler que consome o primeiro clique e remove o overlay
  const handleOverlayClick = () => {
    setOverlayActive(false);
  };

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      {/* 
        Iframe com sandbox restritivo:
        - allow-scripts: permite scripts do player funcionar
        - allow-same-origin: necessário para alguns players
        - NÃO inclui allow-popups nem allow-top-navigation para bloquear redirecionamentos
      */}
      <iframe
        src={embedUrl}
        title={channelName}
        width="100%"
        height="100%"
        frameBorder="0"
        scrolling="no"
        allowFullScreen
        allow="encrypted-media; autoplay; fullscreen"
        sandbox="allow-scripts allow-same-origin allow-presentation"
        className="w-full h-full"
      />

      {/* 
        Overlay protetor:
        - Intercepta o primeiro clique antes de chegar ao iframe
        - Evita que scripts de anúncio capturem o clique inicial
        - Removido após interação do usuário
      */}
      {overlayActive && (
        <button
          onClick={handleOverlayClick}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/60 cursor-pointer transition-opacity hover:bg-black/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-black"
          aria-label="Toque para ativar o player"
        >
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/90 flex items-center justify-center shadow-lg">
            <Play className="w-8 h-8 md:w-10 md:h-10 text-primary-foreground ml-1" />
          </div>
          <span className="text-white text-sm md:text-base font-medium">
            Toque para ativar o player
          </span>
        </button>
      )}
    </div>
  );
};

export default EmbedPlayer;
