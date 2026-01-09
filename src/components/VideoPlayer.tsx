import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import { Play, Pause, Loader2, Volume2, VolumeX, Volume1 } from "lucide-react";

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
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);
  const hideVolumeTimeout = useRef<NodeJS.Timeout | null>(null);

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
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };
    const handleDurationChange = () => {
      setDuration(video.duration);
    };
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("durationchange", handleDurationChange);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("durationchange", handleDurationChange);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
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

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    if (newVolume === 0) {
      video.muted = true;
      setIsMuted(true);
    } else if (video.muted) {
      video.muted = false;
      setIsMuted(false);
    }
  };

  const handleVolumeAreaEnter = () => {
    setShowVolumeSlider(true);
    if (hideVolumeTimeout.current) {
      clearTimeout(hideVolumeTimeout.current);
    }
  };

  const handleVolumeAreaLeave = () => {
    hideVolumeTimeout.current = setTimeout(() => {
      setShowVolumeSlider(false);
    }, 1000);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !isFinite(duration) || duration === 0) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    video.currentTime = percent * duration;
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

  const formatTime = (time: number) => {
    if (!isFinite(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return VolumeX;
    if (volume < 0.5) return Volume1;
    return Volume2;
  };

  const VolumeIcon = getVolumeIcon();

  // Check if it's a live stream (no finite duration)
  const isLive = !isFinite(duration) || duration === 0;

  // Limit options to max 2 for mobile
  const displayedUrls = streamUrls.slice(0, 2);

  const progressPercent = isLive ? 0 : (currentTime / duration) * 100;
  const bufferedPercent = isLive ? 0 : (buffered / duration) * 100;

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

      {/* Bottom Controls Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-20 transition-opacity duration-300 ${
          showControls || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Progress Bar - Only show for non-live content */}
        {!isLive && (
          <div
            className="w-full h-6 flex items-center px-4 cursor-pointer group/progress"
            onClick={handleSeek}
          >
            <div className="relative w-full h-1 bg-white/20 rounded-full overflow-hidden group-hover/progress:h-2 transition-all">
              {/* Buffered */}
              <div
                className="absolute top-0 left-0 h-full bg-white/40 rounded-full"
                style={{ width: `${bufferedPercent}%` }}
              />
              {/* Progress */}
              <div
                className="absolute top-0 left-0 h-full bg-primary rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Controls Row */}
        <div className="flex items-center justify-between px-4 pb-4">
          {/* Time Display */}
          <div className="text-foreground text-sm font-medium">
            {isLive ? (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                AO VIVO
              </span>
            ) : (
              <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
            )}
          </div>

          {/* Volume Control */}
          <div
            className="flex items-center gap-2"
            onMouseEnter={handleVolumeAreaEnter}
            onMouseLeave={handleVolumeAreaLeave}
          >
            {/* Volume Slider */}
            <div
              className={`flex items-center overflow-hidden transition-all duration-300 ${
                showVolumeSlider ? "w-24 opacity-100" : "w-0 opacity-0"
              }`}
            >
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Volume Button */}
            <button
              onClick={toggleMute}
              className="w-12 h-12 rounded-full glass flex items-center justify-center hover:scale-110 transition-transform duration-200"
              aria-label={isMuted ? "Ativar som" : "Mutar"}
            >
              <VolumeIcon className="w-6 h-6 text-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-player-overlay/80 to-transparent pointer-events-none" />
    </div>
  );
};

export default VideoPlayer;
