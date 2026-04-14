import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Course } from "@/hooks/useCourses";
import { Play, ChevronRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface CoursesHeroBannerProps {
  courses: Course[];
}

export const CoursesHeroBanner = ({ courses }: CoursesHeroBannerProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const featured = courses.filter((c) => c.isFeatured).slice(0, 6);
  
  const goTo = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsTransitioning(false);
    }, 400);
  }, [isTransitioning]);

  // Auto-rotate every 6s
  useEffect(() => {
    if (featured.length <= 1) return;
    const timer = setInterval(() => {
      goTo((currentIndex + 1) % featured.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [currentIndex, featured.length, goTo]);

  if (featured.length === 0) return null;

  const course = featured[currentIndex];
  const bannerImage = course.bannerUrl || course.thumbnailUrl;

  return (
    <div className="relative w-full overflow-hidden" style={{ height: isMobile ? "55vh" : "60vh", minHeight: isMobile ? 320 : 400 }}>
      {/* Background image */}
      <div
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-500 ${isTransitioning ? "opacity-0" : "opacity-100"}`}
        style={{ backgroundImage: bannerImage ? `url(${bannerImage})` : undefined }}
      >
        {!bannerImage && (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center">
            <BookOpen className="w-32 h-32 text-primary/20" />
          </div>
        )}
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />

      {/* Content */}
      <div className={`absolute bottom-0 left-0 right-0 p-6 ${isMobile ? "pb-8" : "pb-12 pl-12"} transition-opacity duration-500 ${isTransitioning ? "opacity-0" : "opacity-100"}`}>
        <div className="max-w-2xl space-y-3">
          {course.category && (
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary/90 bg-primary/10 px-3 py-1 rounded-full backdrop-blur-sm">
              {course.category}
            </span>
          )}
          <h2 className={`font-bold leading-tight ${isMobile ? "text-2xl" : "text-4xl"}`}>
            {course.title}
          </h2>
          {course.description && (
            <p className={`text-muted-foreground leading-relaxed ${isMobile ? "text-sm line-clamp-2" : "text-base line-clamp-3"}`}>
              {course.description}
            </p>
          )}
          {course.instructorName && (
            <p className="text-xs text-muted-foreground">por <span className="text-foreground font-medium">{course.instructorName}</span></p>
          )}
          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={() => navigate(`/course/${course.id}`)}
              className="gap-2 rounded-full px-6"
              size={isMobile ? "default" : "lg"}
            >
              <Play className="w-4 h-4" fill="currentColor" />
              Ver Curso
            </Button>
            {course.level && (
              <span className="text-xs px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-foreground/80 border border-white/10">
                {course.level}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Dots indicator */}
      {featured.length > 1 && (
        <div className={`absolute ${isMobile ? "bottom-3 left-1/2 -translate-x-1/2" : "bottom-6 right-12"} flex items-center gap-2`}>
          {featured.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all duration-300 ${
                i === currentIndex
                  ? "w-8 h-2 bg-primary"
                  : "w-2 h-2 bg-white/30 hover:bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
