import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Hls from "hls.js";
import { Play, Pause, Loader2, Volume2, VolumeX, ChevronUp, ChevronDown, X } from "lucide-react";
import { toProxyStreamUrl } from "@/lib/streamProxy";

interface VerticalVideoPlayerProps {
  streamUrls: string[];
  embedUrl?: string;
  title: string;
  description?: string;
  isActive: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
}

export const VerticalVideoPlayer = ({
  streamUrls,
  embedUrl,
  title,
  description,
  isActive,
  hasNext,
  hasPrevious,
  onNext,
  onPrevious,
  onClose,
}: VerticalVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideControlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);

  const proxiedStreamUrls = useMemo(
    () => streamUrls.map((url) => toProxyStreamUrl(url)),
    [streamUrls]
  );
  const currentUrl = proxiedStreamUrls[currentUrlIndex];
  const useEmbed = embedUrl && embedUrl.trim() !== "";

  const tryNextUrl = useCallback(() => {
    if (currentUrlIndex < proxiedStreamUrls.length - 1) {
      setCurrentUrlIndex((prev) => prev + 1);
      setError(null);
    } else {
      setError("Nenhuma opção disponível");
    }
  }, [currentUrlIndex, proxiedStreamUrls.length]);

  const initPlayer = useCallback(() => {
    const video = videoRef.current;
    if (!video || !currentUrl || useEmbed || !isActive) return;

    setIsLoading(true);
    setError(null);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      });

      hls.loadSource(currentUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        video.play().catch(() => setIsPlaying(false));
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          tryNextUrl();
        }
      });

      hlsRef.current = hls;
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = currentUrl;
      video.addEventListener("loadedmetadata", () => {
        setIsLoading(false);
        video.play().catch(() => setIsPlaying(false));
      });
      video.addEventListener("error", () => tryNextUrl());
    } else {
      setError("Seu navegador não suporta HLS");
      setIsLoading(false);
    }
  }, [currentUrl, tryNextUrl, useEmbed, isActive]);

  // Reset when video changes
  useEffect(() => {
    setCurrentUrlIndex(0);
    setError(null);
  }, [proxiedStreamUrls]);

  // Initialize player when active
  useEffect(() => {
    if (isActive && !useEmbed) {
      initPlayer();
    } else if (!isActive) {
      // Pause when not active
      const video = videoRef.current;
      if (video) {
        video.pause();
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [initPlayer, isActive, useEmbed]);

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => setIsLoading(false);
    const handleEnded = () => {
      if (hasNext) {
        onNext();
      }
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("ended", handleEnded);
    };
  }, [hasNext, onNext]);

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

  // Embed player for vertical videos
  if (useEmbed) {
    return (
      <div className="w-full h-full bg-black relative">
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allow="autoplay; fullscreen; encrypted-media"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-presentation"
        />
        {/* Overlay for navigation */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Navigation buttons */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 pointer-events-auto">
            <button
              onClick={onPrevious}
              disabled={!hasPrevious}
              className={`w-12 h-12 rounded-full bg-black/50 flex items-center justify-center ${
                hasPrevious ? "text-white" : "text-white/30"
              }`}
            >
              <ChevronUp className="w-6 h-6" />
            </button>
            <button
              onClick={onNext}
              disabled={!hasNext}
              className={`w-12 h-12 rounded-full bg-black/50 flex items-center justify-center ${
                hasNext ? "text-white" : "text-white/30"
              }`}
            >
              <ChevronDown className="w-6 h-6" />
            </button>
          </div>
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 left-6 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white pointer-events-auto"
            style={{ marginTop: "calc(env(safe-area-inset-top) + 8px)" }}
          >
            <X className="w-5 h-5" />
          </button>
          {/* Info */}
          <div className="absolute bottom-0 left-0 right-20 p-4 pointer-events-auto" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)" }}>
            <h3 className="text-white font-bold text-lg line-clamp-2">{title}</h3>
            {description && <p className="text-white/70 text-sm line-clamp-2 mt-1">{description}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full bg-black relative"
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
        autoPlay
        loop={!hasNext}
      />

      {/* Loading */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20">
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Controls Overlay */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 z-10 ${
          showControls || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70 pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-6 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white"
          style={{ marginTop: "calc(env(safe-area-inset-top) + 8px)" }}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Center play/pause */}
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={togglePlay}
            className="w-20 h-20 rounded-full bg-black/40 flex items-center justify-center"
          >
            {isPlaying ? (
              <Pause className="w-10 h-10 text-white" />
            ) : (
              <Play className="w-10 h-10 text-white ml-1" />
            )}
          </button>
        </div>

        {/* Right side controls */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4">
          {/* Volume */}
          <button
            onClick={toggleMute}
            className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center text-white"
          >
            {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          </button>
          {/* Up */}
          <button
            onClick={onPrevious}
            disabled={!hasPrevious}
            className={`w-12 h-12 rounded-full bg-black/50 flex items-center justify-center ${
              hasPrevious ? "text-white" : "text-white/30"
            }`}
          >
            <ChevronUp className="w-6 h-6" />
          </button>
          {/* Down */}
          <button
            onClick={onNext}
            disabled={!hasNext}
            className={`w-12 h-12 rounded-full bg-black/50 flex items-center justify-center ${
              hasNext ? "text-white" : "text-white/30"
            }`}
          >
            <ChevronDown className="w-6 h-6" />
          </button>
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-20 p-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)" }}>
          <h3 className="text-white font-bold text-lg line-clamp-2">{title}</h3>
          {description && <p className="text-white/70 text-sm line-clamp-2 mt-1">{description}</p>}
        </div>
      </div>
    </div>
  );
};
