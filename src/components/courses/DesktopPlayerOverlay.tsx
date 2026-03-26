import { ArrowLeft, Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Volume1, SkipForward, SkipBack, Maximize2, Minimize2 } from "lucide-react";
import { useState, useRef } from "react";

interface DesktopPlayerOverlayProps {
  // Lesson info
  lessonTitle: string;
  courseName: string;
  moduleName?: string;
  
  // Player state
  isPlaying: boolean;
  isLive: boolean;
  isMuted: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  bufferedPercent: number;
  progressPercent: number;
  playbackRate: number;
  
  // Navigation
  hasNext: boolean;
  hasPrevious: boolean;
  isCompleted: boolean;
  isFullscreen: boolean;
  
  // Visibility
  visible: boolean;
  
  // Callbacks
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onVolumeChange: (volume: number) => void;
  onSeek: (percent: number) => void;
  onSkipForward: () => void;
  onSkipBackward: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onComplete: () => void;
  onBack: () => void;
  onToggleFullscreen: () => void;
  onChangePlaybackRate: (rate: number) => void;
}

const formatTime = (time: number) => {
  if (!isFinite(time)) return "00:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

const getVolumeIcon = (isMuted: boolean, volume: number) => {
  if (isMuted || volume === 0) return VolumeX;
  if (volume < 0.5) return Volume1;
  return Volume2;
};

export const DesktopPlayerOverlay = ({
  lessonTitle,
  courseName,
  moduleName,
  isPlaying,
  isLive,
  isMuted,
  volume,
  currentTime,
  duration,
  bufferedPercent,
  progressPercent,
  playbackRate,
  hasNext,
  hasPrevious,
  isCompleted,
  isFullscreen,
  visible,
  onTogglePlay,
  onToggleMute,
  onVolumeChange,
  onSeek,
  onSkipForward,
  onSkipBackward,
  onNext,
  onPrevious,
  onComplete,
  onBack,
  onToggleFullscreen,
  onChangePlaybackRate,
}: DesktopPlayerOverlayProps) => {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const hideVolumeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    onSeek(Math.max(0, Math.min(1, percent)));
  };

  const handleVolumeAreaEnter = () => {
    setShowVolumeSlider(true);
    if (hideVolumeTimeout.current) {
      clearTimeout(hideVolumeTimeout.current);
    }
  };

  const handleVolumeAreaLeave = () => {
    hideVolumeTimeout.current = setTimeout(() => {
      setShowVolumeSlider(false);
    }, 1200);
  };

  const VolumeIcon = getVolumeIcon(isMuted, volume);
  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  return (
    <div
      className={`absolute inset-0 z-30 flex flex-col justify-between transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Subtle full-screen scrim */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />
      
      {/* Light bottom gradient for controls readability */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

      {/* Top - Back button */}
      <div className="relative z-10 p-4">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
        >
          <ArrowLeft className="w-7 h-7 text-white" strokeWidth={2.5} />
        </button>
      </div>

      {/* Center - Play/Pause and skip controls */}
      <div className="relative z-10 flex items-center justify-center gap-6">
        {/* Skip Backward */}
        {!isLive && (
          <button
            onClick={onSkipBackward}
            className="w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center transition-colors"
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
          className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center transition-colors"
        >
          {isPlaying ? (
            <Pause className="w-8 h-8 text-white" fill="white" />
          ) : (
            <Play className="w-8 h-8 text-white ml-1" fill="white" />
          )}
        </button>

        {/* Skip Forward */}
        {!isLive && (
          <button
            onClick={onSkipForward}
            className="w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center transition-colors"
          >
            <div className="relative">
              <RotateCw className="w-6 h-6 text-white" />
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white mt-0.5">10</span>
            </div>
          </button>
        )}
      </div>

      {/* Bottom section */}
      <div className="relative z-10">
        {/* Progress bar */}
        {!isLive && (
          <div
            className="w-full h-6 flex items-end px-4 cursor-pointer group/progress"
            onClick={handleProgressClick}
          >
            <div className="relative w-full h-1 bg-white/30 rounded-full overflow-hidden group-hover/progress:h-1.5 transition-all">
              {/* Buffered */}
              <div
                className="absolute top-0 left-0 h-full bg-white/40"
                style={{ width: `${bufferedPercent}%` }}
              />
              {/* Progress */}
              <div
                className="absolute top-0 left-0 h-full bg-red-600"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Controls bar */}
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          {/* Left side: Play, Skip, Volume, Time */}
          <div className="flex items-center gap-1">
            {/* Play/Pause small */}
            <button
              onClick={onTogglePlay}
              className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" fill="white" />
              ) : (
                <Play className="w-5 h-5 text-white" fill="white" />
              )}
            </button>

            {/* Previous */}
            <button
              onClick={onPrevious}
              disabled={!hasPrevious}
              className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
                hasPrevious ? "hover:bg-white/10 text-white" : "text-white/30"
              }`}
            >
              <SkipBack className="w-5 h-5" fill={hasPrevious ? "white" : "rgba(255,255,255,0.3)"} />
            </button>

            {/* Next */}
            <button
              onClick={onNext}
              disabled={!hasNext}
              className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
                hasNext ? "hover:bg-white/10 text-white" : "text-white/30"
              }`}
            >
              <SkipForward className="w-5 h-5" fill={hasNext ? "white" : "rgba(255,255,255,0.3)"} />
            </button>

            {/* Volume */}
            <div
              className="flex items-center gap-1"
              onMouseEnter={handleVolumeAreaEnter}
              onMouseLeave={handleVolumeAreaLeave}
            >
              <button
                onClick={onToggleMute}
                className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
              >
                <VolumeIcon className="w-5 h-5 text-white" />
              </button>

              {/* Volume Slider */}
              <div
                className={`flex items-center overflow-hidden transition-all duration-300 ${
                  showVolumeSlider ? "w-20 opacity-100" : "w-0 opacity-0"
                }`}
              >
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                />
              </div>
            </div>

            {/* Time display */}
            <div className="text-white text-sm font-medium ml-2">
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
          <div className="flex-1 flex items-center justify-center gap-2 mx-4 min-w-0">
            {moduleName && (
              <span className="text-white font-bold text-sm shrink-0">{moduleName}</span>
            )}
            <span className="text-white/80 text-sm truncate">{lessonTitle}</span>
          </div>

          {/* Right side: Speed, Fullscreen */}
          <div className="flex items-center gap-1">
            {/* Playback Speed */}
            {!isLive && (
              <div className="relative">
                <button
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                  className="h-9 px-3 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors text-white text-sm font-medium"
                >
                  {playbackRate}x
                </button>
                
                {showSpeedMenu && (
                  <div className="absolute bottom-12 right-0 bg-black/90 backdrop-blur-sm rounded-lg py-2 min-w-[80px] border border-white/10">
                    {speedOptions.map((speed) => (
                      <button
                        key={speed}
                        onClick={() => {
                          onChangePlaybackRate(speed);
                          setShowSpeedMenu(false);
                        }}
                        className={`w-full px-4 py-2 text-sm text-left hover:bg-white/10 transition-colors ${
                          playbackRate === speed ? "text-primary font-medium" : "text-white"
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Fullscreen */}
            <button
              onClick={onToggleFullscreen}
              className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5 text-white" />
              ) : (
                <Maximize2 className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
