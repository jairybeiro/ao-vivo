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
const HlsAutoplayVideo = ({ src, className, style, poster, delayMs = 0 }: HlsAutoplayVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [showPoster, setShowPoster] = useState(!!(poster && delayMs > 0));

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
          // Retry once after a short delay (iOS sometimes needs this)
          setTimeout(() => {
            video.muted = true;
            video.play().catch(() => {});
          }, 300);
        });
      }
    };

    if (isHls && !isNativeHls && Hls.isSupported()) {
      // Desktop / Android – use hls.js
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
      // iOS native HLS or MP4
      video.src = src;
      video.load(); // Explicit load() helps iOS pick up the source
      video.addEventListener("canplay", () => tryPlay(), { once: true });
    }

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [src, showPoster]);

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
    <video
      ref={videoRef}
      muted
      loop
      playsInline
      autoPlay
      className={className}
      style={style}
    />
  );
};

export default HlsAutoplayVideo;
