import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseLesson {
  id: string;
  moduleId: string;
  title: string;
  description: string | null;
  streamUrls: string[];
  embedUrl: string | null;
  durationMinutes: number | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserLessonProgress {
  id: string;
  lessonId: string;
  completed: boolean;
  watchedSeconds: number;
  completedAt: string | null;
}

interface DBCourse {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

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

interface DBProgress {
  id: string;
  lesson_id: string;
  completed: boolean;
  watched_seconds: number;
  completed_at: string | null;
}

const mapCourse = (db: DBCourse): Course => ({
  id: db.id,
  title: db.title,
  description: db.description,
  thumbnailUrl: db.thumbnail_url,
  category: db.category,
  isActive: db.is_active,
  createdAt: db.created_at,
  updatedAt: db.updated_at,
});

const mapModule = (db: DBModule): CourseModule => ({
  id: db.id,
  courseId: db.course_id,
  title: db.title,
  description: db.description,
  orderIndex: db.order_index,
  createdAt: db.created_at,
  updatedAt: db.updated_at,
});

const mapLesson = (db: DBLesson): CourseLesson => ({
  id: db.id,
  moduleId: db.module_id,
  title: db.title,
  description: db.description,
  streamUrls: db.stream_urls,
  embedUrl: db.embed_url,
  durationMinutes: db.duration_minutes,
  orderIndex: db.order_index,
  createdAt: db.created_at,
  updatedAt: db.updated_at,
});

const mapProgress = (db: DBProgress): UserLessonProgress => ({
  id: db.id,
  lessonId: db.lesson_id,
  completed: db.completed,
  watchedSeconds: db.watched_seconds,
  completedAt: db.completed_at,
});

// Hook para usuários visualizarem cursos
export const useCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar cursos:", error);
    } else {
      setCourses((data as DBCourse[]).map(mapCourse));
    }
    setLoading(false);
  };

  return { courses, loading, refetch: fetchCourses };
};

// Hook para buscar detalhes de um curso com módulos e aulas
export const useCourseDetails = (courseId: string | undefined) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [lessons, setLessons] = useState<CourseLesson[]>([]);
  const [progress, setProgress] = useState<UserLessonProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId) {
      fetchCourseDetails();
    }
  }, [courseId]);

  const fetchCourseDetails = async () => {
    if (!courseId) return;
    
    setLoading(true);

    // Buscar curso
    const { data: courseData, error: courseError } = await supabase
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .maybeSingle();

    if (courseError) {
      console.error("Erro ao buscar curso:", courseError);
      setLoading(false);
      return;
    }

    if (courseData) {
      setCourse(mapCourse(courseData as DBCourse));
    }

    // Buscar módulos
    const { data: modulesData, error: modulesError } = await supabase
      .from("course_modules")
      .select("*")
      .eq("course_id", courseId)
      .order("order_index", { ascending: true });

    if (modulesError) {
      console.error("Erro ao buscar módulos:", modulesError);
    } else {
      const mappedModules = (modulesData as DBModule[]).map(mapModule);
      setModules(mappedModules);

      // Buscar aulas de todos os módulos
      const moduleIds = mappedModules.map((m) => m.id);
      if (moduleIds.length > 0) {
        const { data: lessonsData, error: lessonsError } = await supabase
          .from("course_lessons")
          .select("*")
          .in("module_id", moduleIds)
          .order("order_index", { ascending: true });

        if (lessonsError) {
          console.error("Erro ao buscar aulas:", lessonsError);
        } else {
          setLessons((lessonsData as DBLesson[]).map(mapLesson));
        }
      }
    }

    // Buscar progresso do usuário
    const { data: progressData, error: progressError } = await supabase
      .from("user_lesson_progress")
      .select("*");

    if (!progressError && progressData) {
      setProgress((progressData as DBProgress[]).map(mapProgress));
    }

    setLoading(false);
  };

  const markLessonComplete = async (lessonId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const existingProgress = progress.find((p) => p.lessonId === lessonId);

    if (existingProgress) {
      await supabase
        .from("user_lesson_progress")
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq("id", existingProgress.id);
    } else {
      await supabase.from("user_lesson_progress").insert({
        user_id: user.id,
        lesson_id: lessonId,
        completed: true,
        completed_at: new Date().toISOString(),
      });
    }

    await fetchCourseDetails();
  };

  const getLessonsForModule = (moduleId: string) => {
    return lessons.filter((l) => l.moduleId === moduleId);
  };

  const isLessonCompleted = (lessonId: string) => {
    return progress.some((p) => p.lessonId === lessonId && p.completed);
  };

  const getCourseProgress = () => {
    if (lessons.length === 0) return 0;
    const completedCount = lessons.filter((l) => isLessonCompleted(l.id)).length;
    return Math.round((completedCount / lessons.length) * 100);
  };

  return {
    course,
    modules,
    lessons,
    progress,
    loading,
    refetch: fetchCourseDetails,
    markLessonComplete,
    getLessonsForModule,
    isLessonCompleted,
    getCourseProgress,
  };
};

// Hook para admin gerenciar cursos
export const useCoursesAdmin = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar cursos:", error);
    } else {
      setCourses((data as DBCourse[]).map(mapCourse));
    }
    setLoading(false);
  };

  const createCourse = async (courseData: Omit<Course, "id" | "createdAt" | "updatedAt">) => {
    const { error } = await supabase.from("courses").insert({
      title: courseData.title,
      description: courseData.description,
      thumbnail_url: courseData.thumbnailUrl,
      category: courseData.category,
      is_active: courseData.isActive,
    });

    if (error) throw error;
    await fetchCourses();
  };

  const updateCourse = async (id: string, courseData: Partial<Course>) => {
    const updateData: Record<string, unknown> = {};
    if (courseData.title !== undefined) updateData.title = courseData.title;
    if (courseData.description !== undefined) updateData.description = courseData.description;
    if (courseData.thumbnailUrl !== undefined) updateData.thumbnail_url = courseData.thumbnailUrl;
    if (courseData.category !== undefined) updateData.category = courseData.category;
    if (courseData.isActive !== undefined) updateData.is_active = courseData.isActive;

    const { error } = await supabase.from("courses").update(updateData).eq("id", id);
    if (error) throw error;
    await fetchCourses();
  };

  const deleteCourse = async (id: string) => {
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) throw error;
    await fetchCourses();
  };

  // Módulos
  const createModule = async (moduleData: Omit<CourseModule, "id" | "createdAt" | "updatedAt">) => {
    const { error } = await supabase.from("course_modules").insert({
      course_id: moduleData.courseId,
      title: moduleData.title,
      description: moduleData.description,
      order_index: moduleData.orderIndex,
    });
    if (error) throw error;
  };

  const updateModule = async (id: string, moduleData: Partial<CourseModule>) => {
    const updateData: Record<string, unknown> = {};
    if (moduleData.title !== undefined) updateData.title = moduleData.title;
    if (moduleData.description !== undefined) updateData.description = moduleData.description;
    if (moduleData.orderIndex !== undefined) updateData.order_index = moduleData.orderIndex;

    const { error } = await supabase.from("course_modules").update(updateData).eq("id", id);
    if (error) throw error;
  };

  const deleteModule = async (id: string) => {
    const { error } = await supabase.from("course_modules").delete().eq("id", id);
    if (error) throw error;
  };

  // Aulas
  const createLesson = async (lessonData: Omit<CourseLesson, "id" | "createdAt" | "updatedAt">) => {
    const { error } = await supabase.from("course_lessons").insert({
      module_id: lessonData.moduleId,
      title: lessonData.title,
      description: lessonData.description,
      stream_urls: lessonData.streamUrls,
      embed_url: lessonData.embedUrl,
      duration_minutes: lessonData.durationMinutes,
      order_index: lessonData.orderIndex,
    });
    if (error) throw error;
  };

  const updateLesson = async (id: string, lessonData: Partial<CourseLesson>) => {
    const updateData: Record<string, unknown> = {};
    if (lessonData.title !== undefined) updateData.title = lessonData.title;
    if (lessonData.description !== undefined) updateData.description = lessonData.description;
    if (lessonData.streamUrls !== undefined) updateData.stream_urls = lessonData.streamUrls;
    if (lessonData.embedUrl !== undefined) updateData.embed_url = lessonData.embedUrl;
    if (lessonData.durationMinutes !== undefined) updateData.duration_minutes = lessonData.durationMinutes;
    if (lessonData.orderIndex !== undefined) updateData.order_index = lessonData.orderIndex;

    const { error } = await supabase.from("course_lessons").update(updateData).eq("id", id);
    if (error) throw error;
  };

  const deleteLesson = async (id: string) => {
    const { error } = await supabase.from("course_lessons").delete().eq("id", id);
    if (error) throw error;
  };

  return {
    courses,
    loading,
    refetch: fetchCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    createModule,
    updateModule,
    deleteModule,
    createLesson,
    updateLesson,
    deleteLesson,
  };
};
