import { useState, useEffect, useRef, useCallback } from "react";
import Hls from "hls.js";
import { Loader2 } from "lucide-react";
import { MobilePlayerOverlay } from "./MobilePlayerOverlay";
import { AutoPlayOverlay } from "./AutoPlayOverlay";
import { CourseLesson } from "@/hooks/useCourses";
import EmbedPlayer from "@/components/EmbedPlayer";

interface MobileLessonPlayerProps {
  lesson: CourseLesson;
  courseName: string;
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

const hasValidStreamUrls = (urls: string[]): boolean => {
  return urls.some(
    (url) => url && url.trim() !== "" && url !== "placeholder" && url.endsWith(".m3u8")
  );
};

export const MobileLessonPlayer = ({
  lesson,
  courseName,
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
}: MobileLessonPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastSavedTimeRef = useRef<number>(0);
  const hasSetInitialTime = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [showAutoPlay, setShowAutoPlay] = useState(false);

  const streamUrls = lesson.streamUrls || [];
  const currentUrl = streamUrls[currentUrlIndex];
  const isLive = !isFinite(duration) || duration === 0;
  const progressPercent = isLive ? 0 : (currentTime / duration) * 100;
  const bufferedPercent = isLive ? 0 : (buffered / duration) * 100;

  // Check if we should use embed player
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

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });

      hls.loadSource(currentUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        if (initialTime > 0 && !hasSetInitialTime.current) {
          video.currentTime = initialTime;
          hasSetInitialTime.current = true;
        }
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
        if (initialTime > 0 && !hasSetInitialTime.current) {
          video.currentTime = initialTime;
          hasSetInitialTime.current = true;
        }
        video.play().catch(() => setIsPlaying(false));
      });
      video.addEventListener("error", () => tryNextUrl());
    } else {
      setError("Seu navegador não suporta HLS");
      setIsLoading(false);
    }
  }, [currentUrl, tryNextUrl, initialTime, useEmbed]);

  useEffect(() => {
    setCurrentUrlIndex(0);
    hasSetInitialTime.current = false;
  }, [lesson.id]);

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

  const handleInteraction = () => {
    setShowControls(true);
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }
    hideControlsTimeout.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 4000);
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await container.requestFullscreen();
        // Try to lock to landscape on supported devices
        try {
          await (screen.orientation as any).lock?.("landscape");
        } catch {
          // Ignore - not supported on iOS
        }
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

  // For embed, show a simplified version
  if (useEmbed) {
    return (
      <div ref={containerRef} className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="flex-1 relative">
          <EmbedPlayer embedUrl={lesson.embedUrl!} />
        </div>
        {/* Simple bottom bar for embed */}
        <div className="bg-black/90 p-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-white text-sm"
          >
            ← Voltar
          </button>
          <span className="text-white text-sm font-medium truncate mx-4 flex-1 text-center">
            {lesson.title}
          </span>
          <button
            onClick={onNext}
            disabled={!hasNext}
            className={`text-sm ${hasNext ? "text-primary" : "text-white/30"}`}
          >
            Próxima →
          </button>
        </div>
      </div>
    );
  }

  // No valid stream
  if (!useVideoPlayer) {
    return (
      <div ref={containerRef} className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/70">URL do vídeo não configurada</p>
          <button onClick={onBack} className="mt-4 text-primary">
            ← Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black z-50"
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        muted
        autoPlay
      />

      {/* Loading */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-40">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
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
              className="mt-4 px-4 py-2 bg-white/10 rounded text-white"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      <MobilePlayerOverlay
        lessonTitle={lesson.title}
        courseName={courseName}
        isPlaying={isPlaying}
        isLive={isLive}
        isMuted={isMuted}
        currentTime={currentTime}
        duration={duration}
        bufferedPercent={bufferedPercent}
        progressPercent={progressPercent}
        hasNext={hasNext}
        isCompleted={isCompleted}
        visible={showControls || !isPlaying}
        onTogglePlay={togglePlay}
        onToggleMute={toggleMute}
        onSeek={handleSeek}
        onSkipForward={skipForward}
        onSkipBackward={skipBackward}
        onNext={onNext}
        onComplete={onComplete}
        onBack={onBack}
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
