import { useState, useMemo, useRef, useEffect } from "react";
import { ChevronDown, Play, CheckCircle2 } from "lucide-react";
import type { CourseModule, CourseLesson } from "@/hooks/useCourses";

interface Props {
  courseTitle: string;
  modules: CourseModule[];
  getLessonsForModule: (moduleId: string) => CourseLesson[];
  isLessonCompleted: (lessonId: string) => boolean;
  onPlayLesson?: (lesson: CourseLesson) => void;
}

/**
 * Bloco "EPISÓDIOS" inspirado no SeriesDetail, adaptado para Cursos:
 * Módulo = Temporada, Aula = Episódio.
 * Mostra até 3 aulas inicialmente; o restante é revelado por um botão "Exibir mais".
 */
export const LessonsSeriesView = ({
  courseTitle,
  modules,
  getLessonsForModule,
  isLessonCompleted,
  onPlayLesson,
}: Props) => {
  const [selectedModuleId, setSelectedModuleId] = useState<string>(modules[0]?.id || "");
  const [showAll, setShowAll] = useState(false);

  // If modules update (e.g., async load), default to first available.
  useEffect(() => {
    if (!selectedModuleId && modules[0]) setSelectedModuleId(modules[0].id);
  }, [modules, selectedModuleId]);

  const seasonIndex = useMemo(
    () => Math.max(0, modules.findIndex((m) => m.id === selectedModuleId)),
    [modules, selectedModuleId],
  );
  const lessonsForModule = useMemo(
    () => (selectedModuleId ? getLessonsForModule(selectedModuleId) : []),
    [selectedModuleId, getLessonsForModule],
  );

  const visible = showAll ? lessonsForModule : lessonsForModule.slice(0, 3);

  const formatCode = (season: number, ep: number) =>
    `S${String(season).padStart(2, "0")}E${String(ep).padStart(4, "0")}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-black text-foreground tracking-wide uppercase">Episódios</h2>
        {modules.length > 0 && (
          <ModuleDropdown
            modules={modules}
            selectedId={selectedModuleId}
            onSelect={(id) => {
              setSelectedModuleId(id);
              setShowAll(false);
            }}
          />
        )}
      </div>

      <div className="space-y-4">
        {visible.map((lesson, idx) => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            episodeNum={idx + 1}
            seasonNum={seasonIndex + 1}
            courseTitle={courseTitle}
            completed={isLessonCompleted(lesson.id)}
            onPlay={() => onPlayLesson?.(lesson)}
            formatCode={formatCode}
          />
        ))}
      </div>

      {lessonsForModule.length === 0 && (
        <p className="text-muted-foreground text-sm text-center py-8">
          Nenhuma aula neste módulo.
        </p>
      )}

      {!showAll && lessonsForModule.length > 3 && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground font-black uppercase tracking-wider text-sm py-5 mt-2 border-t border-border transition"
        >
          Exibir mais episódios
          <ChevronDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

const ModuleDropdown = ({
  modules,
  selectedId,
  onSelect,
}: {
  modules: CourseModule[];
  selectedId: string;
  onSelect: (id: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selectedIdx = Math.max(0, modules.findIndex((m) => m.id === selectedId));

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 border border-border rounded-md px-4 py-2 text-sm text-foreground hover:bg-muted transition"
      >
        Temporada {selectedIdx + 1}
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 bg-popover border border-border rounded-lg shadow-xl z-40 min-w-[220px] max-h-[320px] overflow-y-auto">
          {modules.map((m, i) => (
            <button
              key={m.id}
              onClick={() => {
                onSelect(m.id);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition ${
                m.id === selectedId ? "text-primary font-bold" : "text-foreground"
              }`}
            >
              <div className="font-medium">Temporada {i + 1}</div>
              <div className="text-[11px] text-muted-foreground truncate">{m.title}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const LessonCard = ({
  lesson,
  episodeNum,
  seasonNum,
  courseTitle,
  completed,
  onPlay,
  formatCode,
}: {
  lesson: CourseLesson;
  episodeNum: number;
  seasonNum: number;
  courseTitle: string;
  completed: boolean;
  onPlay: () => void;
  formatCode: (season: number, ep: number) => string;
}) => (
  <button
    onClick={onPlay}
    className="w-full flex items-start gap-5 p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/40 transition text-left group"
  >
    {/* Thumbnail */}
    <div className="relative w-40 md:w-48 aspect-video rounded-lg overflow-hidden shrink-0 bg-muted">
      <div className="w-full h-full bg-gradient-to-br from-primary/20 via-muted to-muted-foreground/10 flex items-center justify-center">
        <Play className="w-7 h-7 text-primary/70 fill-primary/70" />
      </div>
      <div className="absolute bottom-1.5 right-1.5 bg-primary/90 text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded">
        {episodeNum}
      </div>
      {completed && (
        <div className="absolute top-1.5 left-1.5 bg-green-500 rounded-full p-0.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
        </div>
      )}
    </div>

    {/* Info */}
    <div className="flex-1 min-w-0 py-0.5">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-black text-foreground text-sm md:text-base group-hover:text-primary transition">
          {episodeNum}. {courseTitle} - {formatCode(seasonNum, episodeNum)}
        </h3>
        {lesson.durationMinutes && (
          <span className="text-xs text-muted-foreground shrink-0 mt-0.5 font-medium">
            {lesson.durationMinutes} min
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground mt-1 font-medium truncate">{lesson.title}</p>
      {lesson.description && (
        <p className="text-sm text-muted-foreground mt-2 line-clamp-3 leading-relaxed">
          {lesson.description}
        </p>
      )}
    </div>
  </button>
);