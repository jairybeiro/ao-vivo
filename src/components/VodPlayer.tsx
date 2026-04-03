import { useRef, useEffect, useState, useCallback } from "react";
import Hls from "hls.js";
import { Play, Pause, Volume2, VolumeX, ArrowLeft, Maximize } from "lucide-react";
import { NetflixLoader } from "@/components/NetflixLoader";

interface VodPlayerProps {
  src: string;
  title?: string;
  poster?: string;
  contentType?: string;
  onBack?: () => void;
  onEnded?: () => void;
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:v=|\/embed\/|youtu\.be\/)([^&?#]+)/);
  return match ? match[1] : null;
}

const VodPlayer = ({ src, title, poster, onBack, onEnded }: VodPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideControlsTimeout = useRef<ReturnType<typeof setTimeout>>();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const youtubeId = extractYouTubeId(src);

  const initPlayer = useCallback(() => {
    const video = videoRef.current;
    if (!video || youtubeId) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    setIsLoading(true);

    if (/\.m3u8/i.test(src) && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) setIsLoading(false);
      });
      hlsRef.current = hls;
    } else if (/\.m3u8/i.test(src) && video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      video.addEventListener("loadedmetadata", () => {
        setIsLoading(false);
        video.play().catch(() => {});
      }, { once: true });
    } else {
      video.src = src;
      video.addEventListener("loadedmetadata", () => {
        setIsLoading(false);
        video.play().catch(() => {});
      }, { once: true });
    }
  }, [src, youtubeId]);

  useEffect(() => {
    initPlayer();
    return () => { hlsRef.current?.destroy(); };
  }, [initPlayer]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlers = {
      play: () => setIsPlaying(true),
      pause: () => setIsPlaying(false),
      waiting: () => setIsLoading(true),
      playing: () => setIsLoading(false),
      timeupdate: () => setCurrentTime(video.currentTime),
      durationchange: () => setDuration(video.duration),
      ended: () => onEnded?.(),
    };

    Object.entries(handlers).forEach(([e, h]) => video.addEventListener(e, h));
    return () => Object.entries(handlers).forEach(([e, h]) => video.removeEventListener(e, h));
  }, [onEnded]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play() : v.pause();
  };

  const handleInteraction = () => {
    setShowControls(true);
    clearTimeout(hideControlsTimeout.current);
    hideControlsTimeout.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const formatTime = (t: number) => {
    if (!isFinite(t)) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (youtubeId) {
    return (
      <div className="relative w-full h-full bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&controls=1&rel=0&modestbranding=1`}
          className="w-full h-full"
          allow="autoplay; encrypted-media; fullscreen"
          allowFullScreen
          title={title || "Player"}
        />
        {onBack && (
          <button onClick={onBack} className="absolute top-4 left-4 z-50 w-9 h-9 flex items-center justify-center rounded-full bg-black/50 text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black"
      onMouseMove={handleInteraction}
      onClick={handleInteraction}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        poster={poster}
        onClick={togglePlay}
      />

      <NetflixLoader visible={isLoading} />

      {/* Controls */}
      <div className={`absolute inset-0 transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {/* Top gradient */}
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/60 to-transparent" />
        
        {/* Back + Title */}
        <div className="absolute top-4 left-4 flex items-center gap-3 z-10">
          {onBack && (
            <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          {title && <span className="text-white font-medium text-sm drop-shadow">{title}</span>}
        </div>

        {/* Center play */}
        {!isPlaying && !isLoading && (
          <button onClick={togglePlay} className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-8 h-8 text-white fill-white ml-1" />
            </div>
          </button>
        )}

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          {/* Progress */}
          <div className="w-full h-1 bg-white/20 rounded-full mb-3 cursor-pointer" onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            if (videoRef.current && isFinite(duration)) videoRef.current.currentTime = percent * duration;
          }}>
            <div className="h-full bg-primary rounded-full" style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }} />
          </div>

          <div className="flex items-center justify-between text-white text-sm">
            <div className="flex items-center gap-3">
              <button onClick={togglePlay}>
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
              </button>
              <button onClick={() => { const v = videoRef.current; if (v) { v.muted = !v.muted; setIsMuted(v.muted); } }}>
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <span className="text-xs">{formatTime(currentTime)} / {formatTime(duration)}</span>
            </div>
            <button onClick={async () => {
              try { await containerRef.current?.requestFullscreen(); } catch {}
            }}>
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VodPlayer;
