import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Layers, Play, Pause, X } from "lucide-react";
import type { CourseModule, CourseLesson } from "@/hooks/useCourses";

interface Props {
  modules: CourseModule[];
  getLessonsForModule: (moduleId: string) => CourseLesson[];
  isLessonCompleted: (lessonId: string) => boolean;
  currentLesson: CourseLesson | null;
  onSelectLesson: (lesson: CourseLesson) => void;
}

/**
 * Floating "Aulas" button + Netflix-style two-level (Modules → Lessons) overlay
 * rendered on top of the lesson player. Mirrors the SeriesDetail EpisodeOverlay
 * but adapted to Course modules/lessons. Does not modify the player itself.
 */
export const LessonsOverlayPanel = ({
  modules,
  getLessonsForModule,
  isLessonCompleted,
  currentLesson,
  onSelectLesson,
}: Props) => {
  const [open, setOpen] = useState(false);
  const currentModuleId = currentLesson?.moduleId || modules[0]?.id || "";
  const [view, setView] = useState<"modules" | "lessons">("lessons");
  const [selectedModuleId, setSelectedModuleId] = useState<string>(currentModuleId);

  useEffect(() => {
    if (currentLesson?.moduleId) setSelectedModuleId(currentLesson.moduleId);
  }, [currentLesson?.moduleId]);

  const hasMultipleModules = modules.length > 1;
  const moduleIdx = Math.max(0, modules.findIndex((m) => m.id === selectedModuleId));
  const lessons = selectedModuleId ? getLessonsForModule(selectedModuleId) : [];
  const activeIndex = currentLesson
    ? lessons.findIndex((l) => l.id === currentLesson.id)
    : -1;
  const before = activeIndex >= 0 ? lessons.slice(0, activeIndex) : [];
  const after = activeIndex >= 0 ? lessons.slice(activeIndex + 1) : lessons;
  const activeLesson = activeIndex >= 0 ? lessons[activeIndex] : null;

  const listRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open && view === "lessons" && activeRef.current && listRef.current) {
      const offsetTop = activeRef.current.offsetTop - listRef.current.offsetTop;
      listRef.current.scrollTo({ top: Math.max(0, offsetTop - 44), behavior: "auto" });
    }
  }, [open, view, currentLesson?.id]);

  return (
    <>
      {/* Floating trigger — top-right of the player container */}
      <button
        onClick={() => {
          setView("lessons");
          setOpen(true);
        }}
        className="absolute top-4 right-4 z-30 flex items-center gap-2 px-3.5 py-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur text-white text-sm font-medium border border-white/10 transition"
      >
        <Layers className="w-4 h-4" />
        Aulas
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-stretch justify-end"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md h-full bg-black/85 border-l border-white/10 flex flex-col p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-white/40 text-xs uppercase tracking-widest font-bold">Conteúdo</span>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {view === "modules" ? (
              <div className="space-y-3 flex-1 flex flex-col min-h-0">
                <h3 className="text-white font-bold text-base">Temporadas</h3>
                <div className="space-y-1 overflow-y-auto overscroll-contain pr-1 flex-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full">
                  {modules.map((m, i) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setSelectedModuleId(m.id);
                        setView("lessons");
                      }}
                      className={`w-full flex items-start gap-3 px-3 py-3 rounded-lg text-left transition ${
                        m.id === selectedModuleId
                          ? "bg-white/10 text-white font-semibold"
                          : "text-white/70 hover:bg-white/5"
                      }`}
                    >
                      {m.id === selectedModuleId && (
                        <svg
                          className="w-4 h-4 text-white shrink-0 mt-0.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                      <div className="min-w-0">
                        <div className="text-sm">Temporada {i + 1}</div>
                        <div className="text-[11px] text-white/40 truncate">{m.title}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3 flex-1 flex flex-col min-h-0">
                <div className="flex items-center gap-2">
                  {hasMultipleModules && (
                    <button
                      onClick={() => setView("modules")}
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 transition shrink-0"
                    >
                      <ArrowLeft className="w-4 h-4 text-white" />
                    </button>
                  )}
                  <h3 className="text-white font-bold text-base">Temporada {moduleIdx + 1}</h3>
                </div>

                <div
                  ref={listRef}
                  className="space-y-1 overflow-y-auto overscroll-contain pr-1 flex-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full"
                  style={{ scrollbarGutter: "stable" }}
                >
                  {before.map((l, i) => (
                    <LessonRow
                      key={l.id}
                      lesson={l}
                      number={i + 1}
                      completed={isLessonCompleted(l.id)}
                      onClick={() => {
                        onSelectLesson(l);
                        setOpen(false);
                      }}
                    />
                  ))}

                  {activeLesson && (
                    <div
                      ref={activeRef}
                      className="flex items-start gap-3 p-2 rounded-lg bg-white/10 ring-1 ring-primary/50"
                    >
                      <span className="w-5 text-center font-bold text-sm shrink-0 mt-3 text-primary">
                        {activeIndex + 1}
                      </span>
                      <div className="relative w-28 aspect-video rounded overflow-hidden shrink-0 bg-white/5 flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                            <Pause className="w-3.5 h-3.5 text-white fill-white" />
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 py-0.5">
                        <p className="text-sm font-medium text-white truncate">{activeLesson.title}</p>
                        {activeLesson.description && (
                          <p className="text-[11px] text-white/40 mt-1 line-clamp-2 leading-relaxed">
                            {activeLesson.description}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {after.map((l, i) => (
                    <LessonRow
                      key={l.id}
                      lesson={l}
                      number={(activeIndex >= 0 ? activeIndex + 1 : 0) + i + 1}
                      completed={isLessonCompleted(l.id)}
                      onClick={() => {
                        onSelectLesson(l);
                        setOpen(false);
                      }}
                    />
                  ))}

                  {lessons.length === 0 && (
                    <p className="text-white/40 text-sm text-center py-6">Nenhuma aula neste módulo.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

const LessonRow = ({
  lesson,
  number,
  completed,
  onClick,
}: {
  lesson: CourseLesson;
  number: number;
  completed: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left hover:bg-white/5 transition"
  >
    <span className={`w-5 text-center font-bold text-sm shrink-0 ${completed ? "text-green-500" : "text-white/40"}`}>
      {number}
    </span>
    <p className="text-sm text-white/70 truncate flex-1">{lesson.title}</p>
    {lesson.durationMinutes && (
      <span className="text-[11px] text-white/30 shrink-0">{lesson.durationMinutes}m</span>
    )}
  </button>
);