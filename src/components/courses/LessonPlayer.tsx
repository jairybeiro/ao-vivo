import { useState, useCallback } from "react";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import VideoPlayer from "@/components/VideoPlayer";
import EmbedPlayer from "@/components/EmbedPlayer";
import { CourseLesson } from "@/hooks/useCourses";
import { AutoPlayOverlay } from "./AutoPlayOverlay";

interface LessonPlayerProps {
  lesson: CourseLesson;
  isCompleted: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
  nextLessonTitle?: string;
  initialTime?: number;
  onComplete: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onTimeUpdate?: (currentTime: number) => void;
}

const hasValidStreamUrls = (urls: string[]): boolean => {
  return urls.some(
    (url) => url && url.trim() !== "" && url !== "placeholder" && url.includes(".m3u8")
  );
};

export const LessonPlayer = ({
  lesson,
  isCompleted,
  hasNext,
  hasPrevious,
  nextLessonTitle,
  initialTime = 0,
  onComplete,
  onNext,
  onPrevious,
  onTimeUpdate,
}: LessonPlayerProps) => {
  const [showAutoPlay, setShowAutoPlay] = useState(false);

  const handleVideoEnded = useCallback(() => {
    if (hasNext) {
      setShowAutoPlay(true);
    }
  }, [hasNext]);

  const handleAutoPlayContinue = useCallback(() => {
    setShowAutoPlay(false);
    if (!isCompleted) {
      onComplete();
    }
    onNext();
  }, [isCompleted, onComplete, onNext]);

  const handleAutoPlayCancel = useCallback(() => {
    setShowAutoPlay(false);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Player */}
      <div className="flex-1 bg-black relative">
        {lesson.embedUrl ? (
          <EmbedPlayer embedUrl={lesson.embedUrl} />
        ) : hasValidStreamUrls(lesson.streamUrls) ? (
          <VideoPlayer
            streamUrls={lesson.streamUrls}
            channelName={lesson.title}
            onEnded={handleVideoEnded}
            initialTime={initialTime}
            onTimeUpdate={onTimeUpdate}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            URL do vídeo não configurada
          </div>
        )}

        {/* Auto-play overlay */}
        {showAutoPlay && hasNext && nextLessonTitle && (
          <AutoPlayOverlay
            nextLessonTitle={nextLessonTitle}
            countdownSeconds={10}
            onContinue={handleAutoPlayContinue}
            onCancel={handleAutoPlayCancel}
          />
        )}
      </div>

      {/* Info e controles - tudo em uma linha */}
      <div className="p-4 bg-card border-t">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Esquerda: Título e descrição na mesma linha */}
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{lesson.title}</h2>
            {lesson.description && (
              <p className="text-sm text-muted-foreground">{lesson.description}</p>
            )}
          </div>

          {/* Direita: Todos os botões e status */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onPrevious}
              disabled={!hasPrevious}
              className="gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Anterior
            </Button>

            {isCompleted ? (
              <div className="flex items-center gap-1.5 text-green-500">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Concluída</span>
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={onComplete} className="gap-1.5 text-muted-foreground hover:text-foreground">
                <CheckCircle className="w-4 h-4" />
                Marcar concluída
              </Button>
            )}

            <Button
              size="sm"
              onClick={onNext}
              disabled={!hasNext}
              className="gap-1"
            >
              Próxima
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
