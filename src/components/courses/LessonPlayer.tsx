import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import VideoPlayer from "@/components/VideoPlayer";
import EmbedPlayer from "@/components/EmbedPlayer";
import { CourseLesson } from "@/hooks/useCourses";

interface LessonPlayerProps {
  lesson: CourseLesson;
  isCompleted: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
  onComplete: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

const hasValidStreamUrls = (urls: string[]): boolean => {
  return urls.some(
    (url) => url && url.trim() !== "" && url !== "placeholder" && url.endsWith(".m3u8")
  );
};

export const LessonPlayer = ({
  lesson,
  isCompleted,
  hasNext,
  hasPrevious,
  onComplete,
  onNext,
  onPrevious,
}: LessonPlayerProps) => {
  return (
    <div className="flex flex-col h-full">
      {/* Player */}
      <div className="flex-1 bg-black">
        {lesson.embedUrl ? (
          <EmbedPlayer embedUrl={lesson.embedUrl} />
        ) : hasValidStreamUrls(lesson.streamUrls) ? (
          <VideoPlayer
            streamUrls={lesson.streamUrls}
            channelName={lesson.title}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            URL do vídeo não configurada
          </div>
        )}
      </div>

      {/* Info e controles */}
      <div className="p-4 bg-card border-t">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold">{lesson.title}</h2>
            {lesson.description && (
              <p className="text-muted-foreground mt-1">{lesson.description}</p>
            )}
          </div>
          {isCompleted && (
            <div className="flex items-center gap-2 text-green-500 flex-shrink-0">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm">Concluída</span>
            </div>
          )}
        </div>

        {/* Navegação */}
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={!hasPrevious}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Anterior
          </Button>

          {!isCompleted && (
            <Button onClick={onComplete} className="gap-2">
              <CheckCircle className="w-4 h-4" />
              Marcar como concluída
            </Button>
          )}

          <Button
            variant={hasNext ? "default" : "outline"}
            onClick={onNext}
            disabled={!hasNext}
            className="gap-2"
          >
            Próxima
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
