import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Info, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CineCardProps {
  id: string;
  title: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  trailerUrl: string | null;
  rating: number | null;
  category: string;
  sinopse?: string | null;
}

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:v=|\/embed\/|youtu\.be\/)([^&?#]+)/);
  return match ? match[1] : null;
}

export const CineCard = ({ id, title, posterUrl, backdropUrl, trailerUrl, rating, category, sinopse }: CineCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => setIsHovered(true), 600);
  };

  const handleMouseLeave = () => {
    clearTimeout(timeoutRef.current);
    setIsHovered(false);
  };

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const youtubeId = trailerUrl ? getYouTubeId(trailerUrl) : null;
  const imageUrl = posterUrl || backdropUrl;

  return (
    <motion.div
      className="relative group cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.08, zIndex: 20 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      {/* Base Card */}
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
            Sem imagem
          </div>
        )}
        
        {/* Rating badge */}
        {rating && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/70 text-amber-400 text-xs font-bold">
            <Star className="w-3 h-3 fill-amber-400" />
            {rating}
          </div>
        )}

        {/* Bottom gradient */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 to-transparent" />
        <div className="absolute bottom-2 left-2 right-2">
          <p className="text-xs text-amber-400 font-medium">{category}</p>
          <h3 className="text-sm font-bold text-white line-clamp-2 leading-tight">{title}</h3>
        </div>
      </div>

      {/* Expanded hover card */}
      {isHovered && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-0 left-[-10%] right-[-10%] z-30 rounded-xl overflow-hidden shadow-2xl bg-card border border-border"
        >
          {/* Trailer preview */}
          <div className="aspect-video bg-black relative">
            {youtubeId ? (
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${youtubeId}&modestbranding=1&showinfo=0&rel=0`}
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                frameBorder="0"
              />
            ) : imageUrl ? (
              <img src={backdropUrl || imageUrl} alt={title} className="w-full h-full object-cover" />
            ) : null}
          </div>

          {/* Info panel */}
          <div className="p-3 space-y-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/entretenimento/movie/${id}`)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white text-black text-xs font-bold hover:bg-white/90 transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-black" /> Assistir
              </button>
              <button
                onClick={() => navigate(`/entretenimento/movie/${id}`)}
                className="p-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>

            {sinopse && (
              <p className="text-xs text-muted-foreground line-clamp-2">{sinopse}</p>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {rating && <span className="text-amber-400 font-medium">⭐ {rating}</span>}
              <span>{category}</span>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
