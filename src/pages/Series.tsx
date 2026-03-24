import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useVodSeries } from "@/hooks/useVod";
import { useContinueWatching } from "@/hooks/useWatchProgress";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Clapperboard, Search, Star, PlayCircle } from "lucide-react";
import MainHeader from "@/components/MainHeader";
import ScrollableCategories from "@/components/ScrollableCategories";

const formatTime = (s: number) => {
  if (!isFinite(s) || s < 0) return "0:00";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const Series = () => {
  const navigate = useNavigate();
  const mainRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get("genre") || "Todos";
  const showAdult = searchParams.get("adult") === "1";
  const [seriesCategory, setSeriesCategory] = useState(categoryFromUrl);
  const [searchTerm, setSearchTerm] = useState("");
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const { series, categories: seriesCategories, loading, refetch } = useVodSeries(seriesCategory, showAdult);
  const { items: continueWatching, loading: cwLoading } = useContinueWatching(showAdult);

  useEffect(() => {
    const genre = searchParams.get("genre");
    if (genre && genre !== seriesCategory) setSeriesCategory(genre);
  }, [searchParams]);

  useEffect(() => { mainRef.current?.focus(); }, []);

  useEffect(() => {
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      refetch(searchTerm.trim() || undefined);
    }, 300);
    return () => clearTimeout(searchTimerRef.current);
  }, [searchTerm]);

  const handleContinueClick = async (item: any) => {
    const { data: episode } = await supabase.from("vod_episodes").select("series_id").eq("id", item.content_id).maybeSingle();
    if (episode?.series_id) navigate(`/vod/series/${episode.series_id}`);
  };

  const seriesCW = continueWatching.filter(i => i.content_type === "episode");

  return (
    <div ref={mainRef} tabIndex={-1} className="h-screen overflow-y-auto bg-background" style={{ outline: "none" }}>
      <MainHeader />

      <main className="container mx-auto px-4 py-4 space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Séries</h1>

        {!cwLoading && seriesCW.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <PlayCircle className="w-4 h-4 text-primary" />
              Continuar Assistindo
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {seriesCW.map(item => {
                const pct = item.duration_secs > 0 ? (item.current_time_secs / item.duration_secs) * 100 : 0;
                return (
                  <div key={item.id} className="flex-shrink-0 w-40 cursor-pointer group" onClick={() => handleContinueClick(item)}>
                    <div className="aspect-[2/3] bg-muted rounded-lg overflow-hidden relative">
                      {item.content_cover_url ? (
                        <img src={item.content_cover_url} alt={item.content_name} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Clapperboard className="w-8 h-8 text-muted-foreground" /></div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <PlayCircle className="w-10 h-10 text-white" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted-foreground/30">
                        <div className="h-full bg-primary" style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    </div>
                    <p className="text-xs font-medium truncate mt-1">{item.content_name}</p>
                    <p className="text-[10px] text-muted-foreground">{formatTime(item.current_time_secs)} / {formatTime(item.duration_secs)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-10" placeholder="Buscar séries..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        {seriesCategories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSeriesCategory("Todos")}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${seriesCategory === "Todos" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
            >
              Todos
            </button>
            {seriesCategories.map(c => (
              <button
                key={c}
                onClick={() => setSeriesCategory(c)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${seriesCategory === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="text-center text-muted-foreground py-12">Carregando séries...</div>
        ) : series.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">Nenhuma série encontrada.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {series.map(s => (
              <Card key={s.id} className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all overflow-hidden" onClick={() => navigate(`/vod/series/${s.id}`)}>
                <div className="aspect-[2/3] bg-muted relative">
                  {s.cover_url ? (
                    <img src={s.cover_url} alt={s.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Clapperboard className="w-8 h-8 text-muted-foreground" /></div>
                  )}
                  {s.rating && s.rating > 0 && (
                    <div className="absolute top-1 right-1 bg-background/80 text-xs px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />{s.rating}
                    </div>
                  )}
                </div>
                <CardContent className="p-2">
                  <p className="text-xs font-medium truncate">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{s.category}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Series;
