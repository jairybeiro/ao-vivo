import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Menu, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCourseDetails, CourseLesson } from "@/hooks/useCourses";
import { useAuth } from "@/hooks/useAuth";
import { ModuleAccordion } from "@/components/courses/ModuleAccordion";
import { DesktopLessonPlayer } from "@/components/courses/DesktopLessonPlayer";
import { MobileLessonPlayer } from "@/components/courses/MobileLessonPlayer";
import { MobileCourseView } from "@/components/courses/MobileCourseView";
import { LessonsOverlayPanel } from "@/components/courses/LessonsOverlayPanel";
import { useIsMobile } from "@/hooks/use-mobile";

const CourseView = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedLessonId = searchParams.get("lesson");
  const { user, loading: authLoading } = useAuth();
  const {
    course,
    modules,
    lessons,
    loading,
    markLessonComplete,
    saveWatchedSeconds,
    getWatchedSeconds,
    getLessonsForModule,
    isLessonCompleted,
    getCourseProgress,
  } = useCourseDetails(courseId);

  const [currentLesson, setCurrentLesson] = useState<CourseLesson | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userExitedPlayer, setUserExitedPlayer] = useState(false);
  const isMobile = useIsMobile();

  const allLessonsOrdered = useMemo(() => {
    const ordered: CourseLesson[] = [];
    modules.forEach((module) => {
      const moduleLessons = getLessonsForModule(module.id);
      ordered.push(...moduleLessons);
    });
    return ordered;
  }, [modules, lessons]);

  // Auto-select lesson
  useEffect(() => {
    if (!currentLesson && allLessonsOrdered.length > 0 && !userExitedPlayer) {
      // 1) Honor explicit ?lesson=<id> from URL
      if (requestedLessonId) {
        const requested = allLessonsOrdered.find((l) => l.id === requestedLessonId);
        if (requested) {
          setCurrentLesson(requested);
          return;
        }
      }

      const lessonInProgress = allLessonsOrdered.find((l) => {
        const watchedSeconds = getWatchedSeconds(l.id);
        return watchedSeconds > 0 && !isLessonCompleted(l.id);
      });
      if (lessonInProgress) { setCurrentLesson(lessonInProgress); return; }

      const firstIncomplete = allLessonsOrdered.find((l) => !isLessonCompleted(l.id));
      if (firstIncomplete) { setCurrentLesson(firstIncomplete); return; }

      setCurrentLesson(allLessonsOrdered[0]);
    }
  }, [allLessonsOrdered, currentLesson, getWatchedSeconds, isLessonCompleted, userExitedPlayer, requestedLessonId]);

  const currentIndex = currentLesson
    ? allLessonsOrdered.findIndex((l) => l.id === currentLesson.id)
    : -1;
  const hasNext = currentIndex >= 0 && currentIndex < allLessonsOrdered.length - 1;
  const hasPrevious = currentIndex > 0;
  const nextLesson = hasNext ? allLessonsOrdered[currentIndex + 1] : null;

  const handleTimeUpdate = useCallback((currentTime: number) => {
    if (currentLesson) saveWatchedSeconds(currentLesson.id, currentTime);
  }, [currentLesson, saveWatchedSeconds]);

  const handleNext = useCallback(() => {
    if (hasNext) setCurrentLesson(allLessonsOrdered[currentIndex + 1]);
  }, [hasNext, allLessonsOrdered, currentIndex]);

  const handlePrevious = useCallback(() => {
    if (hasPrevious) setCurrentLesson(allLessonsOrdered[currentIndex - 1]);
  }, [hasPrevious, allLessonsOrdered, currentIndex]);

  const handleComplete = useCallback(async () => {
    if (currentLesson) await markLessonComplete(currentLesson.id);
  }, [currentLesson, markLessonComplete]);

  const handleSelectLesson = useCallback((lesson: CourseLesson) => {
    setUserExitedPlayer(false);
    setCurrentLesson(lesson);
    setSidebarOpen(false);
  }, []);

  const handleBackFromMobile = useCallback(() => {
    setUserExitedPlayer(true);
    setCurrentLesson(null);
  }, []);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Curso não encontrado</p>
          <Button onClick={() => navigate("/cursos")}>Voltar</Button>
        </div>
      </div>
    );
  }

  // Mobile: delegate to MobileCourseView
  if (isMobile) {
    return (
      <MobileCourseView
        course={course}
        modules={modules}
        currentLesson={currentLesson}
        allLessonsOrdered={allLessonsOrdered}
        hasNext={hasNext}
        hasPrevious={hasPrevious}
        nextLesson={nextLesson}
        isLessonCompleted={isLessonCompleted}
        getLessonsForModule={getLessonsForModule}
        getWatchedSeconds={getWatchedSeconds}
        getCourseProgress={getCourseProgress}
        onSelectLesson={handleSelectLesson}
        onComplete={handleComplete}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onTimeUpdate={handleTimeUpdate}
        onBack={handleBackFromMobile}
      />
    );
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <Button variant="ghost" size="sm" onClick={() => navigate("/cursos")} className="gap-2 mb-3">
          <ArrowLeft className="w-4 h-4" />
          Voltar aos cursos
        </Button>
        <h2 className="font-semibold text-lg line-clamp-2">{course.title}</h2>
        <div className="mt-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">Progresso do curso</span>
            <span className="font-medium">{getCourseProgress()}%</span>
          </div>
          <Progress value={getCourseProgress()} className="h-2" />
        </div>
      </div>
      <ScrollArea className="flex-1 p-4">
        <ModuleAccordion
          modules={modules}
          getLessonsForModule={getLessonsForModule}
          isLessonCompleted={isLessonCompleted}
          currentLessonId={currentLesson?.id}
          onSelectLesson={handleSelectLesson}
        />
      </ScrollArea>
    </div>
  );

  // Desktop: fullscreen player mode
  if (currentLesson) {
    return (
      <div className="min-h-screen bg-black flex">
        <aside className="hidden lg:flex w-80 border-r border-white/10 flex-col bg-card/95 backdrop-blur">
          <SidebarContent />
        </aside>
        <main className="flex-1 h-screen relative">
          <DesktopLessonPlayer
            key={currentLesson.id}
            lesson={currentLesson}
            courseName={course.title}
            isCompleted={isLessonCompleted(currentLesson.id)}
            hasNext={hasNext}
            hasPrevious={hasPrevious}
            nextLessonTitle={nextLesson?.title}
            initialTime={getWatchedSeconds(currentLesson.id)}
            onComplete={handleComplete}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onTimeUpdate={handleTimeUpdate}
            onBack={() => navigate("/cursos")}
          />
          {/* Netflix-style modules/lessons overlay (mirrors SeriesDetail player) */}
          <LessonsOverlayPanel
            modules={modules}
            getLessonsForModule={getLessonsForModule}
            isLessonCompleted={isLessonCompleted}
            currentLesson={currentLesson}
            onSelectLesson={handleSelectLesson}
          />
        </main>
      </div>
    );
  }

  // Desktop: no lesson selected
  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden lg:flex w-80 border-r flex-col bg-card">
        <SidebarContent />
      </aside>
      <main className="flex-1 flex flex-col min-h-screen">
        <header className="lg:hidden flex items-center gap-3 p-3 border-b bg-card">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon"><Menu className="w-5 h-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground truncate">{course.title}</p>
            <p className="font-medium truncate">Selecione uma aula</p>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          Selecione uma aula para começar
        </div>
      </main>
    </div>
  );
};

export default CourseView;
