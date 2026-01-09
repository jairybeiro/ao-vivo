import { ArrowLeft, CheckCircle, Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, SkipForward } from "lucide-react";

interface MobilePlayerOverlayProps {
  // Lesson info
  lessonTitle: string;
  courseName: string;
  moduleName?: string;
  
  // Player state
  isPlaying: boolean;
  isLive: boolean;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  bufferedPercent: number;
  progressPercent: number;
  
  // Navigation
  hasNext: boolean;
  isCompleted: boolean;
  
  // Visibility
  visible: boolean;
  
  // Callbacks
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onSeek: (percent: number) => void;
  onSkipForward: () => void;
  onSkipBackward: () => void;
  onNext: () => void;
  onComplete: () => void;
  onBack: () => void;
}

const formatTime = (time: number) => {
  if (!isFinite(time)) return "00:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
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
      {/* Top - Back button only */}
      <div className="relative z-10 p-4 pt-safe">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Center - empty space for tapping */}
      <div className="flex-1" />

      {/* Bottom section - Full width progress bar and controls */}
      <div className="relative z-10">
        {/* Progress bar - full width at the bottom */}
        {!isLive && (
          <div
            className="w-full h-6 flex items-end cursor-pointer px-0"
            onClick={handleProgressClick}
            onTouchStart={handleProgressClick}
          >
            <div className="relative w-full h-[3px] bg-white/30 overflow-hidden">
              {/* Buffered */}
              <div
                className="absolute top-0 left-0 h-full bg-white/40"
                style={{ width: `${bufferedPercent}%` }}
              />
              {/* Progress - red like the reference */}
              <div
                className="absolute top-0 left-0 h-full bg-red-600"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Controls bar */}
        <div className="flex items-center justify-between gap-1 px-3 py-2 pb-safe bg-gradient-to-t from-black/80 to-transparent">
          {/* Left side: Play, Skip back, Skip forward, Volume */}
          <div className="flex items-center gap-1">
            {/* Play/Pause */}
            <button
              onClick={onTogglePlay}
              className="w-10 h-10 flex items-center justify-center"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-white" fill="white" />
              ) : (
                <Play className="w-6 h-6 text-white" fill="white" />
              )}
            </button>

            {/* Skip Backward */}
            {!isLive && (
              <button
                onClick={onSkipBackward}
                className="w-9 h-9 flex items-center justify-center relative"
              >
                <RotateCcw className="w-5 h-5 text-white" />
                <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white mt-0.5">10</span>
              </button>
            )}

            {/* Skip Forward */}
            {!isLive && (
              <button
                onClick={onSkipForward}
                className="w-9 h-9 flex items-center justify-center relative"
              >
                <RotateCw className="w-5 h-5 text-white" />
                <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white mt-0.5">10</span>
              </button>
            )}

            {/* Volume */}
            <button
              onClick={onToggleMute}
              className="w-9 h-9 flex items-center justify-center"
            >
              <VolumeIcon className="w-5 h-5 text-white" />
            </button>

            {/* Time display */}
            <div className="text-white text-xs font-medium ml-1">
              {isLive ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  AO VIVO
                </span>
              ) : (
                <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
              )}
            </div>
          </div>

          {/* Center: Module name + Lesson title */}
          <div className="flex-1 flex items-center justify-center gap-2 mx-2 min-w-0">
            {moduleName && (
              <span className="text-white font-bold text-xs shrink-0">{moduleName}</span>
            )}
            <span className="text-white/80 text-xs truncate">{lessonTitle}</span>
          </div>

          {/* Right side: Next only (completion is automatic) */}
          <div className="flex items-center gap-1">
            {/* Completion indicator - read only */}
            {isCompleted && (
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-500">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            )}

            {/* Next button - icon only */}
            <button
              onClick={onNext}
              disabled={!hasNext}
              className={`w-9 h-9 flex items-center justify-center ${
                hasNext ? "text-white" : "text-white/30"
              }`}
            >
              <SkipForward className="w-5 h-5" fill={hasNext ? "white" : "rgba(255,255,255,0.3)"} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
