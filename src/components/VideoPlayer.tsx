import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Hls from "hls.js";
import { Play, Pause, Loader2, Volume2, VolumeX, Volume1, RotateCcw, RotateCw } from "lucide-react";
import { toProxyStreamUrl } from "@/lib/streamProxy";

interface VideoPlayerProps {
  streamUrls: string[];
  channelName?: string;
  onEnded?: () => void;
  initialTime?: number;
  onTimeUpdate?: (currentTime: number) => void;
  isVertical?: boolean;
  onAspectRatioDetected?: (isVertical: boolean) => void;
}

const VideoPlayer = ({
  streamUrls,
  channelName = "Canal",
  onEnded,
  initialTime = 0,
  onTimeUpdate,
  isVertical = false,
  onAspectRatioDetected
}: VideoPlayerProps) => {
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
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const hideControlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideVolumeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedTimeRef = useRef<number>(0);
  const hasSetInitialTime = useRef(false);

  const proxiedStreamUrls = useMemo(
    () => streamUrls.map((url) => toProxyStreamUrl(url)),
    [streamUrls]
  );
  const currentUrl = proxiedStreamUrls[currentUrlIndex];

  const tryNextUrl = useCallback(() => {
    if (currentUrlIndex < proxiedStreamUrls.length - 1) {
      setCurrentUrlIndex((prev) => prev + 1);
      setError(null);
    } else {
      setError("Nenhuma opção disponível");
    }
  }, [currentUrlIndex, proxiedStreamUrls.length]);

  const initPlayer = useCallback(() => {
    // Reset aspect ratio detection on new video load
    hasSetInitialTime.current = false;
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
        // Set initial time if provided and not already set
        if (initialTime > 0 && !hasSetInitialTime.current) {
          video.currentTime = initialTime;
          hasSetInitialTime.current = true;
        }
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
      // Native HLS support (Safari/iOS)
      video.src = currentUrl;
      
      const handleNativeLoaded = () => {
        setIsLoading(false);
        // Set initial time if provided and not already set
        if (initialTime > 0 && !hasSetInitialTime.current) {
          video.currentTime = initialTime;
          hasSetInitialTime.current = true;
        }
        // Detect aspect ratio for Safari/iOS
        if (video.videoWidth && video.videoHeight) {
          const aspectRatio = video.videoWidth / video.videoHeight;
          const isVerticalVideo = aspectRatio < 1;
          onAspectRatioDetected?.(isVerticalVideo);
        }
        video.play().catch(() => {
          setIsPlaying(false);
        });
      };
      
      // Use multiple events for Safari/iOS compatibility
      video.addEventListener("loadedmetadata", handleNativeLoaded);
      video.addEventListener("canplay", () => {
        // Fallback: try detecting again when video can play
        if (video.videoWidth && video.videoHeight) {
          const aspectRatio = video.videoWidth / video.videoHeight;
          const isVerticalVideo = aspectRatio < 1;
          onAspectRatioDetected?.(isVerticalVideo);
        }
      });
      video.addEventListener("error", () => {
        tryNextUrl();
      });
    } else {
      setError("Seu navegador não suporta HLS");
      setIsLoading(false);
    }
  }, [currentUrl, tryNextUrl, initialTime, onAspectRatioDetected]);

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
      // Call onTimeUpdate every 5 seconds to save progress
      if (onTimeUpdate && Math.abs(video.currentTime - lastSavedTimeRef.current) >= 5) {
        lastSavedTimeRef.current = video.currentTime;
        onTimeUpdate(video.currentTime);
      }
    };
    const handleDurationChange = () => {
      setDuration(video.duration);
    };
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      detectAspectRatio();
    };
    
    // Fallback for Safari/iOS which may not have dimensions ready at loadedmetadata
    const handleLoadedData = () => {
      detectAspectRatio();
    };
    
    const detectAspectRatio = () => {
      if (video.videoWidth && video.videoHeight) {
        const aspectRatio = video.videoWidth / video.videoHeight;
        const isVerticalVideo = aspectRatio < 1; // Width less than height = vertical
        onAspectRatioDetected?.(isVerticalVideo);
      }
    };

    const handleEnded = () => {
      onEnded?.();
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("durationchange", handleDurationChange);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("durationchange", handleDurationChange);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("ended", handleEnded);
    };
  }, [onEnded, onAspectRatioDetected]);

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

  const skipForward = () => {
    const video = videoRef.current;
    if (!video || isLive) return;
    video.currentTime = Math.min(video.currentTime + 10, duration);
  };

  const skipBackward = () => {
    const video = videoRef.current;
    if (!video || isLive) return;
    video.currentTime = Math.max(video.currentTime - 10, 0);
  };

  const changePlaybackRate = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
  };

  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

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
      className={`relative w-full bg-player-overlay rounded-lg lg:rounded-lg overflow-hidden group ${
        isVertical ? 'aspect-[9/16] max-h-[80vh] mx-auto' : 'aspect-video'
      }`}
      onMouseMove={handleInteraction}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleInteraction}
    >
      <video
        ref={videoRef}
        className={`w-full h-full ${isVertical ? 'object-cover' : 'object-contain'}`}
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
        className={`absolute inset-0 flex items-center justify-center gap-8 transition-opacity duration-300 ${
          showControls || !isPlaying ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Skip Backward - Only for non-live */}
        {!isLive && (
          <button
            onClick={skipBackward}
            className="w-14 h-14 rounded-full glass flex items-center justify-center hover:scale-110 transition-transform duration-200"
            aria-label="Retroceder 10 segundos"
          >
            <div className="relative">
              <RotateCcw className="w-7 h-7 text-foreground" />
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground mt-0.5">10</span>
            </div>
          </button>
        )}

        {/* Play/Pause */}
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

        {/* Skip Forward - Only for non-live */}
        {!isLive && (
          <button
            onClick={skipForward}
            className="w-14 h-14 rounded-full glass flex items-center justify-center hover:scale-110 transition-transform duration-200"
            aria-label="Avançar 10 segundos"
          >
            <div className="relative">
              <RotateCw className="w-7 h-7 text-foreground" />
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground mt-0.5">10</span>
            </div>
          </button>
        )}
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

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Playback Speed - Only for non-live */}
            {!isLive && (
              <div className="relative">
                <button
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                  className="h-10 px-3 rounded-full glass flex items-center justify-center hover:scale-105 transition-transform duration-200 text-foreground text-sm font-medium"
                  aria-label="Velocidade de reprodução"
                >
                  {playbackRate}x
                </button>
                
                {showSpeedMenu && (
                  <div className="absolute bottom-12 right-0 glass rounded-lg py-2 min-w-[80px]">
                    {speedOptions.map((speed) => (
                      <button
                        key={speed}
                        onClick={() => changePlaybackRate(speed)}
                        className={`w-full px-4 py-2 text-sm text-left hover:bg-white/10 transition-colors ${
                          playbackRate === speed ? "text-primary font-medium" : "text-foreground"
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

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
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-player-overlay/80 to-transparent pointer-events-none" />
    </div>
  );
};

export default VideoPlayer;
