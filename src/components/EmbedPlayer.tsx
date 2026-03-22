/**
 * EmbedPlayer - Player de vídeo com iframe protegido contra redirecionamentos
 * Estratégia: 3 cliques para "limpar" pop-ups antes de liberar o player
 */

import { useState, useCallback, useRef, useEffect, forwardRef } from "react";
import { Play, Loader2, Shield, ArrowLeft } from "lucide-react";
import { PreRollAd, type PreRollAdData } from "./ads";

interface EmbedPlayerProps {
  embedUrl: string;
  channelName?: string;
  preRollAd?: PreRollAdData;
  enablePreRoll?: boolean;
  extraControls?: React.ReactNode;
  overlayContent?: React.ReactNode;
  immersive?: boolean;
  onBack?: () => void;
}

const REQUIRED_CLICKS = 3;

const EmbedPlayer = forwardRef<HTMLDivElement, EmbedPlayerProps>(
  ({ embedUrl, channelName = "Canal", preRollAd, enablePreRoll = true, extraControls, overlayContent, immersive }, ref) => {
    const [iframeLoaded, setIframeLoaded] = useState(false);
    const [clickCount, setClickCount] = useState(0);
    const [showPreRoll, setShowPreRoll] = useState(enablePreRoll);
    const [showControls, setShowControls] = useState(true);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const hideTimer = useRef<ReturnType<typeof setTimeout>>();

    const isProtectionActive = clickCount < REQUIRED_CLICKS;
    const hasOverlayControls = !!(extraControls || overlayContent);

    // Auto-hide floating controls
    const resetHideTimer = useCallback(() => {
      setShowControls(true);
      clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setShowControls(false), 3500);
    }, []);

    useEffect(() => {
      return () => clearTimeout(hideTimer.current);
    }, []);

    const handleOverlayClick = useCallback(() => {
      if (!iframeLoaded) {
        setIframeLoaded(true);
        setClickCount(1);
        return;
      }

      const next = clickCount + 1;
      setClickCount(next);

      if (next >= REQUIRED_CLICKS) {
        setTimeout(() => {
          iframeRef.current?.focus();
        }, 100);
      }
    }, [iframeLoaded, clickCount]);

    const handlePreRollComplete = useCallback(() => {
      setShowPreRoll(false);
    }, []);

    const getOverlayMessage = () => {
      if (!iframeLoaded) return "Toque para carregar o player";
      if (clickCount < REQUIRED_CLICKS) {
        const remaining = REQUIRED_CLICKS - clickCount;
        return remaining === 1 ? "Quase lá... toque mais uma vez" : `Preparando player... toque mais ${remaining}x`;
      }
      return "";
    };

    return (
      <div
        ref={ref}
        className={`relative bg-black overflow-hidden ${immersive ? "flex items-center justify-center" : "w-full rounded-lg"}`}
        style={immersive ? { width: "98vw", height: "98vh", margin: "1vh auto" } : { aspectRatio: "16/9" }}
        onMouseMove={hasOverlayControls ? resetHideTimer : undefined}
        onTouchStart={hasOverlayControls ? resetHideTimer : undefined}
      >
        {/* Iframe com sandbox restritivo */}
        {iframeLoaded && (
          <iframe
            ref={iframeRef}
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
              transform: "scale(1.02)",
              transformOrigin: "center center",
              WebkitOverflowScrolling: "touch",
            } as React.CSSProperties}
          />
        )}

        {/* Pre-roll ad */}
        {showPreRoll && (
          <PreRollAd
            ad={preRollAd}
            onComplete={handlePreRollComplete}
            sessionKey={channelName}
          />
        )}

        {/* Camada de proteção contra redirecionamentos */}
        {!showPreRoll && isProtectionActive && (
          <button
            onClick={handleOverlayClick}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-black"
            style={{ backgroundColor: iframeLoaded && clickCount > 0 ? "rgba(0,0,0,0.40)" : "rgba(0,0,0,0.60)" }}
            aria-label={getOverlayMessage()}
          >
            {!iframeLoaded ? (
              <>
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/90 flex items-center justify-center shadow-lg">
                  <Play className="w-8 h-8 md:w-10 md:h-10 text-primary-foreground ml-1" />
                </div>
                <span className="text-white text-sm md:text-base font-medium">
                  Toque para carregar o player
                </span>
              </>
            ) : (
              <>
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-black/50 border border-white/20 flex items-center justify-center backdrop-blur-sm">
                  {clickCount < REQUIRED_CLICKS - 1 ? (
                    <Shield className="w-6 h-6 md:w-7 md:h-7 text-white/80" />
                  ) : (
                    <Loader2 className="w-6 h-6 md:w-7 md:h-7 text-white/80 animate-spin" />
                  )}
                </div>
                <span className="text-white/90 text-xs md:text-sm font-medium">
                  {getOverlayMessage()}
                </span>
                <div className="flex gap-1.5 mt-1">
                  {Array.from({ length: REQUIRED_CLICKS }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i < clickCount ? "bg-primary" : "bg-white/30"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </button>
        )}

        {/* Floating navigation bar for embed channels — appears on mouse move */}
        {hasOverlayControls && !isProtectionActive && !showPreRoll && (
          <div
            className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none"
            style={{
              opacity: showControls ? 1 : 0,
              transition: "opacity 300ms ease",
            }}
          >
            {/* Bottom gradient scrim */}
            <div
              className="absolute bottom-0 left-0 w-full player-scrim-bottom"
              style={{ height: "100px" }}
            />

            {/* Controls bar */}
            <div className="relative px-4 md:px-8 pb-3 md:pb-5 pointer-events-auto">
              <div className="flex items-center justify-end gap-3 md:gap-5 text-white">
                {extraControls}
              </div>
            </div>
          </div>
        )}

        {/* Overlay content (channel catalog etc.) */}
        {overlayContent}
      </div>
    );
  }
);

EmbedPlayer.displayName = "EmbedPlayer";

export default EmbedPlayer;
