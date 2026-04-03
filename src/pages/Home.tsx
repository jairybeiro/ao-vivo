import { useNavigate } from "react-router-dom";
import { useCourses } from "@/hooks/useCourses";
import { CourseCard } from "@/components/courses/CourseCard";
import { BookOpen, Sparkles, Play, ArrowRight } from "lucide-react";
import MainHeader from "@/components/MainHeader";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import CineBusinessCardPopover from "@/components/CineBusinessCardPopover";
import CineBusinessCard from "@/components/CineBusinessCard";
import { useIsMobile } from "@/hooks/use-mobile";

interface CineBusinessItem {
  id: string;
  name: string;
  category: string;
  cover_url: string | null;
  backdrop_url: string | null;
  rating: number | null;
  trailer_url: string | null;
  trailer_mp4_url: string | null;
  sinopse: string | null;
}

const Home = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { courses, loading: coursesLoading } = useCourses();
  const [cineItems, setCineItems] = useState<CineBusinessItem[]>([]);
  const [cineLoading, setCineLoading] = useState(true);

  const fetchCineBusiness = useCallback(async () => {
    setCineLoading(true);
    const { data } = await supabase
      .from("vod_movies")
      .select("id, name, category, cover_url, backdrop_url, rating, sinopse, trailer_url, trailer_mp4_url")
      .in("category", ["Negócios", "Empreendedorismo", "Mentalidade", "Liderança", "Finanças", "Marketing", "Produtividade", "Tecnologia", "Desenvolvimento Pessoal", "Startups"])
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(8);
    setCineItems((data || []) as CineBusinessItem[]);
    setCineLoading(false);
  }, []);

  useEffect(() => {
    fetchCineBusiness();
  }, [fetchCineBusiness]);

  return (
    <div className="min-h-screen bg-background">
      <MainHeader transparent />

      {/* Hero */}
      <section className="relative w-full bg-gradient-to-br from-primary/15 via-background to-background min-h-[50vh] flex items-center">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="max-w-2xl space-y-5">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground leading-[1.1] tracking-tight">
              Aprenda. <br />
              <span className="text-primary">Inspire-se.</span> <br />
              Transforme.
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg">
              Cursos exclusivos e conteúdos que vão elevar sua mentalidade e seus resultados.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => navigate("/cursos")}
                className="flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-colors text-base"
              >
                <Play className="w-5 h-5 fill-current" />
                Começar Agora
              </button>
              <button
                onClick={() => navigate("/entretenimento")}
                className="flex items-center justify-center gap-2 px-8 py-3.5 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/80 transition-colors text-base"
              >
                <Sparkles className="w-5 h-5" />
                Explorar CineBusiness
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Cursos em destaque */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Cursos em Destaque
          </h2>
          <button
            onClick={() => navigate("/cursos")}
            className="flex items-center gap-1 text-sm text-primary hover:underline font-medium"
          >
            Ver todos <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {coursesLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Cursos em breve.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {courses.slice(0, 4).map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onClick={() => navigate(`/course/${course.id}`)}
              />
            ))}
          </div>
        )}
      </section>

      {/* CineBusiness Destaques */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            CineBusiness
          </h2>
          <button
            onClick={() => navigate("/entretenimento")}
            className="flex items-center gap-1 text-sm text-primary hover:underline font-medium"
          >
            Ver todos <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {cineLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : cineItems.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Conteúdos em breve.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {cineItems.slice(0, 8).map((item) =>
              isMobile ? (
                <CineBusinessCard
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  category={item.category}
                  cover_url={item.cover_url}
                  backdrop_url={item.backdrop_url}
                  rating={item.rating}
                  trailer_url={item.trailer_mp4_url || item.trailer_url}
                  onClick={() => navigate(`/cinebusiness/${item.id}`)}
                />
              ) : (
                <CineBusinessCardPopover
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  category={item.category}
                  cover_url={item.cover_url}
                  backdrop_url={item.backdrop_url}
                  rating={item.rating}
                  trailer_url={item.trailer_mp4_url || item.trailer_url}
                  sinopse={item.sinopse}
                  onClick={() => navigate(`/cinebusiness/${item.id}`)}
                  onPlayTrailer={() => {}}
                />
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
