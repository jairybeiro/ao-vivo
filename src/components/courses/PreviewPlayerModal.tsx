import { useState, useRef, useEffect, useCallback } from "react";
import { X, Play, Pause, Volume2, VolumeX } from "lucide-react";
import { motion } from "framer-motion";
import Hls from "hls.js";

interface PreviewPlayerModalProps {
  url: string;
  onClose: () => void;
}

const PreviewPlayerModal = ({ url, onClose }: PreviewPlayerModalProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  const isHls = /\.m3u8/i.test(url);

  const scheduleHide = useCallback(() => {
    clearTimeout(hideTimer.current);
    setShowControls(true);
    hideTimer.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.playsInline = true;

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({ maxBufferLength: 30 });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
    } else {
      video.src = url;
      video.load();
      video.play().catch(() => {});
    }

    scheduleHide();

    return () => {
      hlsRef.current?.destroy();
      clearTimeout(hideTimer.current);
    };
  }, [url, isHls, scheduleHide]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
    scheduleHide();
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    scheduleHide();
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setProgress((v.currentTime / v.duration) * 100);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.currentTime = pct * v.duration;
    scheduleHide();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
      onClick={togglePlay}
      onMouseMove={scheduleHide}
    >
      <video
        ref={videoRef}
        onTimeUpdate={handleTimeUpdate}
        className="absolute inset-0 w-full h-full object-contain"
        playsInline
      />

      {/* Controls overlay */}
      <motion.div
        animate={{ opacity: showControls ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 pointer-events-none"
      >
        {/* Top gradient + close */}
        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/70 to-transparent pointer-events-auto">
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Center play/pause */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
          <button
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors"
          >
            {playing ? (
              <Pause className="w-7 h-7 text-white" fill="white" />
            ) : (
              <Play className="w-7 h-7 text-white ml-1" fill="white" />
            )}
          </button>
        </div>

        {/* Bottom bar */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-4 pointer-events-auto space-y-2">
          {/* Progress bar */}
          <div
            className="w-full h-1 bg-white/20 rounded-full cursor-pointer group"
            onClick={(e) => { e.stopPropagation(); handleSeek(e); }}
          >
            <div
              className="h-full bg-primary rounded-full relative transition-all"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                className="text-white hover:text-primary transition-colors"
              >
                {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                className="text-white hover:text-primary transition-colors"
              >
                {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>
            <span className="text-xs text-white/60">Preview</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PreviewPlayerModal;
