import { Play, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Course } from "@/hooks/useCourses";

interface CourseCardProps {
  course: Course;
  progress?: number;
  onClick: () => void;
}

export const CourseCard = ({ course, progress = 0, onClick }: CourseCardProps) => {
  return (
    <Card
      className="group cursor-pointer overflow-hidden bg-card hover:bg-accent/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
      onClick={onClick}
    >
      <div className="relative aspect-[3/4]">
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-primary/50" />
          </div>
        )}
        
        {/* Overlay com play */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform">
            <Play className="w-8 h-8 text-primary-foreground ml-1" />
          </div>
        </div>

        {/* Badge de categoria */}
        <Badge className="absolute top-3 left-3 bg-background/80 text-foreground">
          {course.category}
        </Badge>

        {/* Progresso se existir */}
        {progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
            <Progress value={progress} className="h-1" />
            <span className="text-xs text-white/80 mt-1 block">{progress}% concluído</span>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-lg line-clamp-2 mb-2 group-hover:text-primary transition-colors">
          {course.title}
        </h3>
        {course.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {course.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
