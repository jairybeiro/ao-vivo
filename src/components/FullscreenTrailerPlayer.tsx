import { useEffect, useRef, useState, useCallback } from "react";
import { Play, X, ArrowLeft } from "lucide-react";
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
  contentId?: string;
  contentType?: "movie" | "episode";
}

/* ── Overlay de transição trailer → conteúdo completo ── */
const COUNTDOWN_SECS = 15;

const WatchFullOverlay = ({
  onWatch,
  onCancel,
}: {
  onWatch: () => void;
  onCancel: () => void;
}) => {
  const [countdown, setCountdown] = useState(COUNTDOWN_SECS);

  useEffect(() => {
    if (countdown <= 0) {
      return;
    }
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const progress = ((COUNTDOWN_SECS - countdown) / COUNTDOWN_SECS) * 100;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
      <div className="flex flex-col items-center gap-5 p-8 rounded-2xl bg-black/70 border border-white/10 backdrop-blur-md max-w-sm w-[90%]">
        {/* Circular countdown */}
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18" cy="18" r="16"
              fill="none" stroke="currentColor" strokeWidth="2"
              className="text-white/15"
            />
            <circle
              cx="18" cy="18" r="16"
              fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeDasharray={`${progress} 100`}
              strokeLinecap="round"
              className="text-primary transition-all duration-1000"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-white">
            {countdown}
          </span>
        </div>

        <p className="text-white/70 text-sm text-center">
          O conteúdo completo começará em breve
        </p>

        {/* Assistir Completo */}
        <button
          onClick={onWatch}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors"
        >
          <Play className="w-5 h-5 fill-current" />
          Assistir Completo
        </button>

        {/* Cancelar */}
        <button
          onClick={onCancel}
          className="text-white/50 hover:text-white text-xs transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

const FullscreenTrailerPlayer = ({
  isOpen,
  onClose,
  trailerUrl,
  embedUrl,
  contentUrl,
  title,
  poster,
  contentId,
  contentType = "movie",
}: FullscreenTrailerPlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeSource, setActiveSource] = useState<"trailer" | "content">("trailer");
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsInitialized(true);
      setActiveSource("trailer");
      setShowOverlay(false);
    }
  }, [isOpen, trailerUrl, embedUrl, contentUrl]);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
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
    };
  }, [isOpen, onClose]);

  const trailerSource = pickPreferredMediaUrl(trailerUrl, embedUrl);
  const resolvedContentUrl = pickPreferredMediaUrl(contentUrl);
  // Quando não há trailer separado, o "trailer" cai por fallback para o próprio stream do filme.
  // Nesse caso devemos salvar progresso desde o início (não apenas após o overlay).
  const trailerIsContent =
    !!trailerSource && !!resolvedContentUrl && trailerSource === resolvedContentUrl;
  const effectiveUrl = activeSource === "content"
    ? resolvedContentUrl
    : trailerSource;
  const youtubeId = extractYouTubeId(effectiveUrl);
  const isDirectVideo = isDirectVideoUrl(effectiveUrl);
  const canWatchFullContent = isDirectVideoUrl(contentUrl);

  const handleTrailerEnded = useCallback(() => {
    if (canWatchFullContent && activeSource === "trailer" && !trailerIsContent) {
      setShowOverlay(true);
    }
  }, [canWatchFullContent, activeSource, trailerIsContent]);

  const handleWatchFull = useCallback(() => {
    setShowOverlay(false);
    setActiveSource("content");
  }, []);

  const handleCancelOverlay = useCallback(() => {
    setShowOverlay(false);
  }, []);

  if (!isOpen || !effectiveUrl) return null;

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
              contentType={contentType}
              contentId={activeSource === "content" || trailerIsContent ? contentId : undefined}
              contentName={title}
              contentCoverUrl={poster || undefined}
              onBack={onClose}
              onEnded={handleTrailerEnded}
            />
          ) : youtubeId ? (
            <>
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=0&controls=1&rel=0&modestbranding=1`}
                className="w-full h-full"
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
                title={title}
              />
              <button
                onClick={onClose}
                aria-label="Voltar"
                className="absolute top-4 left-4 z-[10000] w-11 h-11 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white transition-colors"
              >
                <ArrowLeft className="w-6 h-6" strokeWidth={2.5} />
              </button>
            </>
          ) : (
            <>
              <iframe
                src={effectiveUrl}
                className="w-full h-full"
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
                sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
                referrerPolicy="no-referrer"
                title={title}
              />
              <button
                onClick={onClose}
                aria-label="Voltar"
                className="absolute top-4 left-4 z-[10000] w-11 h-11 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white transition-colors"
              >
                <ArrowLeft className="w-6 h-6" strokeWidth={2.5} />
              </button>
            </>
          )}

          {/* Overlay de transição para conteúdo completo */}
          {showOverlay && canWatchFullContent && (
            <WatchFullOverlay
              onWatch={handleWatchFull}
              onCancel={handleCancelOverlay}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default FullscreenTrailerPlayer;
