import { useState, useCallback, useEffect } from "react";
import { Play, ChevronRight, X, ListVideo } from "lucide-react";
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

  // Sync active season when episode changes
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
        className={`absolute inset-0 bg-black/50 z-30 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`absolute top-0 right-0 bottom-0 w-[420px] max-w-[85vw] bg-[#141414] z-40 flex flex-col shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-white font-bold text-lg truncate">{series.name}</h2>
            {series.plot && (
              <p className="text-white/50 text-xs mt-1 line-clamp-2">{series.plot}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-3 p-2 rounded-full hover:bg-white/10 transition text-white/70 hover:text-white shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Season selector */}
        {seasonNumbers.length > 1 && (
          <div className="px-5 py-3 border-b border-white/5 shrink-0">
            <Select value={activeSeason} onValueChange={setActiveSeason}>
              <SelectTrigger className="w-auto bg-white/10 border-white/20 text-white text-sm gap-2 hover:bg-white/15 transition">
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
          </div>
        )}

        {/* Episodes list */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-1">
            {activeEpisodes.map(ep => {
              const isCurrent = currentEpisode?.id === ep.id;
              return (
                <button
                  key={ep.id}
                  onClick={() => handlePlay(ep)}
                  className={`w-full text-left flex gap-3 p-3 rounded-lg group transition-all ${
                    isCurrent
                      ? "bg-white/10 ring-1 ring-primary/30"
                      : "hover:bg-white/5"
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative w-32 h-[72px] shrink-0 rounded-md overflow-hidden bg-white/5">
                    {ep.cover_url ? (
                      <img
                        src={ep.cover_url}
                        alt={ep.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="w-6 h-6 text-white/20" />
                      </div>
                    )}
                    {/* Play overlay on hover */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
                      <div className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center">
                        <Play className="w-4 h-4 text-white ml-0.5" />
                      </div>
                    </div>
                    {/* Current indicator bar */}
                    {isCurrent && (
                      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 py-0.5">
                    <div className="flex items-center gap-1.5">
                      {isCurrent && <ChevronRight className="w-4 h-4 text-primary shrink-0" />}
                      <span className={`text-sm font-semibold truncate ${isCurrent ? "text-primary" : "text-white"}`}>
                        {ep.episode_num}. {ep.title}
                      </span>
                    </div>
                    {ep.duration_secs && (
                      <span className="text-[11px] text-white/40 mt-1 block">
                        {Math.round(ep.duration_secs / 60)} min
                      </span>
                    )}
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
