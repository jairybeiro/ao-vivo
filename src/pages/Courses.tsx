import { useNavigate } from "react-router-dom";
import { useCourses } from "@/hooks/useCourses";
import { CourseCard } from "@/components/courses/CourseCard";
import { CoursesHeroBanner } from "@/components/courses/CoursesHeroBanner";
import { BookOpen, Crown, Play } from "lucide-react";
import MainHeader from "@/components/MainHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion } from "framer-motion";

const Courses = () => {
  const navigate = useNavigate();
  const { courses, loading } = useCourses();
  const isMobile = useIsMobile();

  // Mobile premium interface
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-24">
        {/* Compact header */}
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/5">
          <div className="px-5 py-4 flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight">Cursos</h1>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <BookOpen className="w-4 h-4" />
              <span>{courses.length} disponíveis</span>
            </div>
          </div>
        </div>

        {/* Hero banner */}
        {!loading && <CoursesHeroBanner courses={courses} />}

        {loading ? (
          <div className="px-4 pt-6 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-3xl bg-card/50 animate-pulse h-64" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-32 px-8 text-center">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
              <BookOpen className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Nenhum curso disponível</h2>
            <p className="text-sm text-muted-foreground">Novos cursos serão adicionados em breve.</p>
          </div>
        ) : (
          <div className="px-4 pt-5 space-y-5">
            {courses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.4 }}
                onClick={() => navigate(`/course/${course.id}`)}
                className="relative rounded-3xl overflow-hidden cursor-pointer group active:scale-[0.98] transition-transform duration-200"
              >
                {/* Card image */}
                <div className="relative aspect-[16/10]">
                  {course.thumbnailUrl ? (
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <BookOpen className="w-20 h-20 text-primary/30" />
                    </div>
                  )}

                  {/* Glass gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                  {/* Premium badge */}
                  <div className="absolute top-4 right-4">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/90 backdrop-blur-sm">
                      <Crown className="w-3 h-3 text-black" />
                      <span className="text-[11px] font-bold text-black tracking-wide">Premium</span>
                    </div>
                  </div>

                  {/* Play button center */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-active:opacity-100 transition-opacity duration-200">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center">
                      <Play className="w-7 h-7 text-white ml-1" fill="white" />
                    </div>
                  </div>

                  {/* Bottom content */}
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs text-white/60 font-medium uppercase tracking-wider">
                            {course.category}
                          </p>
                          {course.level && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/80 text-primary-foreground font-semibold">
                              {course.level}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-white leading-tight line-clamp-2">
                          {course.title}
                        </h3>
                        {course.instructorName && (
                          <p className="text-xs text-white/50 mt-1">
                            por {course.instructorName}
                          </p>
                        )}
                        {course.description && (
                          <p className="text-xs text-white/40 mt-1 line-clamp-2">
                            {course.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Desktop
  return (
    <div className="min-h-screen bg-background">
      <MainHeader />

      {/* Hero banner */}
      {!loading && <CoursesHeroBanner courses={courses} />}

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            Cursos
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Aprenda com os melhores conteúdos educacionais
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Nenhum curso disponível</h2>
            <p className="text-muted-foreground">Novos cursos serão adicionados em breve.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onClick={() => navigate(`/course/${course.id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Courses;
