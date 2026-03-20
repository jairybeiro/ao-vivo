import { useCallback, useState } from "react";
import { Play, ChevronRight, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { VodEpisode, VodSeries } from "@/hooks/useVod";

interface EpisodesSheetProps {
  series: VodSeries;
  seasons: Map<number, VodEpisode[]>;
  seasonNumbers: number[];
  currentEpisode: VodEpisode | null;
  onPlayEpisode: (ep: VodEpisode) => void;
  trigger: React.ReactNode;
}

const EpisodesSheet = ({
  series,
  seasons,
  seasonNumbers,
  currentEpisode,
  onPlayEpisode,
  trigger,
}: EpisodesSheetProps) => {
  const [open, setOpen] = useState(false);
  const [activeSeason, setActiveSeason] = useState(
    () => String(currentEpisode?.season || seasonNumbers[0] || 1)
  );

  const handlePlay = useCallback((ep: VodEpisode) => {
    onPlayEpisode(ep);
    setOpen(false);
  }, [onPlayEpisode]);

  const activeEpisodes = seasons.get(Number(activeSeason)) || [];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="bottom"
        className="bg-[#181818] border-t border-white/10 rounded-t-2xl max-h-[80vh] flex flex-col p-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
          <SheetHeader className="text-left p-0">
            <SheetTitle className="text-white text-base font-semibold">{series.name}</SheetTitle>
          </SheetHeader>
        </div>

        {/* Season selector */}
        {seasonNumbers.length > 1 && (
          <div className="px-4 pb-3 shrink-0">
            <Select value={activeSeason} onValueChange={setActiveSeason}>
              <SelectTrigger className="w-auto bg-white/10 border-white/20 text-white text-sm gap-2">
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

        {/* Episodes list - horizontal scroll like Netflix */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">
          {activeEpisodes.map(ep => {
            const isCurrent = currentEpisode?.id === ep.id;
            return (
              <button
                key={ep.id}
                onClick={() => handlePlay(ep)}
                className="w-full text-left flex gap-3 group"
              >
                {/* Thumbnail */}
                <div className="relative w-28 h-16 shrink-0 rounded-md overflow-hidden bg-white/5">
                  {ep.cover_url ? (
                    <img
                      src={ep.cover_url}
                      alt={ep.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-5 h-5 text-white/30" />
                    </div>
                  )}
                  {/* Play icon overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition">
                    <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center">
                      <Play className="w-4 h-4 text-white ml-0.5" />
                    </div>
                  </div>
                  {/* Progress bar on thumbnail (if watching) */}
                  {isCurrent && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 py-0.5">
                  <div className="flex items-center gap-1.5">
                    {isCurrent && <ChevronRight className="w-3.5 h-3.5 text-primary shrink-0" />}
                    <span className={`text-sm font-medium truncate ${isCurrent ? "text-primary" : "text-white"}`}>
                      {ep.episode_num}. {ep.title}
                    </span>
                  </div>
                  {ep.duration_secs && (
                    <span className="text-[11px] text-white/40 mt-0.5 block">
                      {Math.round(ep.duration_secs / 60)}m
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default EpisodesSheet;
