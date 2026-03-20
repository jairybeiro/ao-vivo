import { useState, useCallback, useEffect } from "react";
import { Play, ChevronLeft, X, ListVideo } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { VodEpisode, VodSeries } from "@/hooks/useVod";

interface DesktopEpisodesPanelProps {
  series: VodSeries;
  seasons: Map<number, VodEpisode[]>;
  seasonNumbers: number[];
  currentEpisode: VodEpisode | null;
  onPlayEpisode: (ep: VodEpisode) => void;
  open: boolean;
  onClose: () => void;
}

const DesktopEpisodesPanel = ({
  series,
  seasons,
  seasonNumbers,
  currentEpisode,
  onPlayEpisode,
  open,
  onClose,
}: DesktopEpisodesPanelProps) => {
  const [activeSeason, setActiveSeason] = useState(
    () => String(currentEpisode?.season || seasonNumbers[0] || 1)
  );

  useEffect(() => {
    if (currentEpisode) {
      setActiveSeason(String(currentEpisode.season));
    }
  }, [currentEpisode]);

  const handlePlay = useCallback((ep: VodEpisode) => {
    onPlayEpisode(ep);
  }, [onPlayEpisode]);

  const activeEpisodes = seasons.get(Number(activeSeason)) || [];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 z-30 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Panel — Netflix-style wider */}
      <div
        className={`absolute top-0 right-0 bottom-0 w-[520px] max-w-[90vw] bg-[#181818] z-40 flex flex-col shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with back arrow + season title */}
        <div className="flex items-center gap-3 p-5 border-b border-white/10 shrink-0">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition text-white/70 hover:text-white shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0 flex-1">
            {seasonNumbers.length > 1 ? (
              <Select value={activeSeason} onValueChange={setActiveSeason}>
                <SelectTrigger className="w-auto bg-transparent border-none text-white text-lg font-bold gap-2 p-0 h-auto hover:text-white/80 transition shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#2b2b2b] border-white/10">
                  {seasonNumbers.map(s => (
                    <SelectItem key={s} value={String(s)} className="text-white hover:bg-white/10">
                      Temporada {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <h2 className="text-white font-bold text-lg">Temporada {activeSeason}</h2>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition text-white/70 hover:text-white shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Episodes list */}
        <ScrollArea className="flex-1">
          <div className="py-2">
            {activeEpisodes.map(ep => {
              const isCurrent = currentEpisode?.id === ep.id;
              return (
                <button
                  key={ep.id}
                  onClick={() => handlePlay(ep)}
                  className={`w-full text-left transition-all ${
                    isCurrent
                      ? "bg-white/10"
                      : "hover:bg-white/5"
                  }`}
                >
                  {/* Episode row */}
                  <div className="flex items-start gap-4 px-5 py-4">
                    {/* Episode number */}
                    <span className={`text-lg font-bold mt-1 shrink-0 w-6 text-center ${
                      isCurrent ? "text-white" : "text-white/40"
                    }`}>
                      {ep.episode_num}
                    </span>

                    {/* Title + optional thumbnail for current */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold truncate ${
                          isCurrent ? "text-white" : "text-white/90"
                        }`}>
                          {ep.title}
                        </span>
                      </div>

                      {/* Expanded content for current episode */}
                      {isCurrent && (
                        <div className="mt-3 flex gap-3">
                          {ep.cover_url && (
                            <div className="relative w-36 h-20 shrink-0 rounded overflow-hidden bg-white/5">
                              <img
                                src={ep.cover_url}
                                alt={ep.title}
                                className="w-full h-full object-cover"
                              />
                              {/* Playing indicator overlay */}
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center">
                                  <Play className="w-3.5 h-3.5 text-white ml-0.5" fill="white" />
                                </div>
                              </div>
                            </div>
                          )}
                          {ep.duration_secs && (
                            <p className="text-white/40 text-xs mt-1">
                              {Math.round(ep.duration_secs / 60)} min
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Progress bar indicator */}
                    <div className="w-16 mt-2 shrink-0">
                      <div className="h-[3px] bg-white/20 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isCurrent ? "bg-red-600" : "bg-red-600/60"}`}
                          style={{ width: isCurrent ? "50%" : "0%" }}
                        />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </>
  );
};

export default DesktopEpisodesPanel;
