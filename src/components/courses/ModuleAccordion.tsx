import { CheckCircle, Circle, Play, Clock } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { CourseModule, CourseLesson } from "@/hooks/useCourses";
import { cn } from "@/lib/utils";

interface ModuleAccordionProps {
  modules: CourseModule[];
  getLessonsForModule: (moduleId: string) => CourseLesson[];
  isLessonCompleted: (lessonId: string) => boolean;
  currentLessonId?: string;
  onSelectLesson: (lesson: CourseLesson) => void;
}

export const ModuleAccordion = ({
  modules,
  getLessonsForModule,
  isLessonCompleted,
  currentLessonId,
  onSelectLesson,
}: ModuleAccordionProps) => {
  const getModuleProgress = (moduleId: string) => {
    const lessons = getLessonsForModule(moduleId);
    if (lessons.length === 0) return 0;
    const completed = lessons.filter((l) => isLessonCompleted(l.id)).length;
    return Math.round((completed / lessons.length) * 100);
  };

  return (
    <Accordion type="multiple" className="w-full space-y-2">
      {modules.map((module, index) => {
        const lessons = getLessonsForModule(module.id);
        const progress = getModuleProgress(module.id);
        const completedCount = lessons.filter((l) => isLessonCompleted(l.id)).length;

        return (
          <AccordionItem
            key={module.id}
            value={module.id}
            className="border rounded-lg bg-card overflow-hidden"
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-accent/50">
              <div className="flex items-center gap-3 flex-1 text-left">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{module.title}</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <span>{lessons.length} aulas</span>
                    {progress > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {completedCount}/{lessons.length} concluídas
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-0">
              <div className="border-t">
                {lessons.map((lesson) => {
                  const isCompleted = isLessonCompleted(lesson.id);
                  const isCurrent = currentLessonId === lesson.id;

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => onSelectLesson(lesson)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/50 transition-colors border-b last:border-b-0",
                        isCurrent && "bg-primary/10",
                        isCompleted && "text-muted-foreground"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      ) : isCurrent ? (
                        <Play className="w-5 h-5 text-primary flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={cn("truncate", isCurrent && "font-medium text-primary")}>
                          {lesson.title}
                        </p>
                        {lesson.description && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {lesson.description}
                          </p>
                        )}
                      </div>
                      {lesson.durationMinutes && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                          <Clock className="w-3 h-3" />
                          <span>{lesson.durationMinutes} min</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};
