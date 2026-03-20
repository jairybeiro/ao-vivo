import { useState, useCallback, useEffect } from "react";
import { Play, ChevronLeft, Check, X } from "lucide-react";
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

type View = "seasons" | "episodes";

const DesktopEpisodesPanel = ({
  series,
  seasons,
  seasonNumbers,
  currentEpisode,
  onPlayEpisode,
  open,
  onClose,
}: DesktopEpisodesPanelProps) => {
  const [view, setView] = useState<View>("episodes");
  const [activeSeason, setActiveSeason] = useState(
    () => currentEpisode?.season || seasonNumbers[0] || 1
  );

  // When panel opens, go to episodes view of current season
  useEffect(() => {
    if (open && currentEpisode) {
      setActiveSeason(currentEpisode.season);
      setView("episodes");
    }
  }, [open, currentEpisode]);

  const handlePlay = useCallback((ep: VodEpisode) => {
    onPlayEpisode(ep);
  }, [onPlayEpisode]);

  const handleSelectSeason = useCallback((season: number) => {
    setActiveSeason(season);
    setView("episodes");
  }, []);

  const handleBackToSeasons = useCallback(() => {
    setView("seasons");
  }, []);

  const activeEpisodes = seasons.get(activeSeason) || [];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 z-30 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Panel — Netflix style: top-right, ~60% height */}
      <div
        className={`absolute top-0 right-0 w-[480px] max-w-[40vw] bg-[#181818] z-40 flex flex-col shadow-2xl transition-transform duration-300 ease-out rounded-bl-lg ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ height: "65vh", minHeight: 400, maxHeight: "80vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ══════ SEASONS VIEW ══════ */}
        {view === "seasons" && (
          <>
            <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
              <h2 className="text-white font-bold text-xl">{series.name}</h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-white/10 transition text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ScrollArea className="flex-1">
              <div className="px-2 pb-4">
                {seasonNumbers.map((s) => {
                  const isCurrent = s === activeSeason;
                  return (
                    <button
                      key={s}
                      onClick={() => handleSelectSeason(s)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors rounded-md ${
                        isCurrent
                          ? "text-white bg-white/5"
                          : "text-white/70 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <span className="w-6 flex justify-center shrink-0">
                        {isCurrent && <Check className="w-5 h-5 text-white" />}
                      </span>
                      <span className="text-base font-medium">Temporada {s}</span>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </>
        )}

        {/* ══════ EPISODES VIEW ══════ */}
        {view === "episodes" && (
          <>
            {/* Header with back arrow */}
            <div className="flex items-center gap-3 px-5 pt-5 pb-4 shrink-0">
              {seasonNumbers.length > 1 ? (
                <button
                  onClick={handleBackToSeasons}
                  className="p-1.5 rounded-full hover:bg-white/10 transition text-white/70 hover:text-white shrink-0"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              ) : null}
              <h2 className="text-white font-bold text-xl flex-1">
                Temporada {activeSeason}
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-white/10 transition text-white/60 hover:text-white shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Episodes list — scrollable, ~6 visible */}
            <ScrollArea className="flex-1">
              <div className="pb-4">
                {activeEpisodes.map((ep) => {
                  const isCurrent = currentEpisode?.id === ep.id;
                  return (
                    <button
                      key={ep.id}
                      onClick={() => handlePlay(ep)}
                      className={`w-full text-left transition-all ${
                        isCurrent ? "bg-white/10" : "hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-start gap-4 px-5 py-3.5">
                        {/* Episode number */}
                        <span
                          className={`text-base font-bold mt-0.5 shrink-0 w-6 text-center ${
                            isCurrent ? "text-white" : "text-white/40"
                          }`}
                        >
                          {ep.episode_num}
                        </span>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <span
                            className={`text-sm font-semibold truncate block ${
                              isCurrent ? "text-white" : "text-white/90"
                            }`}
                          >
                            {ep.title}
                          </span>

                          {/* Expanded: thumbnail + description for current */}
                          {isCurrent && (
                            <div className="mt-2.5 flex gap-3">
                              {ep.cover_url && (
                                <div className="relative w-32 h-[72px] shrink-0 rounded overflow-hidden bg-white/5">
                                  <img
                                    src={ep.cover_url}
                                    alt={ep.title}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                    <div className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center">
                                      <Play className="w-3 h-3 text-white ml-0.5" fill="white" />
                                    </div>
                                  </div>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                {series.plot && (
                                  <p className="text-white/50 text-xs leading-relaxed line-clamp-3">
                                    {series.plot}
                                  </p>
                                )}
                                {ep.duration_secs && (
                                  <p className="text-white/40 text-[11px] mt-1">
                                    {Math.round(ep.duration_secs / 60)} min
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Progress bar */}
                        <div className="w-14 mt-1.5 shrink-0">
                          <div className="h-[3px] bg-white/20 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full bg-red-600`}
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
          </>
        )}
      </div>
    </>
  );
};

export default DesktopEpisodesPanel;
