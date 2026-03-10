/**
 * EmbedPlayer - Player de vídeo com iframe de baixa detecção
 * Estratégia "Ghost Overlay" com 2 cliques e anti-sandbox detection
 */

import { useState, useCallback, forwardRef } from "react";
import { Play } from "lucide-react";
import { PreRollAd, type PreRollAdData } from "./ads";

interface EmbedPlayerProps {
  embedUrl: string;
  channelName?: string;
  preRollAd?: PreRollAdData;
  enablePreRoll?: boolean;
}

const EmbedPlayer = forwardRef<HTMLDivElement, EmbedPlayerProps>(
  ({ embedUrl, channelName = "Canal", preRollAd, enablePreRoll = true }, ref) => {
    const [iframeLoaded, setIframeLoaded] = useState(false);
    const [overlayActive, setOverlayActive] = useState(true);
    const [showPreRoll, setShowPreRoll] = useState(enablePreRoll);

    // Clique 1: carrega o iframe
    const handleFirstClick = useCallback(() => {
      setIframeLoaded(true);
    }, []);

    // Clique 2: remove overlay, passa interação ao iframe
    const handleSecondClick = useCallback(() => {
      setOverlayActive(false);
    }, []);

    const handlePreRollComplete = useCallback(() => {
      setShowPreRoll(false);
    }, []);

    return (
      <div ref={ref} className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
        {/* Iframe só é montado após o primeiro clique */}
        {iframeLoaded && (
          <iframe
            src={embedUrl}
            title={channelName}
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            allowFullScreen
            allow="encrypted-media; autoplay; fullscreen"
            sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
            referrerPolicy="no-referrer"
            className="w-full h-full absolute inset-0"
            style={{
              transform: 'scale(1.02)',
              transformOrigin: 'center center',
              WebkitOverflowScrolling: 'touch',
            } as React.CSSProperties}
          />
        )}

        {showPreRoll && (
          <PreRollAd
            ad={preRollAd}
            onComplete={handlePreRollComplete}
            sessionKey={channelName}
          />
        )}

        {/* Ghost Overlay - 2 cliques */}
        {!showPreRoll && overlayActive && (
          <button
            onClick={iframeLoaded ? handleSecondClick : handleFirstClick}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/60 cursor-pointer transition-opacity hover:bg-black/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-black"
            aria-label={iframeLoaded ? "Toque para reproduzir" : "Toque para carregar o player"}
          >
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/90 flex items-center justify-center shadow-lg">
              <Play className="w-8 h-8 md:w-10 md:h-10 text-primary-foreground ml-1" />
            </div>
            <span className="text-white text-sm md:text-base font-medium">
              {iframeLoaded ? "Toque para reproduzir" : "Toque para carregar o player"}
            </span>
          </button>
        )}
      </div>
    );
  }
);

EmbedPlayer.displayName = "EmbedPlayer";

export default EmbedPlayer;
