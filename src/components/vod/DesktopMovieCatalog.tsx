import { useCallback } from "react";
import { Play, Film, Star, PlayCircle, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { VodMovie } from "@/hooks/useVod";
import type { WatchProgress } from "@/hooks/useWatchProgress";

interface DesktopMovieCatalogProps {
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

const DesktopMovieCatalog = ({
  currentMovieId,
  movies,
  continueWatching,
  onPlayMovie,
  onContinue,
  open,
  onClose,
  categoryLabel,
}: DesktopMovieCatalogProps) => {
  const handlePlay = useCallback((movie: VodMovie) => {
    onPlayMovie(movie);
  }, [onPlayMovie]);

  const filteredMovies = movies.filter(m => m.id !== currentMovieId);
  const filteredCW = continueWatching.filter(cw => cw.content_id !== currentMovieId);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 z-30 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Panel — Netflix style: right side */}
      <div
        className={`absolute bottom-12 right-0 w-[480px] max-w-[40vw] bg-[#181818] z-40 flex flex-col shadow-2xl transition-transform duration-300 ease-out rounded-tl-lg rounded-bl-lg ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ height: "65vh", minHeight: 380, maxHeight: "80vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          <h2 className="text-white font-bold text-xl">
            {categoryLabel ? `Mais de ${categoryLabel}` : "Mais Filmes"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 transition text-white/60 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <ScrollArea className="flex-1">
          <div className="px-5 pb-6 space-y-5">
            {/* Continue Watching */}
            {filteredCW.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="text-white/60 text-xs font-semibold flex items-center gap-1.5">
                  <PlayCircle className="w-3.5 h-3.5" />
                  Continuar Assistindo
                </h4>
                <div className="space-y-2">
                  {filteredCW.slice(0, 5).map(item => {
                    const pct = item.duration_secs > 0 ? (item.current_time_secs / item.duration_secs) * 100 : 0;
                    return (
                      <button
                        key={item.id}
                        onClick={() => { onContinue(item); }}
                        className="w-full text-left flex gap-3 hover:bg-white/5 rounded-md p-1.5 transition"
                      >
                        <div className="relative w-20 h-[60px] shrink-0 rounded overflow-hidden bg-white/5">
                          {item.content_cover_url ? (
                            <img src={item.content_cover_url} alt={item.content_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Film className="w-5 h-5 text-white/20" />
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20">
                            <div className="h-full bg-[#E50914]" style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0 py-0.5">
                          <p className="text-white text-sm font-medium truncate">{item.content_name}</p>
                          <p className="text-white/40 text-xs mt-0.5">
                            {formatTime(item.current_time_secs)} / {formatTime(item.duration_secs)}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Movies grid */}
            <div className="space-y-2.5">
              <h4 className="text-white/60 text-xs font-semibold">
                {categoryLabel || "Filmes"}
              </h4>
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
                        <div className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center">
                          <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
                        </div>
                      </div>
                      {movie.rating && movie.rating > 0 && (
                        <div className="absolute top-1 right-1 bg-black/70 text-[9px] px-1 py-0.5 rounded flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
                          <span className="text-white">{movie.rating}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-white text-[11px] font-medium truncate mt-1">{movie.name}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </>
  );
};

export default DesktopMovieCatalog;
