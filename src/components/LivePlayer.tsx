import { useState, useRef, useEffect, useCallback } from "react";
import { toProxyStreamUrl } from "@/lib/streamProxy";
import { isHlsUrl } from "@/lib/hlsUtils";
import Hls from "hls.js";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Loader2,
  Radio,
} from "lucide-react";

interface LivePlayerProps {
  src: string;
  title?: string;
  subtitle?: string;
}

const LivePlayer = ({ src, title, subtitle }: LivePlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const proxiedSrc = toProxyStreamUrl(src);
  const isHls = isHlsUrl(src);

  // Initialize video source
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setLoading(true);
    setError(null);

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
            // Try to recover network errors
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
    const onVolumeChange = () => { setVolume(video.volume); setMuted(video.muted); };

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

    // Check if already fullscreen
    const isFs = document.fullscreenElement || (document as any).webkitFullscreenElement;

    if (isFs) {
      // Exit fullscreen
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
      // Unlock orientation
      try { screen.orientation?.unlock(); } catch {}
    } else {
      // iOS Safari: use webkitEnterFullscreen on video element
      if (video && (video as any).webkitEnterFullscreen) {
        (video as any).webkitEnterFullscreen();
      } else if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if ((el as any).webkitRequestFullscreen) {
        (el as any).webkitRequestFullscreen();
      }
      // Lock to landscape on mobile
      try { await screen.orientation?.lock("landscape"); } catch {}
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
      className="relative w-full aspect-video bg-black rounded-lg overflow-hidden select-none group"
      onMouseMove={resetHideTimer}
      onTouchStart={resetHideTimer}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
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
          <button
            onClick={() => { setError(null); videoRef.current?.load(); }}
            className="text-white underline text-sm"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Click-to-play/pause overlay */}
      <div
        className={`absolute inset-0 z-10 cursor-pointer transition-opacity duration-300 ${
          error ? "pointer-events-none" : ""
        }`}
        onClick={togglePlay}
      />

      {/* Controls overlay */}
      <div
        className={`absolute inset-0 z-20 transition-opacity duration-300 pointer-events-none ${
          showControls || !playing ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Top gradient + info */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 pt-3 pointer-events-auto">
          <div className="flex items-center gap-3">
            {/* Live indicator */}
            <button
              onClick={(e) => { e.stopPropagation(); goLive(); }}
              className="flex items-center gap-1.5 bg-destructive/90 hover:bg-destructive text-white px-2.5 py-1 rounded text-xs font-bold transition"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              AO VIVO
            </button>
            <div className="min-w-0">
              {title && <p className="text-white font-semibold text-sm md:text-base truncate">{title}</p>}
              {subtitle && <p className="text-white/60 text-xs truncate">{subtitle}</p>}
            </div>
          </div>
        </div>

        {/* Center play button (when paused) */}
        {!playing && !loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto cursor-pointer" onClick={togglePlay}>
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>
          </div>
        )}

        {/* Bottom controls - simplified for live */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-4 pb-3 pt-12 pointer-events-auto">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 md:gap-2">
              <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="text-white hover:text-primary transition p-1.5">
                {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
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
            </div>

            <div className="flex items-center gap-1 md:gap-2">
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

export default LivePlayer;
