import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import { Play, Pause, Loader2, Volume2, VolumeX } from "lucide-react";

interface VideoPlayerProps {
  streamUrls: string[];
  channelName?: string;
}

const VideoPlayer = ({ streamUrls, channelName = "Canal" }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);

  const currentUrl = streamUrls[currentUrlIndex];

  const tryNextUrl = useCallback(() => {
    if (currentUrlIndex < streamUrls.length - 1) {
      setCurrentUrlIndex((prev) => prev + 1);
      setError(null);
    } else {
      setError("Nenhuma opção disponível");
    }
  }, [currentUrlIndex, streamUrls.length]);

  const initPlayer = useCallback(() => {
    const video = videoRef.current;
    if (!video || !currentUrl) return;

    setIsLoading(true);
    setError(null);

    // Clean up previous instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });

      hls.loadSource(currentUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        video.play().catch(() => {
          setIsPlaying(false);
        });
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          tryNextUrl();
        }
      });

      hlsRef.current = hls;
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS support (Safari)
      video.src = currentUrl;
      video.addEventListener("loadedmetadata", () => {
        setIsLoading(false);
        video.play().catch(() => {
          setIsPlaying(false);
        });
      });
      video.addEventListener("error", () => {
        tryNextUrl();
      });
    } else {
      setError("Seu navegador não suporta HLS");
      setIsLoading(false);
    }
  }, [currentUrl, tryNextUrl]);

  useEffect(() => {
    setCurrentUrlIndex(0);
  }, [streamUrls]);

  useEffect(() => {
    initPlayer();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [initPlayer]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => setIsLoading(false);

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("playing", handlePlaying);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("playing", handlePlaying);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const selectOption = (index: number) => {
    if (index !== currentUrlIndex) {
      setCurrentUrlIndex(index);
    }
  };

  const handleInteraction = () => {
    setShowControls(true);
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }
    hideControlsTimeout.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const handleMouseLeave = () => {
    if (isPlaying) {
      setShowControls(false);
    }
  };

  // Limit options to max 2 for mobile
  const displayedUrls = streamUrls.slice(0, 2);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-player-overlay rounded-lg lg:rounded-lg overflow-hidden group"
      onMouseMove={handleInteraction}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleInteraction}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        muted
        autoPlay
        onClick={togglePlay}
      />

      {/* Stream Options - Show on interaction only */}
      <div
        className={`absolute top-4 right-4 z-20 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {displayedUrls.length > 1 && (
          <div className="glass px-2 py-1 rounded-lg flex gap-1">
            {displayedUrls.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  selectOption(index);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  currentUrlIndex === index
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-white/10"
                }`}
              >
                Opção {index + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-player-overlay/80 z-30">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-player-overlay/90 z-30">
          <div className="text-center">
            <p className="text-destructive text-lg font-medium">{error}</p>
            <button
              onClick={() => {
                setCurrentUrlIndex(0);
                setError(null);
              }}
              className="mt-4 px-6 py-2 glass rounded-lg text-foreground hover:bg-glass/60 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      {/* Play/Pause Controls */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
          showControls || !isPlaying ? "opacity-100" : "opacity-0"
        }`}
      >
        <button
          onClick={togglePlay}
          className="w-20 h-20 rounded-full glass flex items-center justify-center hover:scale-110 transition-transform duration-200"
          aria-label={isPlaying ? "Pausar" : "Reproduzir"}
        >
          {isPlaying ? (
            <Pause className="w-10 h-10 text-foreground" />
          ) : (
            <Play className="w-10 h-10 text-foreground ml-1" />
          )}
        </button>
      </div>

      {/* Mute/Unmute Button */}
      <div
        className={`absolute bottom-4 right-4 z-20 transition-opacity duration-300 ${
          showControls || !isPlaying ? "opacity-100" : "opacity-0"
        }`}
      >
        <button
          onClick={toggleMute}
          className="w-12 h-12 rounded-full glass flex items-center justify-center hover:scale-110 transition-transform duration-200"
          aria-label={isMuted ? "Ativar som" : "Mutar"}
        >
          {isMuted ? (
            <VolumeX className="w-6 h-6 text-foreground" />
          ) : (
            <Volume2 className="w-6 h-6 text-foreground" />
          )}
        </button>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-player-overlay/80 to-transparent pointer-events-none" />
    </div>
  );
};

export default VideoPlayer;
