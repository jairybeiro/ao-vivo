import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Crown } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Course, CourseModule, CourseLesson } from "@/hooks/useCourses";
import { ModuleAccordion } from "./ModuleAccordion";
import { MobileLessonPlayer } from "./MobileLessonPlayer";
import { motion } from "framer-motion";

interface MobileCourseViewProps {
  course: Course;
  modules: CourseModule[];
  currentLesson: CourseLesson | null;
  allLessonsOrdered: CourseLesson[];
  hasNext: boolean;
  hasPrevious: boolean;
  nextLesson: CourseLesson | null;
  isLessonCompleted: (lessonId: string) => boolean;
  getLessonsForModule: (moduleId: string) => CourseLesson[];
  getWatchedSeconds: (lessonId: string) => number;
  getCourseProgress: () => number;
  onSelectLesson: (lesson: CourseLesson) => void;
  onComplete: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onTimeUpdate: (currentTime: number) => void;
  onBack: () => void;
}

export const MobileCourseView = ({
  course,
  modules,
  currentLesson,
  allLessonsOrdered,
  hasNext,
  hasPrevious,
  nextLesson,
  isLessonCompleted,
  getLessonsForModule,
  getWatchedSeconds,
  getCourseProgress,
  onSelectLesson,
  onComplete,
  onNext,
  onPrevious,
  onTimeUpdate,
  onBack,
}: MobileCourseViewProps) => {
  const navigate = useNavigate();
  const progress = getCourseProgress();

  // Fullscreen player when lesson is selected
  if (currentLesson) {
    return (
      <MobileLessonPlayer
        key={currentLesson.id}
        lesson={currentLesson}
        courseName={course.title}
        isCompleted={isLessonCompleted(currentLesson.id)}
        hasNext={hasNext}
        hasPrevious={hasPrevious}
        nextLessonTitle={nextLesson?.title}
        initialTime={getWatchedSeconds(currentLesson.id)}
        onComplete={onComplete}
        onNext={onNext}
        onPrevious={onPrevious}
        onTimeUpdate={onTimeUpdate}
        onBack={onBack}
      />
    );
  }

  // Course overview (no lesson playing)
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background pb-24"
    >
      {/* Header with glass effect */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/5">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate("/cursos")}
            className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{course.title}</p>
            <p className="text-[11px] text-muted-foreground">{progress}% concluído</p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/90">
            <Crown className="w-3 h-3 text-black" />
            <span className="text-[10px] font-bold text-black">Premium</span>
          </div>
        </div>
        {/* Thin progress bar */}
        <div className="h-[2px] bg-white/5">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Course hero thumbnail */}
      {course.thumbnailUrl && (
        <div className="relative mx-4 mt-4 rounded-2xl overflow-hidden aspect-video">
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <h1 className="text-xl font-bold text-white leading-tight">{course.title}</h1>
            {course.description && (
              <p className="text-xs text-white/60 mt-1 line-clamp-2">{course.description}</p>
            )}
          </div>
        </div>
      )}

      {!course.thumbnailUrl && (
        <div className="px-4 pt-5">
          <h1 className="text-xl font-bold">{course.title}</h1>
          {course.description && (
            <p className="text-sm text-muted-foreground mt-1">{course.description}</p>
          )}
        </div>
      )}

      {/* Progress card */}
      <div className="mx-4 mt-4 p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-white/5">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">Progresso</span>
          <span className="font-bold text-primary">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground mt-2">
          {allLessonsOrdered.filter((l) => isLessonCompleted(l.id)).length} de{" "}
          {allLessonsOrdered.length} aulas concluídas
        </p>
      </div>

      {/* Modules accordion with glass styling */}
      <div className="px-4 mt-6">
        <h2 className="text-base font-bold mb-3">Módulos</h2>
        <ModuleAccordion
          modules={modules}
          getLessonsForModule={getLessonsForModule}
          isLessonCompleted={isLessonCompleted}
          currentLessonId={currentLesson?.id}
          onSelectLesson={onSelectLesson}
        />
      </div>
    </motion.div>
  );
};
