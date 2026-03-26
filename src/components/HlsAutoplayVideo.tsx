import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

interface HlsAutoplayVideoProps {
  src: string;
  className?: string;
  style?: React.CSSProperties;
  /** URL of a poster/backdrop image to show before video starts */
  poster?: string | null;
  /** Delay in ms before video starts playing (default: 0). Only applies when poster is set. */
  delayMs?: number;
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

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src || showPoster) return;

    const isHls = /\.m3u8|\.m3u/i.test(src);

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        startFragPrefetch: true,
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hlsRef.current = hls;
    } else if (isHls && video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      video.addEventListener("canplay", () => video.play().catch(() => {}), { once: true });
    } else {
      video.src = src;
      video.addEventListener("canplay", () => video.play().catch(() => {}), { once: true });
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
      className={className}
      style={style}
    />
  );
};

export default HlsAutoplayVideo;
