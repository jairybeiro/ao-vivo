import { useEffect, useRef, useState } from "react";
import { X, Maximize2 } from "lucide-react";
import HlsAutoplayVideo from "@/components/HlsAutoplayVideo";

interface FullscreenTrailerPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  trailerUrl: string | null;
  title: string;
}

const FullscreenTrailerPlayer = ({
  isOpen,
  onClose,
  trailerUrl,
  title,
}: FullscreenTrailerPlayerProps) => {
  const [isFullscreen, setIsFullscreen] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && isFullscreen && containerRef.current) {
      containerRef.current.requestFullscreen().catch(() => {
        // Fullscreen request failed, continue anyway
      });
    }
  }, [isOpen, isFullscreen]);

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

  const isYouTube = trailerUrl.includes("youtube") || trailerUrl.includes("youtu.be");
  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

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

      {/* Player Container */}
      <div className="w-full h-full flex items-center justify-center bg-black">
        {isYouTube ? (
          // YouTube Player
          <iframe
            src={`https://www.youtube.com/embed/${getYouTubeId(trailerUrl)}?autoplay=1&controls=1&modestbranding=1&fs=1`}
            className="w-full h-full"
            allow="autoplay; fullscreen"
            allowFullScreen
          />
        ) : (
          // MP4 / M3U8 Player
          <div className="w-full h-full flex items-center justify-center">
            <HlsAutoplayVideo
              src={trailerUrl}
              className="w-full h-full object-contain"
              showControls={true}
            />
          </div>
        )}
      </div>

      {/* Title Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 z-40">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
      </div>
    </div>
  );
};

export default FullscreenTrailerPlayer;
