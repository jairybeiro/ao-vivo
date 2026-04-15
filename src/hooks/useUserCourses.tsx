import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface UserCourse {
  id: string;
  courseId: string;
  purchaseDate: string;
  paymentStatus: string;
  course?: {
    id: string;
    title: string;
    thumbnailUrl: string | null;
    bannerUrl: string | null;
    category: string | null;
    instructorName: string | null;
  };
}

export const useUserCourses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<UserCourse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserCourses = async () => {
    if (!user) {
      setCourses([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("user_courses")
      .select("id, course_id, purchase_date, payment_status, courses(id, title, thumbnail_url, banner_url, category, instructor_name)")
      .eq("user_id", user.id)
      .eq("payment_status", "completed")
      .order("purchase_date", { ascending: false });

    if (!error && data) {
      setCourses(
        data.map((row: any) => ({
          id: row.id,
          courseId: row.course_id,
          purchaseDate: row.purchase_date,
          paymentStatus: row.payment_status,
          course: row.courses
            ? {
                id: row.courses.id,
                title: row.courses.title,
                thumbnailUrl: row.courses.thumbnail_url,
                bannerUrl: row.courses.banner_url,
                category: row.courses.category,
                instructorName: row.courses.instructor_name,
              }
            : undefined,
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUserCourses();
  }, [user?.id]);

  const ownsCoure = (courseId: string) =>
    courses.some((c) => c.courseId === courseId);

  return { courses, loading, ownsCourse: ownsCoure, refetch: fetchUserCourses };
};
