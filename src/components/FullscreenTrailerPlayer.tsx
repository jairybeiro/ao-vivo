import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
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

  useEffect(() => {
    if (isOpen) {
      setIsInitialized(true);
      setActiveSource("trailer");
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
    };
  }, [isOpen, onClose]);

  const trailerSource = pickPreferredMediaUrl(trailerUrl, embedUrl);
  const effectiveUrl = activeSource === "content"
    ? pickPreferredMediaUrl(contentUrl)
    : trailerSource;
  const youtubeId = extractYouTubeId(effectiveUrl);
  const isDirectVideo = isDirectVideoUrl(effectiveUrl);
  const canWatchFullContent = activeSource !== "content" && isDirectVideoUrl(contentUrl);

  if (!isOpen || !effectiveUrl) return null;

  // "Conteúdo completo" button rendered inline in player controls
  const fullContentControl = canWatchFullContent ? (
    <button
      type="button"
      onClick={() => setActiveSource("content")}
      className="flex items-center gap-1.5 text-[11px] md:text-xs text-white/60 hover:text-white transition-colors ml-2"
    >
      <Play className="w-3 h-3 md:w-3.5 md:h-3.5 fill-current" />
      <span className="hidden sm:inline">Conteúdo completo</span>
    </button>
  ) : null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
    >
      {isInitialized && (
        <div className="w-full h-full">
          {isDirectVideo ? (
            <VodPlayer
              src={effectiveUrl}
              title={activeSource === "content" ? `${title} · Conteúdo Completo` : title}
              poster={poster || undefined}
              contentType="movie"
              onBack={onClose}
              extraControls={fullContentControl}
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
        </div>
      )}
    </div>
  );
};

export default FullscreenTrailerPlayer;
