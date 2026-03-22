import { useCallback, useState } from "react";
import { Play, Film, Star, PlayCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { VodMovie } from "@/hooks/useVod";
import type { WatchProgress } from "@/hooks/useWatchProgress";

interface MobileMovieCatalogProps {
  currentMovieId: string;
  movies: VodMovie[];
  continueWatching: WatchProgress[];
  onPlayMovie: (movie: VodMovie) => void;
  onContinue: (item: WatchProgress) => void;
  open: boolean;
  onClose: () => void;
  categoryLabel?: string;
}

const formatTime = (s: number) => {
  if (!isFinite(s) || s < 0) return "0:00";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const MobileMovieCatalog = ({
  currentMovieId,
  movies,
  continueWatching,
  onPlayMovie,
  onContinue,
  open,
  onClose,
  categoryLabel,
}: MobileMovieCatalogProps) => {
  const handlePlay = useCallback((movie: VodMovie) => {
    onPlayMovie(movie);
    onClose();
  }, [onPlayMovie, onClose]);

  const filteredMovies = movies.filter(m => m.id !== currentMovieId);
  const filteredCW = continueWatching.filter(cw => cw.content_id !== currentMovieId);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 z-40 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Panel — slides up from bottom */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-50 bg-[#181818] rounded-t-2xl flex flex-col transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ maxHeight: "75vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/30" />
        </div>

        {/* Header */}
        <div className="px-4 pb-2 shrink-0">
          <h3 className="text-white text-base font-semibold">
            {categoryLabel ? `Mais de ${categoryLabel}` : "Mais Filmes"}
          </h3>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="px-4 pb-6 space-y-4">
            {/* Continue Watching */}
            {filteredCW.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-white/60 text-xs font-semibold flex items-center gap-1.5">
                  <PlayCircle className="w-3.5 h-3.5" />
                  Continuar Assistindo
                </h4>
                <div className="flex gap-2.5 overflow-x-auto pb-1">
                  {filteredCW.map(item => {
                    const pct = item.duration_secs > 0 ? (item.current_time_secs / item.duration_secs) * 100 : 0;
                    return (
                      <button
                        key={item.id}
                        onClick={() => { onContinue(item); onClose(); }}
                        className="flex-shrink-0 w-28 text-left"
                      >
                        <div className="aspect-[2/3] bg-white/5 rounded-md overflow-hidden relative">
                          {item.content_cover_url ? (
                            <img src={item.content_cover_url} alt={item.content_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Film className="w-6 h-6 text-white/20" />
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20">
                            <div className="h-full bg-[#E50914]" style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>
                        </div>
                        <p className="text-white text-[10px] font-medium truncate mt-1">{item.content_name}</p>
                        <p className="text-white/40 text-[9px]">{formatTime(item.current_time_secs)}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Movies grid */}
            <div className="grid grid-cols-3 gap-2.5">
              {filteredMovies.map(movie => (
                <button
                  key={movie.id}
                  onClick={() => handlePlay(movie)}
                  className="text-left group"
                >
                  <div className="aspect-[2/3] bg-white/5 rounded-md overflow-hidden relative">
                    {movie.cover_url ? (
                      <img src={movie.cover_url} alt={movie.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film className="w-6 h-6 text-white/20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <Play className="w-6 h-6 text-white" fill="white" />
                    </div>
                    {movie.rating && movie.rating > 0 && (
                      <div className="absolute top-1 right-1 bg-black/70 text-[9px] px-1 py-0.5 rounded flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
                        <span className="text-white">{movie.rating}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-white text-[10px] font-medium truncate mt-1">{movie.name}</p>
                </button>
              ))}
            </div>
          </div>
        </ScrollArea>
      </div>
    </>
  );
};

export default MobileMovieCatalog;
