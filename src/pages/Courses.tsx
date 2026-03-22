import { useNavigate } from "react-router-dom";
import { useCourses } from "@/hooks/useCourses";
import { CourseCard } from "@/components/courses/CourseCard";
import { BookOpen } from "lucide-react";
import MainHeader from "@/components/MainHeader";

const Courses = () => {
  const navigate = useNavigate();
  const { courses, loading } = useCourses();

  return (
    <div className="min-h-screen bg-background">
      <MainHeader />

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
