import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCourseDetails, CourseLesson } from "@/hooks/useCourses";
import { useAuth } from "@/hooks/useAuth";
import { ModuleAccordion } from "@/components/courses/ModuleAccordion";
import { LessonPlayer } from "@/components/courses/LessonPlayer";

const CourseView = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
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

  // Ordenar todas as aulas em sequência
  const allLessonsOrdered = useMemo(() => {
    const ordered: CourseLesson[] = [];
    modules.forEach((module) => {
      const moduleLessons = getLessonsForModule(module.id);
      ordered.push(...moduleLessons);
    });
    return ordered;
  }, [modules, lessons]);

  // Definir aula inicial: prioriza aula com progresso parcial, depois primeira não concluída
  useEffect(() => {
    if (!currentLesson && allLessonsOrdered.length > 0) {
      // 1. Procurar aula com progresso parcial (segundos assistidos > 0 e não concluída)
      const lessonInProgress = allLessonsOrdered.find((l) => {
        const watchedSeconds = getWatchedSeconds(l.id);
        return watchedSeconds > 0 && !isLessonCompleted(l.id);
      });

      if (lessonInProgress) {
        setCurrentLesson(lessonInProgress);
        return;
      }

      // 2. Se não houver aula em progresso, pegar a primeira não concluída
      const firstIncomplete = allLessonsOrdered.find((l) => !isLessonCompleted(l.id));
      
      if (firstIncomplete) {
        setCurrentLesson(firstIncomplete);
        return;
      }

      // 3. Se todas estiverem concluídas, voltar para a primeira
      setCurrentLesson(allLessonsOrdered[0]);
    }
  }, [allLessonsOrdered, currentLesson, getWatchedSeconds, isLessonCompleted]);

  // Redirecionar se não autenticado
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/premium/login");
    }
  }, [authLoading, user, navigate]);

  // Calculate navigation helpers
  const currentIndex = currentLesson
    ? allLessonsOrdered.findIndex((l) => l.id === currentLesson.id)
    : -1;
  const hasNext = currentIndex >= 0 && currentIndex < allLessonsOrdered.length - 1;
  const hasPrevious = currentIndex > 0;
  const nextLesson = hasNext ? allLessonsOrdered[currentIndex + 1] : null;

  // Callbacks - must be before any returns
  const handleTimeUpdate = useCallback((currentTime: number) => {
    if (currentLesson) {
      saveWatchedSeconds(currentLesson.id, currentTime);
    }
  }, [currentLesson, saveWatchedSeconds]);

  const handleNext = useCallback(() => {
    if (hasNext) {
      setCurrentLesson(allLessonsOrdered[currentIndex + 1]);
    }
  }, [hasNext, allLessonsOrdered, currentIndex]);

  const handlePrevious = useCallback(() => {
    if (hasPrevious) {
      setCurrentLesson(allLessonsOrdered[currentIndex - 1]);
    }
  }, [hasPrevious, allLessonsOrdered, currentIndex]);

  const handleComplete = useCallback(async () => {
    if (currentLesson) {
      await markLessonComplete(currentLesson.id);
    }
  }, [currentLesson, markLessonComplete]);

  const handleSelectLesson = useCallback((lesson: CourseLesson) => {
    setCurrentLesson(lesson);
    setSidebarOpen(false);
  }, []);

  // Loading states - after all hooks
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
          <Button onClick={() => navigate("/premium")}>Voltar</Button>
        </div>
      </div>
    );
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header da sidebar */}
      <div className="p-4 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/premium")}
          className="gap-2 mb-3"
        >
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

      {/* Lista de módulos */}
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

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-80 border-r flex-col bg-card">
        <SidebarContent />
      </aside>

      {/* Conteúdo principal */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Header mobile */}
        <header className="lg:hidden flex items-center gap-3 p-3 border-b bg-card">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground truncate">{course.title}</p>
            <p className="font-medium truncate">{currentLesson?.title || "Selecione uma aula"}</p>
          </div>
        </header>

        {/* Player */}
        <div className="flex-1">
          {currentLesson ? (
            <LessonPlayer
              key={currentLesson.id}
              lesson={currentLesson}
              isCompleted={isLessonCompleted(currentLesson.id)}
              hasNext={hasNext}
              hasPrevious={hasPrevious}
              nextLessonTitle={nextLesson?.title}
              initialTime={getWatchedSeconds(currentLesson.id)}
              onComplete={handleComplete}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onTimeUpdate={handleTimeUpdate}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Selecione uma aula para começar
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CourseView;
