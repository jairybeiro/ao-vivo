import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";

interface HlsAutoplayVideoProps {
  src: string;
  className?: string;
  style?: React.CSSProperties;
  /** URL of a poster/backdrop image to show before video starts */
  poster?: string | null;
  /** Delay in ms before video starts playing (default: 0). Only applies when poster is set. */
  delayMs?: number;
  /** Show minimal pause/mute controls overlay */
  showControls?: boolean;
}

/**
 * Renders a <video> that auto-plays muted & looping.
 * Supports both MP4 (native) and HLS (.m3u8) via hls.js.
 * When poster + delayMs are provided, shows the poster image first, then fades into video.
 */
const HlsAutoplayVideo = ({ src, className, style, poster, delayMs = 0, showControls = false }: HlsAutoplayVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [showPoster, setShowPoster] = useState(!!(poster && delayMs > 0));
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    if (!poster || delayMs <= 0) {
      setShowPoster(false);
      return;
    }
    setShowPoster(true);
    const timer = setTimeout(() => setShowPoster(false), delayMs);
    return () => clearTimeout(timer);
  }, [poster, delayMs, src]);

  // Force muted + playsInline imperatively (React bug on iOS Safari)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.setAttribute("muted", "");
  }, [showPoster]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src || showPoster) return;

    // Ensure muted before any source assignment (critical for iOS autoplay)
    video.muted = true;
    video.playsInline = true;

    const isHls = /\.m3u8|\.m3u/i.test(src);
    const isNativeHls = video.canPlayType("application/vnd.apple.mpegurl");

    const tryPlay = () => {
      const p = video.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => {
          setTimeout(() => {
            video.muted = true;
            video.play().catch(() => {});
          }, 300);
        });
      }
    };

    if (isHls && !isNativeHls && Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        startFragPrefetch: true,
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => tryPlay());
      hlsRef.current = hls;
    } else {
      video.src = src;
      video.load();
      video.addEventListener("canplay", () => tryPlay(), { once: true });
    }

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [src, showPoster]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  if (showPoster && poster) {
    return (
      <img
        src={poster}
        alt=""
        className={className}
        style={{ ...style, objectFit: "cover" }}
      />
    );
  }

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        autoPlay
        className={className}
        style={style}
      />
      {showControls && (
        <div className="absolute bottom-3 right-3 flex items-center gap-2 z-10">
          <button
            onClick={togglePlay}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white/90 active:scale-90 transition-transform"
          >
            {isPlaying ? <Pause className="w-4 h-4" fill="white" /> : <Play className="w-4 h-4" fill="white" />}
          </button>
          <button
            onClick={toggleMute}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white/90 active:scale-90 transition-transform"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      )}
    </div>
  );
};

export default HlsAutoplayVideo;
