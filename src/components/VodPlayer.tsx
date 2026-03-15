import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toProxyStreamUrl } from "@/lib/streamProxy";
import { isHlsUrl } from "@/lib/hlsUtils";
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
  nextEpisode?: { title: string; onPlay: () => void } | null;
  onBack?: () => void;
  onEnded?: () => void;
}

const VodPlayer = ({ src, title, subtitle, poster, nextEpisode, onBack, onEnded }: VodPlayerProps) => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const countdownTimer = useRef<ReturnType<typeof setInterval>>();

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
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

  const proxiedSrc = toProxyStreamUrl(src);
  const isHls = isHlsUrl(src);

  // Initialize video source
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setLoading(true);
    setError(null);
    setCountdown(null);

    // Cleanup previous HLS
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
      // Native HLS (Safari)
      video.src = proxiedSrc;
      video.play().catch(() => {});
    } else {
      // MP4 or other direct source
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
    const onPause = () => setPlaying(false);
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
    const onEnded = () => {
      setPlaying(false);
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
    video.addEventListener("ended", onEnded);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("error", onError);
      video.removeEventListener("volumechange", onVolumeChange);
      video.removeEventListener("ended", onEnded);
    };
  }, [nextEpisode]);

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
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
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

  // Controls
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
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await el.requestFullscreen();
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
      onClick={(e) => {
        // Only toggle play if clicking the video area, not controls
        if ((e.target as HTMLElement).closest("[data-controls]")) return;
        togglePlay();
      }}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        poster={poster || undefined}
        playsInline
        crossOrigin="anonymous"
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

      {/* Netflix-style controls overlay */}
      <div
        data-controls
        className={`absolute inset-0 transition-opacity duration-300 ${
          showControls || !playing ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Top gradient + info */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 pt-3">
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); onBack ? onBack() : navigate(-1); }}
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
        {!playing && !loading && !error && countdown === null && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>
          </div>
        )}

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-4 pb-3 pt-12">
          {/* Progress bar */}
          <div
            className="relative h-1 hover:h-2 transition-all bg-white/20 rounded-full mb-3 cursor-pointer group/progress"
            onClick={(e) => {
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              seek(pct * duration);
            }}
          >
            {/* Buffered */}
            <div className="absolute h-full bg-white/30 rounded-full" style={{ width: `${bufferedPercent}%` }} />
            {/* Progress */}
            <div className="absolute h-full bg-primary rounded-full" style={{ width: `${progressPercent}%` }} />
            {/* Thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover/progress:opacity-100 transition"
              style={{ left: `${progressPercent}%`, transform: `translate(-50%, -50%)` }}
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 md:gap-2">
              {/* Play/Pause */}
              <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="text-white hover:text-primary transition p-1.5">
                {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>

              {/* Skip back */}
              <button onClick={(e) => { e.stopPropagation(); skip(-10); }} className="text-white hover:text-primary transition p-1.5">
                <SkipBack className="w-5 h-5" />
              </button>

              {/* Skip forward */}
              <button onClick={(e) => { e.stopPropagation(); skip(10); }} className="text-white hover:text-primary transition p-1.5">
                <SkipForward className="w-5 h-5" />
              </button>

              {/* Volume */}
              <div className="flex items-center gap-1 group/vol">
                <button onClick={(e) => { e.stopPropagation(); toggleMute(); }} className="text-white hover:text-primary transition p-1.5">
                  {muted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min="0" max="1" step="0.05"
                  value={muted ? 0 : volume}
                  onChange={(e) => { e.stopPropagation(); changeVolume(parseFloat(e.target.value)); }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-0 group-hover/vol:w-20 transition-all accent-primary h-1 cursor-pointer"
                />
              </div>

              {/* Time */}
              <span className="text-white/80 text-xs ml-1 tabular-nums hidden sm:block">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-1 md:gap-2">
              {/* Next episode button */}
              {nextEpisode && (
                <button
                  onClick={(e) => { e.stopPropagation(); nextEpisode.onPlay(); }}
                  className="text-white hover:text-primary transition p-1.5 flex items-center gap-1 text-xs"
                >
                  <SkipForward className="w-4 h-4" />
                  <span className="hidden sm:inline">Próximo</span>
                </button>
              )}

              {/* Speed */}
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
                  className="text-white hover:text-primary transition p-1.5 text-xs"
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
                          playbackRate === r ? "bg-primary text-primary-foreground" : "text-white hover:bg-white/10"
                        }`}
                      >
                        {r}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fullscreen */}
              <button onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }} className="text-white hover:text-primary transition p-1.5">
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
