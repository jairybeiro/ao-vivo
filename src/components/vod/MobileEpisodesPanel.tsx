import { useCallback, useState } from "react";
import { Play, ChevronRight } from "lucide-react";
import type { VodEpisode, VodSeries } from "@/hooks/useVod";

interface MobileEpisodesPanelProps {
  series: VodSeries;
  seasons: Map<number, VodEpisode[]>;
  seasonNumbers: number[];
  currentEpisode: VodEpisode | null;
  onPlayEpisode: (ep: VodEpisode) => void;
  open: boolean;
  onClose: () => void;
}

const MobileEpisodesPanel = ({
  series,
  seasons,
  seasonNumbers,
  currentEpisode,
  onPlayEpisode,
  open,
  onClose,
}: MobileEpisodesPanelProps) => {
  const [activeSeason, setActiveSeason] = useState(
    () => String(currentEpisode?.season || seasonNumbers[0] || 1)
  );

  const handlePlay = useCallback((ep: VodEpisode) => {
    onPlayEpisode(ep);
    onClose();
  }, [onPlayEpisode, onClose]);

  const activeEpisodes = seasons.get(Number(activeSeason)) || [];

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
          <h3 className="text-white text-base font-semibold">{series.name}</h3>
        </div>

        {/* Season selector */}
        {seasonNumbers.length > 1 && (
          <div className="px-4 pb-3 shrink-0 flex gap-2 overflow-x-auto">
            {seasonNumbers.map(s => (
              <button
                key={s}
                onClick={() => setActiveSeason(String(s))}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  activeSeason === String(s)
                    ? "bg-white text-black"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                T{s}
              </button>
            ))}
          </div>
        )}

        {/* Episodes */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' as any }}>
          <div className="px-4 pb-6 space-y-3">
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
                      <img src={ep.cover_url} alt={ep.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="w-5 h-5 text-white/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition">
                      <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center">
                        <Play className="w-4 h-4 text-white ml-0.5" />
                      </div>
                    </div>
                    {isCurrent && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600" />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 py-0.5">
                    <div className="flex items-center gap-1.5">
                      {isCurrent && <ChevronRight className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                      <span className={`text-sm font-medium truncate ${isCurrent ? "text-red-500" : "text-white"}`}>
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
        </div>
      </div>
    </>
  );
};

export default MobileEpisodesPanel;
