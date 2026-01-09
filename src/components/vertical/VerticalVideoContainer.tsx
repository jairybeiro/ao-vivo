import { useState, useCallback, useEffect } from "react";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { VerticalVideoPlayer } from "./VerticalVideoPlayer";

interface VideoItem {
  id: string;
  title: string;
  description?: string;
  streamUrls: string[];
  embedUrl?: string;
}

interface VerticalVideoContainerProps {
  videos: VideoItem[];
  initialIndex?: number;
  onClose: () => void;
}

export const VerticalVideoContainer = ({
  videos,
  initialIndex = 0,
  onClose,
}: VerticalVideoContainerProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goToNext = useCallback(() => {
    if (currentIndex < videos.length - 1 && !isTransitioning) {
      setIsTransitioning(true);
      setCurrentIndex((prev) => prev + 1);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  }, [currentIndex, videos.length, isTransitioning]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0 && !isTransitioning) {
      setIsTransitioning(true);
      setCurrentIndex((prev) => prev - 1);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  }, [currentIndex, isTransitioning]);

  const swipeHandlers = useSwipeGesture({
    onSwipeUp: goToNext,
    onSwipeDown: goToPrevious,
    threshold: 80,
  });

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "j") {
        goToNext();
      } else if (e.key === "ArrowUp" || e.key === "k") {
        goToPrevious();
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNext, goToPrevious, onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (videos.length === 0) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <p className="text-white">Nenhum vídeo disponível</p>
      </div>
    );
  }

  const currentVideo = videos[currentIndex];

  return (
    <div
      className="fixed inset-0 bg-black z-50"
      {...swipeHandlers}
    >
      {/* Progress indicators */}
      <div
        className="absolute top-2 left-2 right-2 flex gap-1 z-30"
        style={{ marginTop: "env(safe-area-inset-top)" }}
      >
        {videos.map((_, index) => (
          <div
            key={index}
            className={`flex-1 h-1 rounded-full transition-colors duration-200 ${
              index === currentIndex
                ? "bg-white"
                : index < currentIndex
                ? "bg-white/60"
                : "bg-white/30"
            }`}
          />
        ))}
      </div>

      {/* Video */}
      <div
        className={`w-full h-full transition-transform duration-300 ${
          isTransitioning ? "scale-95 opacity-80" : "scale-100 opacity-100"
        }`}
      >
        <VerticalVideoPlayer
          key={currentVideo.id}
          streamUrls={currentVideo.streamUrls}
          embedUrl={currentVideo.embedUrl}
          title={currentVideo.title}
          description={currentVideo.description}
          isActive={true}
          hasNext={currentIndex < videos.length - 1}
          hasPrevious={currentIndex > 0}
          onNext={goToNext}
          onPrevious={goToPrevious}
          onClose={onClose}
        />
      </div>

      {/* Counter */}
      <div
        className="absolute top-4 right-4 bg-black/50 px-3 py-1 rounded-full text-white text-sm z-30"
        style={{ marginTop: "env(safe-area-inset-top)" }}
      >
        {currentIndex + 1} / {videos.length}
      </div>
    </div>
  );
};
