import { ArrowLeft, ArrowRight, CheckCircle, Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, X, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobilePlayerOverlayProps {
  // Lesson info
  lessonTitle: string;
  lessonDescription?: string;
  courseName: string;
  
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
  hasPrevious: boolean;
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
  onPrevious: () => void;
  onComplete: () => void;
  onBack: () => void;
  onToggleFullscreen: () => void;
}

const formatTime = (time: number) => {
  if (!isFinite(time)) return "0:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export const MobilePlayerOverlay = ({
  lessonTitle,
  lessonDescription,
  courseName,
  isPlaying,
  isLive,
  isMuted,
  currentTime,
  duration,
  bufferedPercent,
  progressPercent,
  hasNext,
  hasPrevious,
  isCompleted,
  visible,
  onTogglePlay,
  onToggleMute,
  onSeek,
  onSkipForward,
  onSkipBackward,
  onNext,
  onPrevious,
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
      {/* Top gradient */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />
      
      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />

      {/* Top bar - Course name, lesson title, back button */}
      <div className="relative z-10 p-4 pt-safe">
        <div className="flex items-start gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center shrink-0"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-white/70 text-xs truncate">{courseName}</p>
            <h3 className="text-white font-semibold text-sm truncate">{lessonTitle}</h3>
            {lessonDescription && (
              <p className="text-white/60 text-xs mt-0.5 line-clamp-1">{lessonDescription}</p>
            )}
          </div>
          <button
            onClick={onToggleFullscreen}
            className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center shrink-0"
          >
            <Maximize2 className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Center controls - Play/Pause and skip */}
      <div className="relative z-10 flex items-center justify-center gap-8">
        {/* Skip Backward */}
        {!isLive && (
          <button
            onClick={onSkipBackward}
            className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center"
          >
            <div className="relative">
              <RotateCcw className="w-6 h-6 text-white" />
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white mt-0.5">10</span>
            </div>
          </button>
        )}

        {/* Play/Pause */}
        <button
          onClick={onTogglePlay}
          className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
        >
          {isPlaying ? (
            <Pause className="w-8 h-8 text-white" />
          ) : (
            <Play className="w-8 h-8 text-white ml-1" />
          )}
        </button>

        {/* Skip Forward */}
        {!isLive && (
          <button
            onClick={onSkipForward}
            className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center"
          >
            <div className="relative">
              <RotateCw className="w-6 h-6 text-white" />
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white mt-0.5">10</span>
            </div>
          </button>
        )}
      </div>

      {/* Bottom section - Progress, navigation, completion */}
      <div className="relative z-10 p-4 pb-safe space-y-3">
        {/* Progress bar */}
        {!isLive && (
          <div
            className="w-full h-8 flex items-center cursor-pointer"
            onClick={handleProgressClick}
            onTouchStart={handleProgressClick}
          >
            <div className="relative w-full h-1.5 bg-white/30 rounded-full overflow-hidden">
              {/* Buffered */}
              <div
                className="absolute top-0 left-0 h-full bg-white/50 rounded-full"
                style={{ width: `${bufferedPercent}%` }}
              />
              {/* Progress */}
              <div
                className="absolute top-0 left-0 h-full bg-primary rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Time and controls row */}
        <div className="flex items-center justify-between gap-2">
          {/* Time display */}
          <div className="text-white text-xs font-medium min-w-[80px]">
            {isLive ? (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                AO VIVO
              </span>
            ) : (
              <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
            )}
          </div>

          {/* Volume */}
          <button
            onClick={onToggleMute}
            className="w-9 h-9 rounded-full bg-black/50 flex items-center justify-center"
          >
            <VolumeIcon className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Navigation and completion */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrevious}
            disabled={!hasPrevious}
            className="text-white hover:bg-white/20 gap-1 h-9 px-3"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs">Anterior</span>
          </Button>

          {isCompleted ? (
            <div className="flex items-center gap-1 text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs">Concluída</span>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={onComplete}
              className="text-white/80 hover:bg-white/20 hover:text-white gap-1 h-9 px-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs">Concluir</span>
            </Button>
          )}

          <Button
            size="sm"
            onClick={onNext}
            disabled={!hasNext}
            className="gap-1 h-9 px-3"
          >
            <span className="text-xs">Próxima</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
