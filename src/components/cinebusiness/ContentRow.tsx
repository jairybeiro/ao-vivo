import { motion } from "framer-motion";
import { CineCard } from "./CineCard";
import { ChevronRight } from "lucide-react";

interface ContentItem {
  id: string;
  name: string;
  cover_url: string | null;
  backdrop_url: string | null;
  trailer_url: string | null;
  rating: number | null;
  category: string;
  sinopse?: string | null;
}

interface ContentRowProps {
  title: string;
  items: ContentItem[];
}

export const ContentRow = ({ title, items }: ContentRowProps) => {
  if (items.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2 group cursor-default">
        <h2 className="text-lg md:text-xl font-bold text-foreground">{title}</h2>
        <ChevronRight className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {items.slice(0, 12).map((item) => (
          <CineCard
            key={item.id}
            id={item.id}
            title={item.name}
            posterUrl={item.cover_url}
            backdropUrl={item.backdrop_url}
            trailerUrl={item.trailer_url}
            rating={item.rating}
            category={item.category}
            sinopse={item.sinopse}
          />
        ))}
      </div>
    </motion.section>
  );
};
