import { useState, useRef, useEffect, useCallback } from "react";
import { toProxyStreamUrl } from "@/lib/streamProxy";
import { isHlsUrl } from "@/lib/hlsUtils";
import Hls from "hls.js";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  Maximize,
  Minimize,
  Radio,
  Loader2,
  ArrowLeft,
} from "lucide-react";

interface LivePlayerProps {
  src: string;
  title?: string;
  subtitle?: string;
  extraControls?: React.ReactNode;
  overlayContent?: React.ReactNode;
  immersive?: boolean;
  onBack?: () => void;
}

const LivePlayer = ({ src, title, subtitle, extraControls, overlayContent, immersive, onBack }: LivePlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(() => {
    try { return localStorage.getItem("player_muted") === "true"; } catch { return true; }
  });
  const [volume, setVolume] = useState(() => {
    try { const v = localStorage.getItem("player_volume"); return v !== null ? parseFloat(v) : 0.5; } catch { return 0.5; }
  });
  const [showControls, setShowControls] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const volumeHideTimer = useRef<ReturnType<typeof setTimeout>>();

  const proxiedSrc = toProxyStreamUrl(src);
  const isHls = isHlsUrl(src);

  // Initialize video source
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setLoading(true);
    setError(null);

    video.volume = volume;
    video.muted = muted;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        startLevel: -1,
        enableWorker: true,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 6,
      });
      hls.loadSource(proxiedSrc);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            setError("Erro ao carregar stream");
            setLoading(false);
          }
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
    const onPause = () => setPlaying(false);
    const onWaiting = () => setLoading(true);
    const onCanPlay = () => setLoading(false);
    const onError = () => { setError("Erro ao reproduzir"); setLoading(false); };
    const onVolumeChange = () => {
      setVolume(video.volume);
      setMuted(video.muted);
      try {
        localStorage.setItem("player_volume", String(video.volume));
        localStorage.setItem("player_muted", String(video.muted));
      } catch {}
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("error", onError);
    video.addEventListener("volumechange", onVolumeChange);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("error", onError);
      video.removeEventListener("volumechange", onVolumeChange);
    };
  }, []);

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
    const onFsChange = () => setIsFullscreen(!!(document.fullscreenElement || (document as any).webkitFullscreenElement));
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
    };
  }, []);

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

  const changeVolume = (val: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = val;
    if (val > 0 && v.muted) v.muted = false;
  };

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    const video = videoRef.current;
    if (!el) return;

    try {
      const isFs = document.fullscreenElement || (document as any).webkitFullscreenElement;

      if (isFs) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        }
        try { screen.orientation?.unlock(); } catch {}
      } else {
        if (video && (video as any).webkitEnterFullscreen) {
          (video as any).webkitEnterFullscreen();
        } else if (el.requestFullscreen) {
          await el.requestFullscreen();
        } else if ((el as any).webkitRequestFullscreen) {
          (el as any).webkitRequestFullscreen();
        }
        try { await screen.orientation?.lock("landscape"); } catch {}
      }
    } catch (err) {
      console.log("Fullscreen error:", err);
    }
  };

  // Jump to live edge
  const goLive = () => {
    const v = videoRef.current;
    if (!v) return;
    if (hlsRef.current) {
      v.currentTime = v.duration || 0;
    }
    if (v.paused) v.play().catch(() => {});
  };

  return (
    <div
      ref={containerRef}
      className={`relative bg-black overflow-hidden select-none ${immersive ? "flex items-center justify-center" : "w-full rounded-lg"}`}
      style={{
        ...(immersive
          ? { width: "98vw", height: "98vh", margin: "1vh auto" }
          : { aspectRatio: "16/9" }),
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
        playsInline
        muted
      />

      {/* Loading spinner */}
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Loader2 className="w-12 h-12 text-[hsl(var(--player-contrast))] animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-3 z-50">
          <p className="text-destructive text-sm">{error}</p>
          <button
            onClick={() => { setError(null); videoRef.current?.load(); }}
            className="text-[hsl(var(--player-contrast))] underline text-sm"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Click-to-play/pause overlay */}
      <div
        className={`absolute inset-0 z-10 cursor-pointer ${error ? "pointer-events-none" : ""}`}
        onClick={togglePlay}
      />

      {/* === CONTROLS LAYER === */}
      <div
        className="absolute inset-0 z-20 pointer-events-none"
        style={{
          opacity: showControls || !playing ? 1 : 0,
          transition: "opacity 300ms ease",
        }}
      >
        {/* GRADIENT SCRIMS */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-0 left-0 w-full player-scrim-top"
            style={{ height: "112px" }}
          />
          <div
            className="absolute bottom-0 left-0 w-full player-scrim-bottom"
            style={{ height: "136px" }}
          />
        </div>

        {/* TOP BAR — AO VIVO indicator + info */}
        <div className="absolute top-0 left-0 right-0 flex items-center gap-3 p-4 md:p-6 pointer-events-auto">
          <button
            onClick={(e) => { e.stopPropagation(); goLive(); }}
            className="flex items-center gap-1.5 bg-[hsl(var(--player-accent))] hover:bg-[hsl(var(--player-accent)/0.85)] text-[hsl(var(--player-contrast))] px-2.5 py-1 rounded text-xs font-bold transition shrink-0"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            AO VIVO
          </button>
          <div className="min-w-0">
            {title && (
              <p className="text-[hsl(var(--player-contrast))] font-semibold text-sm md:text-base truncate drop-shadow-md">
                {title}
              </p>
            )}
            {subtitle && (
              <p className="text-[hsl(var(--player-contrast)/0.6)] text-xs truncate drop-shadow-md">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* CENTER PLAY BUTTON (when paused) */}
        {!playing && !loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto cursor-pointer" onClick={togglePlay}>
            <div className="p-5 rounded-full bg-white/20 backdrop-blur-sm hover:scale-110 hover:bg-white/30 transition-all">
              <Play className="w-14 h-14 text-[hsl(var(--player-contrast))] fill-[hsl(var(--player-contrast))] ml-1" />
            </div>
          </div>
        )}

        {/* BOTTOM CONTROLS */}
        <div className="absolute bottom-0 left-0 right-0 px-4 md:px-8 pb-3 md:pb-5 pointer-events-auto">
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

              {/* Volume — vertical slider on hover (Netflix style) — desktop */}
              <div
                className="hidden md:flex items-center relative"
                onMouseEnter={() => {
                  clearTimeout(volumeHideTimer.current);
                  setShowVolume(true);
                }}
                onMouseLeave={() => {
                  volumeHideTimer.current = setTimeout(() => setShowVolume(false), 400);
                }}
              >
                <button onClick={(e) => { e.stopPropagation(); toggleMute(); }} className="hover:text-[hsl(var(--player-contrast)/0.82)] transition">
                  {muted || volume === 0
                    ? <VolumeX className="w-7 h-7" />
                    : volume < 0.5
                      ? <Volume1 className="w-7 h-7" />
                      : <Volume2 className="w-7 h-7" />
                  }
                </button>
                {/* Vertical volume popup */}
                <div
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 transition-all duration-200"
                  style={{
                    opacity: showVolume ? 1 : 0,
                    transform: showVolume ? "scale(1)" : "scale(0.95)",
                    pointerEvents: showVolume ? "auto" : "none",
                  }}
                  onMouseEnter={() => {
                    clearTimeout(volumeHideTimer.current);
                    setShowVolume(true);
                  }}
                  onMouseLeave={() => {
                    volumeHideTimer.current = setTimeout(() => setShowVolume(false), 400);
                  }}
                >
                  <div className="bg-[hsl(0,0%,12%)] rounded-md px-3 py-4 flex flex-col items-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="range" min="0" max="1" step="0.02"
                      value={muted ? 0 : volume}
                      onInput={(e) => { e.stopPropagation(); changeVolume(parseFloat((e.target as HTMLInputElement).value)); }}
                      onChange={(e) => { e.stopPropagation(); changeVolume(parseFloat(e.target.value)); }}
                      onMouseDown={(e) => { e.stopPropagation(); clearTimeout(volumeHideTimer.current); }}
                      onClick={(e) => e.stopPropagation()}
                      className="h-24 appearance-none cursor-pointer bg-transparent volume-slider-red"
                      {...{ orient: "vertical" } as any}
                      style={{
                        writingMode: "vertical-lr",
                        direction: "rtl",
                        WebkitAppearance: "slider-vertical",
                        width: "4px",
                        accentColor: "#E50914",
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

            {/* Center label — channel info on desktop */}
            <div className="hidden lg:flex items-center justify-center absolute left-1/2 -translate-x-1/2 w-[50%] pointer-events-none">
              <span className="text-[hsl(var(--player-contrast))] font-medium text-sm drop-shadow-xl truncate">
                {[title, subtitle].filter(Boolean).join(" · ")}
              </span>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-3 md:gap-5">
              {/* Extra controls (channel list button etc.) */}
              {extraControls}

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

export default LivePlayer;
