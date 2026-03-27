import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Info, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HeroContent {
  id: string;
  name: string;
  backdrop_url: string | null;
  trailer_url: string | null;
  rating: number | null;
  category: string;
  sinopse?: string | null;
}

interface HeroSectionProps {
  items: HeroContent[];
}

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:v=|\/embed\/|youtu\.be\/)([^&?#]+)/);
  return match ? match[1] : null;
}

export const HeroSection = ({ items }: HeroSectionProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const navigate = useNavigate();

  const current = items[currentIndex];

  // Rotate hero every 12s
  useEffect(() => {
    if (items.length <= 1) return;
    const interval = setInterval(() => {
      setShowVideo(false);
      setCurrentIndex((i) => (i + 1) % items.length);
    }, 12000);
    return () => clearInterval(interval);
  }, [items.length]);

  // Show video after 3s delay
  useEffect(() => {
    setShowVideo(false);
    const timer = setTimeout(() => setShowVideo(true), 3000);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  if (!current) return null;

  const youtubeId = current.trailer_url ? getYouTubeId(current.trailer_url) : null;

  return (
    <div className="relative w-full h-[70vh] md:h-[80vh] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          {/* Background */}
          {showVideo && youtubeId ? (
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${youtubeId}&modestbranding=1&showinfo=0&rel=0&iv_load_policy=3`}
              className="w-full h-full object-cover scale-110"
              allow="autoplay; encrypted-media"
              frameBorder="0"
              style={{ pointerEvents: "none" }}
            />
          ) : current.backdrop_url ? (
            <img
              src={current.backdrop_url}
              alt={current.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-background" />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 lg:p-16">
        <motion.div
          key={`content-${currentIndex}`}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-2xl space-y-4"
        >
          <span className="text-amber-400 text-sm font-semibold tracking-wider uppercase">
            {current.category}
          </span>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-tight">
            {current.name}
          </h1>

          <div className="flex items-center gap-3 text-sm text-white/80">
            {current.rating && (
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <Star className="w-4 h-4 fill-amber-400" />
                {current.rating}
              </span>
            )}
          </div>

          {current.sinopse && (
            <p className="text-sm md:text-base text-white/70 line-clamp-3 max-w-lg">
              {current.sinopse}
            </p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/entretenimento/movie/${current.id}`)}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-black font-bold text-sm hover:bg-white/90 transition-colors"
            >
              <Play className="w-5 h-5 fill-black" />
              Assistir
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/entretenimento/movie/${current.id}`)}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-white/20 backdrop-blur-sm text-white font-semibold text-sm hover:bg-white/30 transition-colors"
            >
              <Info className="w-5 h-5" />
              Mais Informações
            </motion.button>
          </div>
        </motion.div>

        {/* Indicator dots */}
        {items.length > 1 && (
          <div className="flex items-center gap-1.5 mt-6">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => { setCurrentIndex(i); setShowVideo(false); }}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === currentIndex ? "w-8 bg-white" : "w-3 bg-white/30"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
