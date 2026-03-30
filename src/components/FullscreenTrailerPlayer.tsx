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

      {/* VodPlayer Container */}
      {isInitialized && (
        <div className="w-full h-full">
          <VodPlayer
            src={trailerUrl}
            title={title}
            poster={poster || undefined}
            contentType="movie"
            onBack={onClose}
          />
        </div>
      )}
    </div>
  );
};

export default FullscreenTrailerPlayer;
