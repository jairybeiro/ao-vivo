import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { useCoursesAdmin, Course, CourseModule, CourseLesson } from "@/hooks/useCourses";
import { CourseForm } from "./CourseForm";
import { ModuleForm } from "./ModuleForm";
import { LessonForm } from "./LessonForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DBModule {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

interface DBLesson {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  stream_urls: string[];
  embed_url: string | null;
  duration_minutes: number | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export const CourseManager = () => {
  const {
    courses,
    loading,
    refetch,
    createCourse,
    updateCourse,
    deleteCourse,
    createModule,
    updateModule,
    deleteModule,
    createLesson,
    updateLesson,
    deleteLesson,
  } = useCoursesAdmin();

  const [courseModules, setCourseModules] = useState<Record<string, CourseModule[]>>({});
  const [moduleLessons, setModuleLessons] = useState<Record<string, CourseLesson[]>>({});
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Dialog states
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | undefined>();
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<CourseModule | undefined>();
  const [currentCourseId, setCurrentCourseId] = useState<string>("");
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<CourseLesson | undefined>();
  const [currentModuleId, setCurrentModuleId] = useState<string>("");

  const fetchModulesForCourse = async (courseId: string) => {
    const { data, error } = await supabase
      .from("course_modules")
      .select("*")
      .eq("course_id", courseId)
      .order("order_index", { ascending: true });

    if (!error && data) {
      setCourseModules((prev) => ({
        ...prev,
        [courseId]: (data as DBModule[]).map((m) => ({
          id: m.id,
          courseId: m.course_id,
          title: m.title,
          description: m.description,
          orderIndex: m.order_index,
          createdAt: m.created_at,
          updatedAt: m.updated_at,
        })),
      }));
    }
  };

  const fetchLessonsForModule = async (moduleId: string) => {
    const { data, error } = await supabase
      .from("course_lessons")
      .select("*")
      .eq("module_id", moduleId)
      .order("order_index", { ascending: true });

    if (!error && data) {
      setModuleLessons((prev) => ({
        ...prev,
        [moduleId]: (data as DBLesson[]).map((l) => ({
          id: l.id,
          moduleId: l.module_id,
          title: l.title,
          description: l.description,
          streamUrls: l.stream_urls,
          embedUrl: l.embed_url,
          durationMinutes: l.duration_minutes,
          orderIndex: l.order_index,
          createdAt: l.created_at,
          updatedAt: l.updated_at,
        })),
      }));
    }
  };

  const toggleCourse = async (courseId: string) => {
    const newExpanded = new Set(expandedCourses);
    if (newExpanded.has(courseId)) {
      newExpanded.delete(courseId);
    } else {
      newExpanded.add(courseId);
      if (!courseModules[courseId]) {
        await fetchModulesForCourse(courseId);
      }
    }
    setExpandedCourses(newExpanded);
  };

  const toggleModule = async (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
      if (!moduleLessons[moduleId]) {
        await fetchLessonsForModule(moduleId);
      }
    }
    setExpandedModules(newExpanded);
  };

  // Handlers
  const handleCreateCourse = async (data: Omit<Course, "id" | "createdAt" | "updatedAt">) => {
    await createCourse(data);
    toast.success("Curso criado com sucesso!");
  };

  const handleUpdateCourse = async (data: Omit<Course, "id" | "createdAt" | "updatedAt">) => {
    if (editingCourse) {
      await updateCourse(editingCourse.id, data);
      toast.success("Curso atualizado!");
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (confirm("Tem certeza? Todos os módulos e aulas serão excluídos.")) {
      await deleteCourse(id);
      toast.success("Curso excluído!");
    }
  };

  const handleCreateModule = async (data: Omit<CourseModule, "id" | "createdAt" | "updatedAt">) => {
    await createModule(data);
    await fetchModulesForCourse(currentCourseId);
    toast.success("Módulo criado!");
  };

  const handleUpdateModule = async (data: Omit<CourseModule, "id" | "createdAt" | "updatedAt">) => {
    if (editingModule) {
      await updateModule(editingModule.id, data);
      await fetchModulesForCourse(currentCourseId);
      toast.success("Módulo atualizado!");
    }
  };

  const handleDeleteModule = async (id: string, courseId: string) => {
    if (confirm("Tem certeza? Todas as aulas deste módulo serão excluídas.")) {
      await deleteModule(id);
      await fetchModulesForCourse(courseId);
      toast.success("Módulo excluído!");
    }
  };

  const handleCreateLesson = async (data: Omit<CourseLesson, "id" | "createdAt" | "updatedAt">) => {
    await createLesson(data);
    await fetchLessonsForModule(currentModuleId);
    toast.success("Aula criada!");
  };

  const handleUpdateLesson = async (data: Omit<CourseLesson, "id" | "createdAt" | "updatedAt">) => {
    if (editingLesson) {
      await updateLesson(editingLesson.id, data);
      await fetchLessonsForModule(currentModuleId);
      toast.success("Aula atualizada!");
    }
  };

  const handleDeleteLesson = async (id: string, moduleId: string) => {
    if (confirm("Tem certeza que deseja excluir esta aula?")) {
      await deleteLesson(id);
      await fetchLessonsForModule(moduleId);
      toast.success("Aula excluída!");
    }
  };

  const openModuleDialog = (courseId: string, module?: CourseModule) => {
    setCurrentCourseId(courseId);
    setEditingModule(module);
    setModuleDialogOpen(true);
  };

  const openLessonDialog = (moduleId: string, lesson?: CourseLesson) => {
    setCurrentModuleId(moduleId);
    setEditingLesson(lesson);
    setLessonDialogOpen(true);
  };

  if (loading) {
    return <div className="animate-pulse p-4">Carregando cursos...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gerenciar Cursos</CardTitle>
        <Button
          onClick={() => {
            setEditingCourse(undefined);
            setCourseDialogOpen(true);
          }}
          size="sm"
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Curso
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {courses.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Nenhum curso cadastrado
          </p>
        ) : (
          courses.map((course) => (
            <Collapsible
              key={course.id}
              open={expandedCourses.has(course.id)}
              onOpenChange={() => toggleCourse(course.id)}
            >
              <div className="border rounded-lg">
                <CollapsibleTrigger asChild>
                  <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-accent/50">
                    {expandedCourses.has(course.id) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{course.title}</span>
                        <Badge variant={course.isActive ? "default" : "secondary"}>
                          {course.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{course.category}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCourse(course);
                          setCourseDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCourse(course.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="border-t px-3 py-2 bg-accent/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Módulos</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openModuleDialog(course.id)}
                        className="gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Módulo
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {(courseModules[course.id] || []).map((module) => (
                        <Collapsible
                          key={module.id}
                          open={expandedModules.has(module.id)}
                          onOpenChange={() => toggleModule(module.id)}
                        >
                          <div className="border rounded bg-card">
                            <CollapsibleTrigger asChild>
                              <div className="flex items-center gap-2 p-2 cursor-pointer hover:bg-accent/50">
                                <GripVertical className="w-4 h-4 text-muted-foreground" />
                                {expandedModules.has(module.id) ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                                <span className="flex-1 text-sm">{module.title}</span>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openModuleDialog(course.id, module);
                                    }}
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteModule(module.id, course.id);
                                    }}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </CollapsibleTrigger>

                            <CollapsibleContent>
                              <div className="border-t px-2 py-2 bg-accent/10">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs text-muted-foreground">Aulas</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openLessonDialog(module.id)}
                                    className="gap-1 h-6 text-xs"
                                  >
                                    <Plus className="w-3 h-3" />
                                    Aula
                                  </Button>
                                </div>

                                <div className="space-y-1">
                                  {(moduleLessons[module.id] || []).map((lesson) => (
                                    <div
                                      key={lesson.id}
                                      className="flex items-center gap-2 p-2 bg-card rounded text-sm"
                                    >
                                      <GripVertical className="w-3 h-3 text-muted-foreground" />
                                      <span className="flex-1 truncate">{lesson.title}</span>
                                      {lesson.durationMinutes && (
                                        <span className="text-xs text-muted-foreground">
                                          {lesson.durationMinutes}min
                                        </span>
                                      )}
                                      <div className="flex gap-1">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6"
                                          onClick={() => openLessonDialog(module.id, lesson)}
                                        >
                                          <Edit className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6"
                                          onClick={() => handleDeleteLesson(lesson.id, module.id)}
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                  {(moduleLessons[module.id] || []).length === 0 && (
                                    <p className="text-xs text-muted-foreground text-center py-2">
                                      Nenhuma aula
                                    </p>
                                  )}
                                </div>
                              </div>
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
                      ))}
                      {(courseModules[course.id] || []).length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-3">
                          Nenhum módulo
                        </p>
                      )}
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))
        )}
      </CardContent>

      {/* Course Dialog */}
      <Dialog open={courseDialogOpen} onOpenChange={setCourseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCourse ? "Editar Curso" : "Novo Curso"}</DialogTitle>
          </DialogHeader>
          <CourseForm
            course={editingCourse}
            onSubmit={editingCourse ? handleUpdateCourse : handleCreateCourse}
            onCancel={() => setCourseDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Module Dialog */}
      <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingModule ? "Editar Módulo" : "Novo Módulo"}</DialogTitle>
          </DialogHeader>
          <ModuleForm
            module={editingModule}
            courseId={currentCourseId}
            orderIndex={(courseModules[currentCourseId]?.length || 0)}
            onSubmit={editingModule ? handleUpdateModule : handleCreateModule}
            onCancel={() => setModuleDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLesson ? "Editar Aula" : "Nova Aula"}</DialogTitle>
          </DialogHeader>
          <LessonForm
            lesson={editingLesson}
            moduleId={currentModuleId}
            orderIndex={(moduleLessons[currentModuleId]?.length || 0)}
            onSubmit={editingLesson ? handleUpdateLesson : handleCreateLesson}
            onCancel={() => setLessonDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
};
