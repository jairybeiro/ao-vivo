import { useState, useEffect, useRef, useCallback } from "react";
import Hls from "hls.js";
import { Loader2 } from "lucide-react";
import { DesktopPlayerOverlay } from "./DesktopPlayerOverlay";
import { AutoPlayOverlay } from "./AutoPlayOverlay";
import { CourseLesson } from "@/hooks/useCourses";
import EmbedPlayer from "@/components/EmbedPlayer";
import { ArrowLeft, SkipForward } from "lucide-react";

interface DesktopLessonPlayerProps {
  lesson: CourseLesson;
  courseName: string;
  moduleName?: string;
  isCompleted: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
  nextLessonTitle?: string;
  initialTime?: number;
  onComplete: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  onBack: () => void;
}

import { hasValidStreamUrls } from "@/lib/hlsUtils";

export const DesktopLessonPlayer = ({
  lesson,
  courseName,
  moduleName,
  isCompleted,
  hasNext,
  hasPrevious,
  nextLessonTitle,
  initialTime = 0,
  onComplete,
  onNext,
  onPrevious,
  onTimeUpdate,
  onBack,
}: DesktopLessonPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastSavedTimeRef = useRef<number>(0);
  const hasSetInitialTime = useRef(false);
  const initialTimeRef = useRef<number>(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showAutoPlay, setShowAutoPlay] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const streamUrls = lesson.streamUrls || [];
  const currentUrl = streamUrls[currentUrlIndex];
  const isLive = !isFinite(duration) || duration === 0;
  const progressPercent = isLive ? 0 : (currentTime / duration) * 100;
  const bufferedPercent = isLive ? 0 : (buffered / duration) * 100;

  const useEmbed = lesson.embedUrl && lesson.embedUrl.trim() !== "";
  const useVideoPlayer = !useEmbed && hasValidStreamUrls(streamUrls);

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
    if (!video || !currentUrl || useEmbed) return;

    setIsLoading(true);
    setError(null);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const seekToInitialTimeIfNeeded = () => {
      const t = initialTimeRef.current;
      if (t > 0 && !hasSetInitialTime.current) {
        video.currentTime = t;
        hasSetInitialTime.current = true;
        lastSavedTimeRef.current = t;
      }
    };

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        maxBufferSize: 60 * 1000 * 1000,
        maxBufferHole: 0.5,
        highBufferWatchdogPeriod: 2,
        startLevel: -1,
        abrEwmaDefaultEstimate: 500000,
        backBufferLength: 30,
      });

      hls.loadSource(currentUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        seekToInitialTimeIfNeeded();
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
        seekToInitialTimeIfNeeded();
        video.play().catch(() => setIsPlaying(false));
      });
      video.addEventListener("error", () => tryNextUrl());
    } else {
      setError("Seu navegador não suporta HLS");
      setIsLoading(false);
    }
  }, [currentUrl, tryNextUrl, useEmbed]);

  useEffect(() => {
    setCurrentUrlIndex(0);
    hasSetInitialTime.current = false;
    initialTimeRef.current = initialTime;
    lastSavedTimeRef.current = initialTime;
  }, [lesson.id, initialTime]);

  useEffect(() => {
    if (useVideoPlayer) {
      initPlayer();
    }
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [initPlayer, useVideoPlayer]);

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
      if (onTimeUpdate && Math.abs(video.currentTime - lastSavedTimeRef.current) >= 5) {
        lastSavedTimeRef.current = video.currentTime;
        onTimeUpdate(video.currentTime);
      }
    };
    const handleDurationChange = () => setDuration(video.duration);
    const handleLoadedMetadata = () => setDuration(video.duration);
    const handleEnded = () => {
      if (hasNext) {
        setShowAutoPlay(true);
      }
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("durationchange", handleDurationChange);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("durationchange", handleDurationChange);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("ended", handleEnded);
    };
  }, [onTimeUpdate, hasNext]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
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

  const handleVolumeChange = (newVolume: number) => {
    const video = videoRef.current;
    if (!video) return;
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

  const handleSeek = (percent: number) => {
    const video = videoRef.current;
    if (!video || !isFinite(duration) || duration === 0) return;
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

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await container.requestFullscreen();
      }
    } catch (err) {
      console.log("Fullscreen error:", err);
    }
  };

  const handleAutoPlayContinue = useCallback(() => {
    setShowAutoPlay(false);
    if (!isCompleted) {
      onComplete();
    }
    onNext();
  }, [isCompleted, onComplete, onNext]);

  const handleAutoPlayCancel = useCallback(() => {
    setShowAutoPlay(false);
  }, []);

  // For embed, show a simplified version with overlay controls
  if (useEmbed) {
    return (
      <div ref={containerRef} className="relative w-full h-full bg-black">
        <EmbedPlayer embedUrl={lesson.embedUrl!} />
        {/* Simple overlay for embed */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between">
            <button onClick={onBack} className="text-white hover:text-white/80 flex items-center gap-2">
              <ArrowLeft className="w-5 h-5" />
              Voltar
            </button>
            <span className="text-white font-medium truncate mx-4">{lesson.title}</span>
            <button
              onClick={onNext}
              disabled={!hasNext}
              className={`flex items-center gap-2 ${hasNext ? "text-white hover:text-white/80" : "text-white/30"}`}
            >
              Próxima
              <SkipForward className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No valid stream
  if (!useVideoPlayer) {
    return (
      <div ref={containerRef} className="relative w-full h-full bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/70">URL do vídeo não configurada</p>
          <button onClick={onBack} className="mt-4 text-primary hover:underline">
            ← Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black"
      onMouseMove={handleInteraction}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        muted
        autoPlay
        onClick={togglePlay}
      />

      {/* Loading */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-40">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-40">
          <div className="text-center">
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => {
                setCurrentUrlIndex(0);
                setError(null);
              }}
              className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded text-white transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      <DesktopPlayerOverlay
        lessonTitle={lesson.title}
        courseName={courseName}
        moduleName={moduleName}
        isPlaying={isPlaying}
        isLive={isLive}
        isMuted={isMuted}
        volume={volume}
        currentTime={currentTime}
        duration={duration}
        bufferedPercent={bufferedPercent}
        progressPercent={progressPercent}
        playbackRate={playbackRate}
        hasNext={hasNext}
        hasPrevious={hasPrevious}
        isCompleted={isCompleted}
        isFullscreen={isFullscreen}
        visible={showControls || !isPlaying}
        onTogglePlay={togglePlay}
        onToggleMute={toggleMute}
        onVolumeChange={handleVolumeChange}
        onSeek={handleSeek}
        onSkipForward={skipForward}
        onSkipBackward={skipBackward}
        onNext={onNext}
        onPrevious={onPrevious}
        onComplete={onComplete}
        onBack={onBack}
        onToggleFullscreen={toggleFullscreen}
        onChangePlaybackRate={changePlaybackRate}
      />

      {/* Auto-play overlay */}
      {showAutoPlay && hasNext && nextLessonTitle && (
        <AutoPlayOverlay
          nextLessonTitle={nextLessonTitle}
          countdownSeconds={10}
          onContinue={handleAutoPlayContinue}
          onCancel={handleAutoPlayCancel}
        />
      )}
    </div>
  );
};
