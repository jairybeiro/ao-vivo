import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import VodPlayer from "@/components/VodPlayer";

interface FullscreenTrailerPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  trailerUrl: string | null;
  title: string;
  poster?: string;
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:v=|\/embed\/|youtu\.be\/)([^&?#]+)/);
  return match ? match[1] : null;
}

const FullscreenTrailerPlayer = ({
  isOpen,
  onClose,
  trailerUrl,
  title,
  poster,
}: FullscreenTrailerPlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsInitialized(true);
    }
  }, [isOpen]);

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

  if (!isOpen || !trailerUrl) return null;

  const youtubeId = extractYouTubeId(trailerUrl);
  const isDirectVideo = !youtubeId && /\.(mp4|m3u8|m3u)/i.test(trailerUrl);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white transition-colors"
        title="Fechar (ESC)"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Player */}
      {isInitialized && (
        <div className="w-full h-full">
          {isDirectVideo ? (
            <VodPlayer
              src={trailerUrl}
              title={title}
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
              src={trailerUrl}
              className="w-full h-full"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-presentation"
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
