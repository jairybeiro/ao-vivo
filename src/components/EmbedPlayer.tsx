/**
 * EmbedPlayer - Player de vídeo com proteção contra popups e anúncios
 * Inclui overlay protetor e suporte a Pre-Roll Ad
 */

import { useState, useCallback, forwardRef } from "react";
import { Play } from "lucide-react";
import { PreRollAd, type PreRollAdData } from "./ads";

interface EmbedPlayerProps {
  embedUrl: string;
  channelName?: string;
  /** Dados do anúncio pre-roll (opcional) */
  preRollAd?: PreRollAdData;
  /** Ativar pre-roll ad */
  enablePreRoll?: boolean;
}

const EmbedPlayer = forwardRef<HTMLDivElement, EmbedPlayerProps>(
  ({ embedUrl, channelName = "Canal", preRollAd, enablePreRoll = true }, ref) => {
    const [overlayActive, setOverlayActive] = useState(true);
    const [showPreRoll, setShowPreRoll] = useState(enablePreRoll);

    const handleOverlayClick = useCallback(() => {
      setOverlayActive(false);
    }, []);

    const handlePreRollComplete = useCallback(() => {
      setShowPreRoll(false);
    }, []);

    return (
      <div ref={ref} className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
        <iframe
          src={embedUrl}
          title={channelName}
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          allowFullScreen
          allow="encrypted-media; autoplay; fullscreen"
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
          className="w-full h-full"
          style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        />

        {showPreRoll && (
          <PreRollAd
            ad={preRollAd}
            onComplete={handlePreRollComplete}
            sessionKey={channelName}
          />
        )}

        {!showPreRoll && overlayActive && (
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
  }
);

EmbedPlayer.displayName = "EmbedPlayer";

export default EmbedPlayer;
