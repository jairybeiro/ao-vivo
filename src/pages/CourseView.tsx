import { useState, useEffect, useMemo } from "react";
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

  // Definir primeira aula como padrão
  useEffect(() => {
    if (!currentLesson && allLessonsOrdered.length > 0) {
      // Encontrar primeira aula não concluída ou a primeira
      const firstIncomplete = allLessonsOrdered.find((l) => !isLessonCompleted(l.id));
      setCurrentLesson(firstIncomplete || allLessonsOrdered[0]);
    }
  }, [allLessonsOrdered, currentLesson]);

  // Redirecionar se não autenticado
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/premium/login");
    }
  }, [authLoading, user, navigate]);

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

  const currentIndex = currentLesson
    ? allLessonsOrdered.findIndex((l) => l.id === currentLesson.id)
    : -1;
  const hasNext = currentIndex < allLessonsOrdered.length - 1;
  const hasPrevious = currentIndex > 0;
  const nextLesson = hasNext ? allLessonsOrdered[currentIndex + 1] : null;

  const handleNext = () => {
    if (hasNext) {
      setCurrentLesson(allLessonsOrdered[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    if (hasPrevious) {
      setCurrentLesson(allLessonsOrdered[currentIndex - 1]);
    }
  };

  const handleComplete = async () => {
    if (currentLesson) {
      await markLessonComplete(currentLesson.id);
    }
  };

  const handleSelectLesson = (lesson: CourseLesson) => {
    setCurrentLesson(lesson);
    setSidebarOpen(false);
  };

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
              lesson={currentLesson}
              isCompleted={isLessonCompleted(currentLesson.id)}
              hasNext={hasNext}
              hasPrevious={hasPrevious}
              nextLessonTitle={nextLesson?.title}
              onComplete={handleComplete}
              onNext={handleNext}
              onPrevious={handlePrevious}
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
