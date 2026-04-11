import { useEffect, useRef, useState, useCallback } from "react";
import { Play, X } from "lucide-react";
import VodPlayer from "@/components/VodPlayer";
import { extractYouTubeId, isDirectVideoUrl, pickPreferredMediaUrl } from "@/lib/videoSource";

interface FullscreenTrailerPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  trailerUrl: string | null;
  embedUrl?: string | null;
  contentUrl?: string | null;
  title: string;
  poster?: string;
}

const FullscreenTrailerPlayer = ({
  isOpen,
  onClose,
  trailerUrl,
  embedUrl,
  contentUrl,
  title,
  poster,
}: FullscreenTrailerPlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeSource, setActiveSource] = useState<"trailer" | "content">("trailer");
  const [showEndOverlay, setShowEndOverlay] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const countdownRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (isOpen) {
      setIsInitialized(true);
      setActiveSource("trailer");
      setShowEndOverlay(false);
      setCountdown(15);
      clearInterval(countdownRef.current);
    }
  }, [isOpen, trailerUrl, embedUrl, contentUrl]);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      clearInterval(countdownRef.current);
    };
  }, [isOpen, onClose]);

  const trailerSource = pickPreferredMediaUrl(trailerUrl, embedUrl);
  const effectiveUrl = activeSource === "content"
    ? pickPreferredMediaUrl(contentUrl)
    : trailerSource;
  const youtubeId = extractYouTubeId(effectiveUrl);
  const isDirectVideo = isDirectVideoUrl(effectiveUrl);
  const canWatchFullContent = isDirectVideoUrl(contentUrl);

  const handleTrailerEnded = useCallback(() => {
    if (!canWatchFullContent || activeSource === "content") return;
    setShowEndOverlay(true);
    setCountdown(15);
    let count = 15;
    clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      count--;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(countdownRef.current);
        setShowEndOverlay(false);
        setActiveSource("content");
      }
    }, 1000);
  }, [canWatchFullContent, activeSource]);

  const handleWatchNow = useCallback(() => {
    clearInterval(countdownRef.current);
    setShowEndOverlay(false);
    setActiveSource("content");
  }, []);

  const handleCancelOverlay = useCallback(() => {
    clearInterval(countdownRef.current);
    setShowEndOverlay(false);
  }, []);

  if (!isOpen || !effectiveUrl) return null;

  const progressPercent = ((15 - countdown) / 15) * 100;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
    >
      {isInitialized && (
        <div className="w-full h-full relative">
          {isDirectVideo ? (
            <VodPlayer
              src={effectiveUrl}
              title={activeSource === "content" ? `${title} · Conteúdo Completo` : title}
              poster={poster || undefined}
              contentType="movie"
              onBack={onClose}
              onEnded={activeSource === "trailer" ? handleTrailerEnded : undefined}
            />
          ) : youtubeId ? (
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=0&controls=1&rel=0&modestbranding=1`}
              className="w-full h-full"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              title={title}
            />
          ) : (
            <iframe
              src={effectiveUrl}
              className="w-full h-full"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
              referrerPolicy="no-referrer"
              title={title}
            />
          )}

          {/* End-of-trailer overlay — "Assistir Completo" */}
          {showEndOverlay && canWatchFullContent && (
            <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-6 text-center px-6">
                {/* Countdown circle */}
                <div className="relative w-20 h-20">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle
                      cx="18" cy="18" r="16"
                      fill="none" stroke="currentColor" strokeWidth="2"
                      className="text-white/15"
                    />
                    <circle
                      cx="18" cy="18" r="16"
                      fill="none" stroke="currentColor" strokeWidth="2.5"
                      strokeDasharray={`${progressPercent} 100`}
                      strokeLinecap="round"
                      className="text-primary transition-all duration-1000"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-white">
                    {countdown}
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-white/60 text-sm">O trailer terminou</p>
                  <p className="text-white font-medium text-base truncate max-w-xs">{title}</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCancelOverlay}
                    className="px-5 py-2.5 rounded-lg text-sm font-medium text-primary border border-primary/40 hover:bg-primary/10 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleWatchNow}
                    className="px-5 py-2.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Assistir Completo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FullscreenTrailerPlayer;
