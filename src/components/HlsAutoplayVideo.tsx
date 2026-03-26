import { useEffect, useRef } from "react";
import Hls from "hls.js";

interface HlsAutoplayVideoProps {
  src: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Renders a <video> that auto-plays muted & looping.
 * Supports both MP4 (native) and HLS (.m3u8) via hls.js.
 */
const HlsAutoplayVideo = ({ src, className, style }: HlsAutoplayVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

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
      // Safari native HLS
      video.src = src;
      video.addEventListener("canplay", () => video.play().catch(() => {}), { once: true });
    } else {
      // MP4 or other native format
      video.src = src;
      video.addEventListener("canplay", () => video.play().catch(() => {}), { once: true });
    }

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [src]);

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
