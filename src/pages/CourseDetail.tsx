import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCourseDetails } from "@/hooks/useCourses";
import { useUserCourses } from "@/hooks/useUserCourses";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import MainHeader from "@/components/MainHeader";
import PreviewPlayerModal from "@/components/courses/PreviewPlayerModal";
import { LessonsSeriesView } from "@/components/courses/LessonsSeriesView";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Play,
  BookOpen,
  Clock,
  User,
  GraduationCap,
  Layers,
  Monitor,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";

const CourseDetail = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { ownsCourse } = useUserCourses();
  const {
    course,
    modules,
    lessons,
    loading,
    getLessonsForModule,
    isLessonCompleted,
    getCourseProgress,
  } = useCourseDetails(courseId);

  const [showPreview, setShowPreview] = useState(false);

  const totalLessons = lessons.length;
  const totalMinutes = useMemo(
    () => lessons.reduce((sum, l) => sum + (l.durationMinutes || 0), 0),
    [lessons]
  );
  const progress = getCourseProgress();

  const hasAccess = !!user && ownsCourse(courseId || "");
  const isPaid = !!(course as any)?.priceCents && (course as any).priceCents > 0;
  const isFree = !isPaid;

  const handleAccessCourse = () => {
    if (!user) {
      navigate("/login", { state: { from: `/course/${courseId}` } });
      return;
    }
    if (hasAccess || isFree) {
      navigate(`/course/${course?.id}/player`);
      return;
    }
    // Paid course, not owned → checkout
    navigate(`/course/${course?.id}/checkout`);
  };

  const handlePlayLesson = (lessonId: string) => {
    if (!user) {
      navigate("/login", { state: { from: `/course/${courseId}` } });
      return;
    }
    if (!(hasAccess || isFree)) {
      navigate(`/course/${course?.id}/checkout`);
      return;
    }
    navigate(`/course/${course?.id}/player?lesson=${lessonId}`);
  };

  const ctaLabel = !user
    ? "Criar Conta para Acessar"
    : hasAccess || isFree
    ? progress > 0
      ? "Continuar Curso"
      : "Começar Agora"
    : isPaid
    ? `Comprar — R$ ${((course as any).priceCents / 100).toFixed(2).replace(".", ",")}`
    : "Acessar Curso";

  if (loading) {
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

  const heroImage = course.bannerUrl || course.thumbnailUrl;

  // ─── Mobile Layout ────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-24">
        {/* Hero */}
        <div className="relative w-full" style={{ height: "50vh", minHeight: 280 }}>
          {heroImage ? (
            <img src={heroImage} alt={course.title} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center">
              <BookOpen className="w-24 h-24 text-primary/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />

          {/* Back */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>

          {/* Info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5 space-y-2">
            {course.category && (
              <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-full backdrop-blur-sm">
                {course.category}
              </span>
            )}
            <h1 className="text-2xl font-bold leading-tight">{course.title}</h1>
            {course.instructorName && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <User className="w-3 h-3" /> por{" "}
                <span className="text-foreground font-medium">{course.instructorName}</span>
              </p>
            )}
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-4 px-5 py-4 border-b border-white/5 text-xs text-muted-foreground">
          {course.level && (
            <span className="flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-primary" />
              {course.level}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            {modules.length} módulos
          </span>
          <span className="flex items-center gap-1">
            <Monitor className="w-3.5 h-3.5" />
            {totalLessons} aulas
          </span>
          {totalMinutes > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {totalMinutes} min
            </span>
          )}
        </div>

        {/* Progress */}
        {progress > 0 && (
          <div className="px-5 pt-4">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">Seu progresso</span>
              <span className="font-semibold text-primary">{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}

        {/* Actions */}
        <div className="px-5 pt-5 space-y-3">
          <Button
            onClick={handleAccessCourse}
            className="w-full gap-2 rounded-xl h-12 text-base font-semibold"
            size="lg"
          >
            <Play className="w-5 h-5" fill="currentColor" />
            {ctaLabel}
          </Button>

          {course.previewVideoUrl && (
            <Button
              variant="outline"
              onClick={() => setShowPreview(true)}
              className="w-full gap-2 rounded-xl h-11 border-white/10"
            >
              <Play className="w-4 h-4" />
              Ver Preview
            </Button>
          )}
        </div>

        {/* Preview modal */}
        <AnimatePresence>
          {showPreview && course.previewVideoUrl && (
            <PreviewPlayerModal url={course.previewVideoUrl} onClose={() => setShowPreview(false)} />
          )}
        </AnimatePresence>

        {/* Description */}
        {course.description && (
          <div className="px-5 pt-5">
            <h3 className="text-sm font-semibold mb-2">Sobre o curso</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{course.description}</p>
          </div>
        )}

        {/* Modules / Lessons — Series-style */}
        <div className="px-5 pt-6">
          <LessonsSeriesView
            courseTitle={course.title}
            modules={modules}
            getLessonsForModule={getLessonsForModule}
            isLessonCompleted={isLessonCompleted}
            onPlayLesson={(l) => handlePlayLesson(l.id)}
          />
        </div>
      </div>
    );
  }

  // ─── Desktop Layout ───────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <MainHeader />

      {/* Hero section */}
      <div className="relative w-full" style={{ height: "60vh", minHeight: 420 }}>
        {heroImage ? (
          <img src={heroImage} alt={course.title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center">
            <BookOpen className="w-40 h-40 text-primary/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 pb-16 pl-12 pr-12">
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center gap-3">
              {course.category && (
                <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full backdrop-blur-sm">
                  {course.category}
                </span>
              )}
              {course.level && (
                <span className="text-xs px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-foreground/80">
                  {course.level}
                </span>
              )}
            </div>

            <h1 className="text-4xl font-bold leading-tight">{course.title}</h1>

            {course.description && (
              <p className="text-base text-muted-foreground leading-relaxed line-clamp-3">
                {course.description}
              </p>
            )}

            {course.instructorName && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <User className="w-4 h-4" />
                por <span className="text-foreground font-medium">{course.instructorName}</span>
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                {modules.length} módulos
              </span>
              <span className="flex items-center gap-1.5">
                <Monitor className="w-4 h-4" />
                {totalLessons} aulas
              </span>
              {totalMinutes > 0 && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {totalMinutes} min
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={handleAccessCourse}
                className="gap-2 rounded-full px-8"
                size="lg"
              >
                <Play className="w-5 h-5" fill="currentColor" />
                {ctaLabel}
              </Button>
              {course.previewVideoUrl && (
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(true)}
                  className="gap-2 rounded-full px-6 border-white/10"
                  size="lg"
                >
                  <Play className="w-4 h-4" />
                  Preview
                </Button>
              )}
            </div>

            {/* Progress bar */}
            {progress > 0 && (
              <div className="max-w-xs pt-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-semibold text-primary">{progress}%</span>
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview modal (desktop) */}
      <AnimatePresence>
        {showPreview && course.previewVideoUrl && (
          <PreviewPlayerModal url={course.previewVideoUrl} onClose={() => setShowPreview(false)} />
        )}
      </AnimatePresence>

      {/* Course content */}
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Modules / Lessons — Series-style */}
          <div className="lg:col-span-2">
            {course.description && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-foreground mb-3">Sinopse do conteúdo</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">{course.description}</p>
              </div>
            )}
            <LessonsSeriesView
              courseTitle={course.title}
              modules={modules}
              getLessonsForModule={getLessonsForModule}
              isLessonCompleted={isLessonCompleted}
              onPlayLesson={(l) => handlePlayLesson(l.id)}
            />
          </div>

          {/* Sidebar card */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 rounded-2xl border border-white/5 bg-card/60 backdrop-blur-sm p-6 space-y-5">
              {course.thumbnailUrl && (
                <img
                  src={course.thumbnailUrl}
                  alt={course.title}
                  className="w-full aspect-[3/4] object-cover rounded-xl"
                />
              )}
              <div className="space-y-3">
                <Button
                  onClick={handleAccessCourse}
                  className="w-full gap-2 rounded-xl h-12 text-base font-semibold"
                  size="lg"
                >
                  <Play className="w-5 h-5" fill="currentColor" />
                  {ctaLabel}
                </Button>
              </div>

              <div className="space-y-3 text-sm pt-2 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Nível</span>
                  <span className="font-medium">{course.level || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Módulos</span>
                  <span className="font-medium">{modules.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Aulas</span>
                  <span className="font-medium">{totalLessons}</span>
                </div>
                {totalMinutes > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Duração</span>
                    <span className="font-medium">{totalMinutes} min</span>
                  </div>
                )}
                {course.instructorName && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Instrutor</span>
                    <span className="font-medium">{course.instructorName}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
