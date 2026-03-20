import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toProxyStreamUrl } from "@/lib/streamProxy";
import { isHlsUrl } from "@/lib/hlsUtils";
import { useSaveWatchProgress, useGetWatchProgress } from "@/hooks/useWatchProgress";
import Hls from "hls.js";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  SkipForward,
  SkipBack,
  ArrowLeft,
  Loader2,
  Settings,
} from "lucide-react";

interface VodPlayerProps {
  src: string;
  title?: string;
  subtitle?: string;
  poster?: string;
  contentType?: "movie" | "episode";
  contentId?: string;
  contentName?: string;
  contentCoverUrl?: string | null;
  nextEpisode?: { title: string; onPlay: () => void } | null;
  onBack?: () => void;
  onEnded?: () => void;
  extraControls?: React.ReactNode;
  /** Episode label shown center-bottom, e.g. "House of Cards E3  Capítulo 3" */
  centerLabel?: string;
}

const VodPlayer = ({ src, title, subtitle, poster, contentType, contentId, contentName, contentCoverUrl, nextEpisode, onBack, onEnded, extraControls, centerLabel }: VodPlayerProps) => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const countdownTimer = useRef<ReturnType<typeof setInterval>>();
  const saveInterval = useRef<ReturnType<typeof setInterval>>();
  const resumedRef = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [volumeOpen, setVolumeOpen] = useState(false);
  const volumePanelRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);

  const { saveProgress } = useSaveWatchProgress();
  const { progress: savedProgress } = useGetWatchProgress(
    contentType || "movie",
    contentId
  );

  const proxiedSrc = toProxyStreamUrl(src);
  const isHls = isHlsUrl(src);

  // Save progress periodically and on unmount
  const doSave = useCallback(() => {
    const v = videoRef.current;
    if (!v || !contentType || !contentId) return;
    // Don't save while resume prompt is showing (would overwrite with time ~0)
    if (!resumedRef.current && v.currentTime < 5) return;
    saveProgress({
      contentType,
      contentId,
      currentTime: v.currentTime,
      duration: v.duration || 0,
      contentName: contentName || title || "",
      contentCoverUrl: contentCoverUrl || poster,
    });
  }, [contentType, contentId, contentName, contentCoverUrl, title, poster, saveProgress]);

  // Auto-save every 15 seconds
  useEffect(() => {
    if (contentType && contentId) {
      saveInterval.current = setInterval(() => {
        if (playing) doSave();
      }, 15000);
    }
    return () => {
      clearInterval(saveInterval.current);
      // Save on unmount
      doSave();
    };
  }, [contentType, contentId, playing, doSave]);

  // Store the resume time so it survives even if savedProgress gets overwritten
  const resumeTimeRef = useRef<number | null>(null);

  // Show resume prompt when saved progress is available
  useEffect(() => {
    if (savedProgress && savedProgress.current_time_secs > 10 && !resumedRef.current) {
      resumeTimeRef.current = savedProgress.current_time_secs;
      setShowResumePrompt(true);
      // Pause video while prompt is showing
      const v = videoRef.current;
      if (v && !v.paused) v.pause();
    }
  }, [savedProgress]);

  const handleResume = () => {
    const v = videoRef.current;
    const targetTime = resumeTimeRef.current;
    if (v && targetTime != null && targetTime > 0) {
      v.currentTime = targetTime;
    }
    resumedRef.current = true;
    setShowResumePrompt(false);
    videoRef.current?.play().catch(() => {});
  };

  const handleStartOver = () => {
    const v = videoRef.current;
    if (v) v.currentTime = 0;
    resumedRef.current = true;
    setShowResumePrompt(false);
    videoRef.current?.play().catch(() => {});
  };

  // Initialize video source
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setLoading(true);
    setError(null);
    setCountdown(null);
    resumedRef.current = false;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 60,
        maxMaxBufferLength: 120,
        startLevel: -1,
        enableWorker: true,
      });
      hls.loadSource(proxiedSrc);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) {
          setError("Erro ao carregar stream");
          setLoading(false);
        }
      });
      hlsRef.current = hls;
    } else if (isHls && video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = proxiedSrc;
      video.play().catch(() => {});
    } else {
      video.src = proxiedSrc;
      video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [proxiedSrc, isHls]);

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => { setPlaying(true); setLoading(false); };
    const onPause = () => { setPlaying(false); doSave(); };
    const onWaiting = () => setLoading(true);
    const onCanPlay = () => setLoading(false);
    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };
    const onDurationChange = () => setDuration(video.duration || 0);
    const onError = () => { setError("Erro ao reproduzir"); setLoading(false); };
    const onVolumeChange = () => { setVolume(video.volume); setMuted(video.muted); };
    const onVideoEnded = () => {
      setPlaying(false);
      doSave();
      if (nextEpisode) {
        startCountdown();
      }
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("error", onError);
    video.addEventListener("volumechange", onVolumeChange);
    video.addEventListener("ended", onVideoEnded);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("error", onError);
      video.removeEventListener("volumechange", onVolumeChange);
      video.removeEventListener("ended", onVideoEnded);
    };
  }, [nextEpisode, doSave]);

  // Auto-hide controls
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    if (playing) {
      hideTimer.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [playing]);

  useEffect(() => {
    if (!playing) {
      setShowControls(true);
      clearTimeout(hideTimer.current);
    } else {
      hideTimer.current = setTimeout(() => setShowControls(false), 3000);
    }
    return () => clearTimeout(hideTimer.current);
  }, [playing]);

  // Fullscreen listener (standard + webkit)
  useEffect(() => {
    const onFsChange = () => {
      const isFs = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
      setIsFullscreen(isFs);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
    };
  }, []);

  // Countdown for auto-play next
  const startCountdown = useCallback(() => {
    setCountdown(10);
    let count = 10;
    countdownTimer.current = setInterval(() => {
      count--;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(countdownTimer.current);
        nextEpisode?.onPlay();
      }
    }, 1000);
  }, [nextEpisode]);

  const cancelCountdown = () => {
    clearInterval(countdownTimer.current);
    setCountdown(null);
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play(); else v.pause();
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
  };

  const seek = (time: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(time, duration));
  };

  const skip = (secs: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.currentTime + secs, duration));
  };

  const changeVolume = (val: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = val;
    if (val > 0 && v.muted) v.muted = false;
  };

  const changeRate = (rate: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSettings(false);
  };

  // Close volume panel on click outside
  useEffect(() => {
    if (!volumeOpen) return;
    const handler = (e: MouseEvent) => {
      if (volumePanelRef.current && !volumePanelRef.current.contains(e.target as Node)) {
        setVolumeOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [volumeOpen]);

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container && !video) return;

    try {
      const isCurrentlyFs = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);

      if (isCurrentlyFs) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
      } else {
        // Try container first, then video (iOS Safari native)
        const el = container || video;
        if (el?.requestFullscreen) {
          await el.requestFullscreen();
        } else if ((el as any)?.webkitRequestFullscreen) {
          await (el as any).webkitRequestFullscreen();
        } else if ((video as any)?.webkitEnterFullscreen) {
          await (video as any).webkitEnterFullscreen();
        }
        // Try landscape lock
        try {
          await (screen.orientation as any).lock?.("landscape");
        } catch {
          // Not supported on iOS
        }
      }
    } catch (err) {
      console.log("Fullscreen error:", err);
    }
  };

  const formatTime = (s: number) => {
    if (!isFinite(s) || s < 0) return "0:00";
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black select-none group"
      onMouseMove={resetHideTimer}
      onTouchStart={resetHideTimer}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        poster={poster || undefined}
        playsInline
      />

      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-3">
          <p className="text-destructive text-sm">{error}</p>
          <button onClick={() => { setError(null); videoRef.current?.load(); }} className="text-white underline text-sm">
            Tentar novamente
          </button>
        </div>
      )}

      {/* Resume prompt */}
      {showResumePrompt && resumeTimeRef.current != null && (
        <div data-controls className="absolute inset-0 flex items-center justify-center bg-black/80 z-40">
          <div className="text-center space-y-4 p-6">
            <p className="text-white text-sm">Você parou em <span className="font-bold text-primary">{formatTime(resumeTimeRef.current)}</span></p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleStartOver}
                className="px-4 py-2 rounded bg-muted text-foreground text-sm hover:bg-muted/80 transition"
              >
                Começar do início
              </button>
              <button
                onClick={handleResume}
                className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm hover:opacity-90 transition flex items-center gap-1"
              >
                <Play className="w-4 h-4" /> Retomar de {formatTime(resumeTimeRef.current)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-play next countdown */}
      {countdown !== null && nextEpisode && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-30">
          <div className="text-center space-y-4">
            <p className="text-white/70 text-sm">Próximo episódio em</p>
            <div className="relative w-24 h-24 mx-auto">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" opacity="0.3" />
                <circle
                  cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--primary))" strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - countdown / 10)}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-white text-3xl font-bold">
                {countdown}
              </span>
            </div>
            <p className="text-white font-medium text-sm max-w-xs truncate">{nextEpisode.title}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={cancelCountdown}
                className="px-4 py-2 rounded bg-white/20 text-white text-sm hover:bg-white/30 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => { cancelCountdown(); nextEpisode.onPlay(); }}
                className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm hover:opacity-90 transition flex items-center gap-1"
              >
                <Play className="w-4 h-4" /> Reproduzir agora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click-to-play/pause overlay (covers the video area) */}
      <div
        className={`absolute inset-0 z-10 cursor-pointer transition-opacity duration-300 ${
          countdown !== null || showResumePrompt || error ? "pointer-events-none" : ""
        }`}
        onClick={togglePlay}
      />

      {/* Netflix-style controls overlay */}
      <div
        data-controls
        className={`absolute inset-0 z-20 transition-opacity duration-300 pointer-events-none ${
          showControls || !playing ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Top gradient + info */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 pointer-events-auto" style={{ paddingTop: `calc(env(safe-area-inset-top, 0px) + 12px)` }}>
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); doSave(); onBack ? onBack() : navigate(-1); }}
              className="text-white hover:text-primary transition p-1"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="min-w-0">
              {title && <p className="text-white font-semibold text-sm md:text-base truncate">{title}</p>}
              {subtitle && <p className="text-white/60 text-xs truncate">{subtitle}</p>}
            </div>
          </div>
        </div>

        {/* Center play button (when paused) */}
        {!playing && !loading && !error && countdown === null && !showResumePrompt && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto cursor-pointer" onClick={togglePlay}>
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>
          </div>
        )}

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-4 pb-3 pt-12 pointer-events-auto">
          {/* Progress bar */}
          <div
            className="relative h-1 hover:h-1.5 transition-all bg-white/20 rounded-full mb-3 cursor-pointer group/progress"
            onClick={(e) => {
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              seek(pct * duration);
            }}
          >
            {/* Buffered (preload) - red tint */}
            <div className="absolute h-full bg-red-600/40 rounded-full" style={{ width: `${bufferedPercent}%` }} />
            {/* Progress */}
            <div className="absolute h-full bg-red-600 rounded-full" style={{ width: `${progressPercent}%` }} />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full opacity-0 group-hover/progress:opacity-100 transition"
              style={{ left: `${progressPercent}%`, transform: `translate(-50%, -50%)` }}
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            {/* Left controls */}
            <div className="flex items-center gap-1 md:gap-2">
              <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="text-white hover:text-white/80 transition p-1.5">
                {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <button onClick={(e) => { e.stopPropagation(); skip(-10); }} className="text-white hover:text-white/80 transition p-1.5">
                <SkipBack className="w-5 h-5" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); skip(10); }} className="text-white hover:text-white/80 transition p-1.5">
                <SkipForward className="w-5 h-5" />
              </button>
              {/* Volume with vertical red slider — click-toggled */}
              <div className="relative flex items-center" ref={volumePanelRef}>
                <button onClick={(e) => { e.stopPropagation(); setVolumeOpen(v => !v); }} className="text-white hover:text-white/80 transition p-1.5">
                  {muted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 transition-opacity duration-200 ${volumeOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
                  <div className="bg-black/90 rounded-md p-2 flex flex-col items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="range"
                      min="0" max="1" step="0.05"
                      value={muted ? 0 : volume}
                      onChange={(e) => { e.stopPropagation(); changeVolume(parseFloat(e.target.value)); }}
                      onClick={(e) => e.stopPropagation()}
                      className="h-20 w-1 cursor-pointer appearance-none bg-white/30 rounded-full [writing-mode:vertical-lr] [direction:rtl] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-600 [&::-webkit-slider-runnable-track]:bg-transparent [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-red-600 [&::-moz-range-thumb]:border-0"
                    />
                    <button onClick={(e) => { e.stopPropagation(); toggleMute(); }} className="text-white/70 hover:text-white transition">
                      {muted || volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
              <span className="text-white/80 text-xs ml-1 tabular-nums hidden sm:block">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Center label - Netflix style episode name */}
            {centerLabel && (
              <div className="flex-1 flex items-center justify-center min-w-0 mx-4">
                <span className="text-white text-sm font-medium truncate">{centerLabel}</span>
              </div>
            )}

            {/* Right controls */}
            <div className="flex items-center gap-1 md:gap-2">
              {extraControls}
              {nextEpisode && (
                <button
                  onClick={(e) => { e.stopPropagation(); nextEpisode.onPlay(); }}
                  className="text-white hover:text-white/80 transition p-1.5 flex items-center gap-1 text-xs"
                >
                  <SkipForward className="w-4 h-4" />
                  <span className="hidden sm:inline">Próximo</span>
                </button>
              )}
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
                  className="text-white hover:text-white/80 transition p-1.5 text-xs"
                >
                  {playbackRate !== 1 ? `${playbackRate}x` : <Settings className="w-5 h-5" />}
                </button>
                {showSettings && (
                  <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg p-2 space-y-0.5 min-w-[80px]" onClick={(e) => e.stopPropagation()}>
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map(r => (
                      <button
                        key={r}
                        onClick={() => changeRate(r)}
                        className={`block w-full text-left px-3 py-1.5 text-xs rounded transition ${
                          playbackRate === r ? "bg-red-600 text-white" : "text-white hover:bg-white/10"
                        }`}
                      >
                        {r}x
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }} className="text-white hover:text-white/80 transition p-1.5">
                <Maximize className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VodPlayer;
