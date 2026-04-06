import { useEffect, useRef, useState } from "react";
import { Play, X } from "lucide-react";
import VodPlayer from "@/components/VodPlayer";
import { Button } from "@/components/ui/button";
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
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "unset";
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


  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
    >
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        {canWatchFullContent && (
          <Button
            type="button"
            size="sm"
            onClick={() => setActiveSource("content")}
            className="rounded-full shadow-lg"
          >
            <Play className="w-4 h-4 fill-current" />
            Conteúdo completo
          </Button>
        )}

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onClose}
          className="rounded-full border-border/30 bg-background/20 text-foreground backdrop-blur-sm hover:bg-background/30"
          title="Fechar (ESC)"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {isInitialized && (
        <div className="w-full h-full">
          {isDirectVideo ? (
            <VodPlayer
              src={effectiveUrl}
              title={activeSource === "content" ? `${title} · Conteúdo Completo` : title}
              poster={poster || undefined}
              contentType="movie"
              onBack={onClose}
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
