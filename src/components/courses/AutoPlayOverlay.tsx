import { useState, useEffect, useCallback } from "react";
import { X, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AutoPlayOverlayProps {
  nextLessonTitle: string;
  countdownSeconds?: number;
  onContinue: () => void;
  onCancel: () => void;
}

export const AutoPlayOverlay = ({
  nextLessonTitle,
  countdownSeconds = 10,
  onContinue,
  onCancel,
}: AutoPlayOverlayProps) => {
  const [countdown, setCountdown] = useState(countdownSeconds);
  const [isCancelled, setIsCancelled] = useState(false);

  useEffect(() => {
    if (isCancelled) return;

    if (countdown <= 0) {
      onContinue();
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, isCancelled, onContinue]);

  const handleCancel = useCallback(() => {
    setIsCancelled(true);
    onCancel();
  }, [onCancel]);

  // Progress percentage for the circular indicator
  const progressPercent = ((countdownSeconds - countdown) / countdownSeconds) * 100;

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-start p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
      <div className="flex items-center gap-4 bg-black/80 backdrop-blur-sm rounded-xl p-4 border border-white/10">
        {/* Countdown Circle */}
        <div className="relative w-14 h-14 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            {/* Background circle */}
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-white/20"
            />
            {/* Progress circle */}
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray={`${progressPercent} 100`}
              strokeLinecap="round"
              className="text-primary transition-all duration-1000"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white">
            {countdown}
          </span>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">A seguir</span>
          <span className="text-sm font-medium text-white line-clamp-1 max-w-[200px]">
            {nextLessonTitle}
          </span>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 ml-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={onContinue}
            className="gap-1.5"
          >
            <Play className="w-3.5 h-3.5" />
            Continuar
          </Button>
        </div>
      </div>
    </div>
  );
};
