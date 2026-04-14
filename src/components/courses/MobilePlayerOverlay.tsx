import { ArrowLeft, Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, SkipForward, Maximize, Minimize, Smartphone } from "lucide-react";

interface MobilePlayerOverlayProps {
  lessonTitle: string;
  courseName: string;
  moduleName?: string;
  isPlaying: boolean;
  isLive: boolean;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  bufferedPercent: number;
  progressPercent: number;
  isFullscreen?: boolean;
  hasNext: boolean;
  isCompleted: boolean;
  visible: boolean;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onSeek: (percent: number) => void;
  onSkipForward: () => void;
  onSkipBackward: () => void;
  onNext: () => void;
  onComplete: () => void;
  onBack: () => void;
  onToggleFullscreen?: () => void;
}

const formatTime = (time: number) => {
  if (!isFinite(time)) return "00:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

const handleLandscapeLock = async () => {
  try {
    // Try Screen Orientation API
    if (screen.orientation && (screen.orientation as any).lock) {
      await (screen.orientation as any).lock("landscape");
    }
  } catch (err) {
    console.log("Orientation lock not supported:", err);
  }
};

export const MobilePlayerOverlay = ({
  lessonTitle,
  courseName,
  moduleName,
  isPlaying,
  isLive,
  isMuted,
  currentTime,
  duration,
  bufferedPercent,
  progressPercent,
  isFullscreen = false,
  hasNext,
  isCompleted,
  visible,
  onTogglePlay,
  onToggleMute,
  onSeek,
  onSkipForward,
  onSkipBackward,
  onNext,
  onComplete,
  onBack,
  onToggleFullscreen,
}: MobilePlayerOverlayProps) => {
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const percent = (clientX - rect.left) / rect.width;
    onSeek(Math.max(0, Math.min(1, percent)));
  };

  const VolumeIcon = isMuted ? VolumeX : Volume2;

  return (
    <div
      className={`absolute inset-0 z-30 flex flex-col justify-between transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Top bar - glass style */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+16px)] pb-2 bg-gradient-to-b from-black/70 to-transparent">
        <button
          onClick={(e) => { e.stopPropagation(); onBack(); }}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        <div className="flex-1 mx-3 min-w-0 text-center">
          <p className="text-white/60 text-[10px] font-medium truncate">{courseName}</p>
          <p className="text-white text-xs font-semibold truncate">{lessonTitle}</p>
        </div>

        {/* Landscape lock button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleLandscapeLock();
            onToggleFullscreen?.();
          }}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm"
          title="Travar Horizontal"
        >
          <Smartphone className="w-5 h-5 text-white rotate-90" />
        </button>
      </div>

      {/* Center - play controls */}
      <div className="flex-1 flex items-center justify-center gap-8">
        {!isLive && (
          <button onClick={onSkipBackward} className="w-12 h-12 flex items-center justify-center relative opacity-80">
            <RotateCcw className="w-7 h-7 text-white" />
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white mt-0.5">10</span>
          </button>
        )}

        <button
          onClick={onTogglePlay}
          className="w-18 h-18 flex items-center justify-center rounded-full bg-white/15 backdrop-blur-xl border border-white/20"
          style={{ width: 72, height: 72 }}
        >
          {isPlaying ? (
            <Pause className="w-9 h-9 text-white" fill="white" />
          ) : (
            <Play className="w-9 h-9 text-white ml-1" fill="white" />
          )}
        </button>

        {!isLive && (
          <button onClick={onSkipForward} className="w-12 h-12 flex items-center justify-center relative opacity-80">
            <RotateCw className="w-7 h-7 text-white" />
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white mt-0.5">10</span>
          </button>
        )}
      </div>

      {/* Bottom controls */}
      <div className="relative z-10 bg-gradient-to-t from-black/80 to-transparent pt-6">
        {/* Progress bar */}
        {!isLive && (
          <div
            className="mx-4 h-8 flex items-center cursor-pointer"
            onClick={handleProgressClick}
            onTouchStart={handleProgressClick}
          >
            <div className="relative w-full h-[3px] bg-white/20 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-white/30 rounded-full"
                style={{ width: `${bufferedPercent}%` }}
              />
              <div
                className="absolute top-0 left-0 h-full bg-primary rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {/* Thumb */}
            <div
              className="absolute w-3.5 h-3.5 rounded-full bg-primary border-2 border-white shadow-lg"
              style={{ left: `calc(${progressPercent}% + 16px - 7px)`, marginLeft: `-${progressPercent * 0.32}px` }}
            />
          </div>
        )}

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-4 py-2 pb-[calc(env(safe-area-inset-bottom)+10px)]">
          <div className="flex items-center gap-3">
            <button onClick={onToggleMute} className="w-9 h-9 flex items-center justify-center">
              <VolumeIcon className="w-5 h-5 text-white" />
            </button>
            <span className="text-white/70 text-xs font-medium">
              {isLive ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  AO VIVO
                </span>
              ) : (
                `${formatTime(currentTime)} / ${formatTime(duration)}`
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onToggleFullscreen && (
              <button onClick={onToggleFullscreen} className="w-9 h-9 flex items-center justify-center text-white">
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            )}
            <button
              onClick={onNext}
              disabled={!hasNext}
              className={`w-9 h-9 flex items-center justify-center ${hasNext ? "text-white" : "text-white/30"}`}
            >
              <SkipForward className="w-5 h-5" fill={hasNext ? "white" : "rgba(255,255,255,0.3)"} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
