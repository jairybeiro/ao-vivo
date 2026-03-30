import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { StreamPlayer } from "@/sdk/StreamPlayerSDK";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<StreamPlayer | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isOpen || !trailerUrl || !containerRef.current) return;

    // Initialize the StreamPlayer SDK
    const initPlayer = async () => {
      try {
        // Create a player container
        const playerContainer = document.createElement("div");
        playerContainer.id = "stream-player-container";
        playerContainer.style.cssText = "width:100%;height:100%;";
        containerRef.current!.appendChild(playerContainer);

        // Initialize StreamPlayer
        const player = new StreamPlayer({
          container: playerContainer,
          source: trailerUrl,
          autoplay: true,
          title: title,
          debug: false,
          onPlay: () => console.log("Player: Playing"),
          onError: (error) => console.error("Player Error:", error),
          onBuffer: () => console.log("Player: Buffering"),
        });

        await player.init();
        playerRef.current = player;
        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize StreamPlayer:", error);
      }
    };

    initPlayer();

    return () => {
      // Cleanup
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      setIsInitialized(false);
    };
  }, [isOpen, trailerUrl, title]);

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

      {/* Player Container - Will be populated by StreamPlayer SDK */}
      <div
        id="stream-player-container"
        className="w-full h-full"
        style={{
          backgroundColor: "#000",
        }}
      />
    </div>
  );
};

export default FullscreenTrailerPlayer;
