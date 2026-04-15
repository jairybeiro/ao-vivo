import { useNavigate } from "react-router-dom";
import { useUserCourses } from "@/hooks/useUserCourses";
import MainHeader from "@/components/MainHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { BookOpen, Play, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const MyCourses = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { courses, loading } = useUserCourses();

  return (
    <div className="min-h-screen bg-background pb-24">
      {!isMobile && <MainHeader />}

      <div className="container mx-auto px-4 pt-6 pb-10">
        <div className="flex items-center gap-3 mb-6">
          <GraduationCap className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Meus Cursos</h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-pulse text-muted-foreground">Carregando...</div>
          </div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <BookOpen className="w-16 h-16 text-muted-foreground/30" />
            <p className="text-muted-foreground">Você ainda não possui cursos.</p>
            <Button onClick={() => navigate("/cursos")} className="gap-2 rounded-xl">
              <BookOpen className="w-4 h-4" />
              Explorar Cursos
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {courses.map((uc, i) => (
              <motion.div
                key={uc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/course/${uc.courseId}/player`)}
                className="group cursor-pointer rounded-2xl border border-white/5 bg-card/50 overflow-hidden hover:border-primary/30 transition-all"
              >
                <div className="relative aspect-video">
                  {uc.course?.thumbnailUrl || uc.course?.bannerUrl ? (
                    <img
                      src={uc.course.bannerUrl || uc.course.thumbnailUrl!}
                      alt={uc.course?.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                      <BookOpen className="w-10 h-10 text-primary/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Play className="w-12 h-12 text-white" fill="white" />
                  </div>
                </div>
                <div className="p-4 space-y-1">
                  <h3 className="font-semibold text-sm line-clamp-2">{uc.course?.title}</h3>
                  {uc.course?.instructorName && (
                    <p className="text-xs text-muted-foreground">{uc.course.instructorName}</p>
                  )}
                  {uc.course?.category && (
                    <span className="inline-block text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full mt-1">
                      {uc.course.category}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCourses;
