import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toProxyStreamUrl } from "@/lib/streamProxy";
import { isHlsUrl } from "@/lib/hlsUtils";
import { useSaveWatchProgress, useGetWatchProgress } from "@/hooks/useWatchProgress";
import { NetflixLoader } from "@/components/NetflixLoader";
import Hls from "hls.js";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  Maximize,
  Minimize,
  SkipForward,
  ArrowLeft,
  RotateCcw,
  RotateCw,
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
  centerLabel?: string;
  overlayContent?: React.ReactNode;
}

const VodPlayer = ({ src, title, subtitle, poster, contentType, contentId, contentName, contentCoverUrl, nextEpisode, onBack, onEnded, extraControls, centerLabel, overlayContent }: VodPlayerProps) => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const countdownTimer = useRef<ReturnType<typeof setInterval>>();
  const saveInterval = useRef<ReturnType<typeof setInterval>>();
  const resumedRef = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(() => {
    try { return localStorage.getItem("player_muted") === "true"; } catch { return true; }
  });
  const [volume, setVolume] = useState(() => {
    try { const v = localStorage.getItem("player_volume"); return v !== null ? parseFloat(v) : 0.5; } catch { return 0.5; }
  });
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
      doSave();
    };
  }, [contentType, contentId, playing, doSave]);

  const resumeTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (savedProgress && savedProgress.current_time_secs > 10 && !resumedRef.current) {
      resumeTimeRef.current = savedProgress.current_time_secs;
      setShowResumePrompt(true);
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

    // Apply persisted volume preferences
    video.volume = volume;
    video.muted = muted;

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
        startFragPrefetch: true,
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
    const onVolumeChange = () => {
      setVolume(video.volume);
      setMuted(video.muted);
      try {
        localStorage.setItem("player_volume", String(video.volume));
        localStorage.setItem("player_muted", String(video.muted));
      } catch {}
    };
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

  // Fullscreen listener
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
        const el = container || video;
        if (el?.requestFullscreen) {
          await el.requestFullscreen();
        } else if ((el as any)?.webkitRequestFullscreen) {
          await (el as any).webkitRequestFullscreen();
        } else if ((video as any)?.webkitEnterFullscreen) {
          await (video as any).webkitEnterFullscreen();
        }
        try {
          await (screen.orientation as any).lock?.("landscape");
        } catch {}
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

  // Custom Netflix episodes icon (stacked cards)
  const EpisodesIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="2" width="16" height="2" rx="0.5" fill="currentColor" opacity="0.5" />
      <rect x="6" y="5" width="12" height="2" rx="0.5" fill="currentColor" opacity="0.7" />
      <rect x="3" y="8" width="18" height="14" rx="1" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <polygon points="10,12 10,18 15.5,15" fill="currentColor" />
    </svg>
  );

  return (
    <div
      ref={containerRef}
      className="relative select-none flex items-center justify-center overflow-hidden"
      style={{
        width: "98vw",
        height: "98vh",
        margin: "1vh auto",
        fontFamily: "'Inter', 'Roboto', system-ui, -apple-system, sans-serif",
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
      }}
      onMouseMove={resetHideTimer}
      onTouchStart={resetHideTimer}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        poster={poster || undefined}
        playsInline
        preload="auto"
      />

      {/* Netflix-style preload */}
      <NetflixLoader visible={loading && !error && !showResumePrompt} poster={poster} />

      {/* Error */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-3 z-50">
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
              <button onClick={handleStartOver} className="px-4 py-2 rounded bg-muted text-foreground text-sm hover:bg-muted/80 transition">
                Começar do início
              </button>
              <button onClick={handleResume} className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm hover:opacity-90 transition flex items-center gap-1">
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
                <circle cx="50" cy="50" r="45" fill="none" stroke="#E50914" strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - countdown / 10)}`}
                  strokeLinecap="round" className="transition-all duration-1000" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-white text-3xl font-bold">{countdown}</span>
            </div>
            <p className="text-white font-medium text-sm max-w-xs truncate">{nextEpisode.title}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={cancelCountdown} className="px-4 py-2 rounded bg-white/20 text-white text-sm hover:bg-white/30 transition">Cancelar</button>
              <button onClick={() => { cancelCountdown(); nextEpisode.onPlay(); }} className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm hover:opacity-90 transition flex items-center gap-1">
                <Play className="w-4 h-4" /> Reproduzir agora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click-to-play/pause overlay */}
      <div
        className={`absolute inset-0 z-10 cursor-pointer ${countdown !== null || showResumePrompt || error ? "pointer-events-none" : ""}`}
        onClick={togglePlay}
      />

      {/* === CONTROLS LAYER — Appears on hover with 300ms fade === */}
      <div
        data-controls
        className="absolute inset-0 z-20 pointer-events-none"
        style={{
          opacity: showControls || !playing ? 1 : 0,
          transition: "opacity 300ms ease",
        }}
      >
        {/* GRADIENT SCRIMS — subtle contrast only */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-0 left-0 w-full player-scrim-top"
            style={{
              height: "112px",
            }}
          />
          <div
            className="absolute bottom-0 left-0 w-full player-scrim-bottom"
            style={{
              height: "136px",
            }}
          />
        </div>

        {/* TOP BAR — Back arrow (left) */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 md:p-6 pointer-events-auto">
          <button
            onClick={(e) => { e.stopPropagation(); doSave(); onBack ? onBack() : navigate(-1); }}
            className="text-[hsl(var(--player-contrast))] hover:scale-110 transition active:scale-95"
          >
            <ArrowLeft className="w-8 h-8 md:w-10 md:h-10" strokeWidth={2.5} />
          </button>
        </div>

        {/* CENTER PLAY BUTTON (when paused) */}
        {!playing && !loading && !error && countdown === null && !showResumePrompt && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto cursor-pointer" onClick={togglePlay}>
            <div className="p-5 rounded-full bg-white/20 backdrop-blur-sm hover:scale-110 hover:bg-white/30 transition-all">
              <Play className="w-14 h-14 text-[hsl(var(--player-contrast))] fill-[hsl(var(--player-contrast))] ml-1" />
            </div>
          </div>
        )}

        {/* BOTTOM CONTROLS */}
        <div className="absolute bottom-0 left-0 right-0 px-4 md:px-8 pb-3 md:pb-5 pointer-events-auto">
          {/* Progress bar row — bar + time on the right */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className="relative flex-1 h-[3px] cursor-pointer group/progress rounded-full overflow-visible"
              onClick={(e) => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = (e.clientX - rect.left) / rect.width;
                seek(pct * duration);
              }}
            >
              <div className="absolute inset-0 bg-[hsl(var(--player-contrast)/0.22)] rounded-full" />
              <div className="absolute top-0 left-0 h-full bg-[hsl(var(--player-contrast)/0.38)] rounded-full" style={{ width: `${bufferedPercent}%` }} />
              <div className="absolute top-0 left-0 h-full bg-[hsl(var(--player-accent))] rounded-full" style={{ width: `${progressPercent}%` }} />
              <div
                className="absolute top-1/2 w-[13px] h-[13px] bg-[hsl(var(--player-accent))] rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-lg"
                style={{ left: `${progressPercent}%`, transform: "translate(-50%, -50%)" }}
              />
            </div>
            {/* Time at right of progress bar */}
            <span className="text-[hsl(var(--player-contrast))] text-xs md:text-sm font-bold font-mono tabular-nums shrink-0 drop-shadow-md">
              {formatTime(duration - currentTime)}
            </span>
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between text-[hsl(var(--player-contrast))]" style={{ textRendering: "optimizeLegibility" }}>
            {/* Left controls */}
            <div className="flex items-center gap-3 md:gap-5">
              {/* Play/Pause */}
              <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="hover:text-[hsl(var(--player-contrast)/0.82)] transition">
                {playing
                  ? <Pause className="w-8 h-8 md:w-10 md:h-10" fill="currentColor" />
                  : <Play className="w-8 h-8 md:w-10 md:h-10" fill="currentColor" />
                }
              </button>

              {/* Skip -10 */}
              <button onClick={(e) => { e.stopPropagation(); skip(-10); }} className="hover:scale-110 transition active:scale-95 relative">
                <RotateCcw className="w-7 h-7 md:w-8 md:h-8" />
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] md:text-[10px] font-bold mt-[1px]">10</span>
              </button>

              {/* Skip +10 */}
              <button onClick={(e) => { e.stopPropagation(); skip(10); }} className="hover:scale-110 transition active:scale-95 relative">
                <RotateCw className="w-7 h-7 md:w-8 md:h-8" />
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] md:text-[10px] font-bold mt-[1px]">10</span>
              </button>

              {/* Volume — vertical slider on hover (Netflix style) */}
              <div className="hidden md:flex items-center relative group/volume">
                <button onClick={(e) => { e.stopPropagation(); toggleMute(); }} className="hover:text-[hsl(var(--player-contrast)/0.82)] transition">
                  {muted || volume === 0
                    ? <VolumeX className="w-7 h-7" />
                    : volume < 0.5
                      ? <Volume1 className="w-7 h-7" />
                      : <Volume2 className="w-7 h-7" />
                  }
                </button>
                {/* Vertical volume popup */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 scale-95 group-hover/volume:opacity-100 group-hover/volume:scale-100 transition-all duration-200 pointer-events-none group-hover/volume:pointer-events-auto">
                  <div className="bg-[hsl(0,0%,12%)] rounded-md px-3 py-4 flex flex-col items-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="range" min="0" max="1" step="0.02"
                      value={muted ? 0 : volume}
                      onChange={(e) => { e.stopPropagation(); changeVolume(parseFloat(e.target.value)); }}
                      onClick={(e) => e.stopPropagation()}
                      className="h-24 appearance-none cursor-pointer bg-transparent"
                      {...{ orient: "vertical" } as any}
                      style={{
                        writingMode: "vertical-lr",
                        direction: "rtl",
                        WebkitAppearance: "slider-vertical",
                        width: "4px",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Mobile mute */}
              <button onClick={(e) => { e.stopPropagation(); toggleMute(); }} className="md:hidden hover:text-[hsl(var(--player-contrast)/0.82)] transition">
                {muted || volume === 0 ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </button>
            </div>

            {/* Center label — Netflix style "SeriesName E4 Episode Title" */}
            <div className="hidden lg:flex items-center justify-center absolute left-1/2 -translate-x-1/2 w-[50%] pointer-events-none">
                <span className="text-[hsl(var(--player-contrast))] font-medium text-sm drop-shadow-xl truncate">
                {centerLabel || [title, subtitle].filter(Boolean).join(" · ")}
              </span>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-3 md:gap-5">
              {/* Next episode */}
              {nextEpisode && (
                <button onClick={(e) => { e.stopPropagation(); nextEpisode.onPlay(); }} className="hover:text-[hsl(var(--player-contrast)/0.82)] transition" title="Próximo">
                  <SkipForward className="w-6 h-6 md:w-7 md:h-7" />
                </button>
              )}

              {/* Extra controls (episodes button etc.) */}
              {extraControls}

              {/* Speed — desktop only */}
              <div className="relative hidden md:block">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
                  className="hover:text-[hsl(var(--player-contrast)/0.82)] font-bold text-sm min-w-[2.5rem] tracking-tight transition"
                >
                  {playbackRate}x
                </button>
                {showSettings && (
                  <div className="absolute bottom-full right-0 mb-4 bg-black/95 rounded-lg border border-white/10 overflow-hidden flex flex-col-reverse shadow-2xl backdrop-blur-xl min-w-[80px]" onClick={(e) => e.stopPropagation()}>
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map(r => (
                      <button key={r} onClick={() => changeRate(r)}
                        className={`px-5 py-2.5 text-sm font-bold hover:bg-white/10 transition whitespace-nowrap ${playbackRate === r ? "text-[hsl(var(--player-accent))]" : "text-[hsl(var(--player-contrast))]"}`}
                      >{r}x</button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fullscreen */}
              <button onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }} className="hover:scale-110 transition active:scale-90">
                {isFullscreen ? <Minimize className="w-6 h-6 md:w-7 md:h-7" /> : <Maximize className="w-6 h-6 md:w-7 md:h-7" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay content rendered inside fullscreen container */}
      {overlayContent}
    </div>
  );
};

export default VodPlayer;
