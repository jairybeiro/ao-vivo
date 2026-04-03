import { useRef, useEffect, useState, useCallback } from "react";
import Hls from "hls.js";
import { Play, Pause, Volume2, VolumeX, ArrowLeft, Maximize } from "lucide-react";
import { NetflixLoader } from "@/components/NetflixLoader";

interface VideoPlayerProps {
  streamUrls: string[];
  channelName?: string;
  initialTime?: number;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
}

const VideoPlayer = ({ streamUrls, channelName, initialTime = 0, onEnded, onTimeUpdate }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideControlsTimeout = useRef<ReturnType<typeof setTimeout>>();
  const hasSetInitialTime = useRef(false);
  const lastSavedTimeRef = useRef(initialTime);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [urlIndex, setUrlIndex] = useState(0);

  const currentUrl = streamUrls[urlIndex];

  const initPlayer = useCallback(() => {
    const video = videoRef.current;
    if (!video || !currentUrl) return;

    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    setIsLoading(true);

    const seekInitial = () => {
      if (initialTime > 0 && !hasSetInitialTime.current) {
        video.currentTime = initialTime;
        hasSetInitialTime.current = true;
      }
    };

    if (/\.m3u8/i.test(currentUrl) && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hls.loadSource(currentUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => { setIsLoading(false); seekInitial(); video.play().catch(() => {}); });
      hls.on(Hls.Events.ERROR, (_, d) => { if (d.fatal && urlIndex < streamUrls.length - 1) setUrlIndex(i => i + 1); });
      hlsRef.current = hls;
    } else {
      video.src = currentUrl;
      video.addEventListener("loadedmetadata", () => { setIsLoading(false); seekInitial(); video.play().catch(() => {}); }, { once: true });
    }
  }, [currentUrl, initialTime, urlIndex, streamUrls.length]);

  useEffect(() => { initPlayer(); return () => { hlsRef.current?.destroy(); }; }, [initPlayer]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const h = {
      play: () => setIsPlaying(true),
      pause: () => setIsPlaying(false),
      waiting: () => setIsLoading(true),
      playing: () => setIsLoading(false),
      timeupdate: () => {
        setCurrentTime(video.currentTime);
        if (onTimeUpdate && Math.abs(video.currentTime - lastSavedTimeRef.current) >= 5) {
          lastSavedTimeRef.current = video.currentTime;
          onTimeUpdate(video.currentTime);
        }
      },
      durationchange: () => setDuration(video.duration),
      ended: () => onEnded?.(),
    };
    Object.entries(h).forEach(([e, fn]) => video.addEventListener(e, fn));
    return () => Object.entries(h).forEach(([e, fn]) => video.removeEventListener(e, fn));
  }, [onEnded, onTimeUpdate]);

  const togglePlay = () => { const v = videoRef.current; if (v) v.paused ? v.play() : v.pause(); };

  const handleInteraction = () => {
    setShowControls(true);
    clearTimeout(hideControlsTimeout.current);
    hideControlsTimeout.current = setTimeout(() => { if (isPlaying) setShowControls(false); }, 3000);
  };

  const fmt = (t: number) => { if (!isFinite(t)) return "0:00"; const m = Math.floor(t/60); const s = Math.floor(t%60); return `${m}:${s.toString().padStart(2,"0")}`; };

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black" onMouseMove={handleInteraction}>
      <video ref={videoRef} className="w-full h-full object-contain" playsInline onClick={togglePlay} />
      <NetflixLoader visible={isLoading} />
      <div className={`absolute inset-0 transition-opacity ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/60 to-transparent" />
        {channelName && <span className="absolute top-4 left-4 text-white text-sm font-medium">{channelName}</span>}
        {!isPlaying && !isLoading && (
          <button onClick={togglePlay} className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-7 h-7 text-white fill-white ml-0.5" />
            </div>
          </button>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="w-full h-1 bg-white/20 rounded-full mb-3 cursor-pointer" onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const p = (e.clientX - r.left) / r.width;
            if (videoRef.current && isFinite(duration)) videoRef.current.currentTime = p * duration;
          }}>
            <div className="h-full bg-primary rounded-full" style={{ width: `${duration ? (currentTime/duration)*100 : 0}%` }} />
          </div>
          <div className="flex items-center justify-between text-white text-sm">
            <div className="flex items-center gap-3">
              <button onClick={togglePlay}>{isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}</button>
              <button onClick={() => { const v = videoRef.current; if (v) { v.muted = !v.muted; setIsMuted(v.muted); } }}>
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <span className="text-xs">{fmt(currentTime)} / {fmt(duration)}</span>
            </div>
            <button onClick={async () => { try { await containerRef.current?.requestFullscreen(); } catch {} }}>
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
