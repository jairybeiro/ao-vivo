import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useVodMovies, useVodSeries } from "@/hooks/useVod";
import { useContinueWatching, WatchProgress } from "@/hooks/useWatchProgress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Film, Clapperboard, Search, Star, PlayCircle } from "lucide-react";
import MainHeader from "@/components/MainHeader";
import HeroBanner from "@/components/vod/HeroBanner";

const formatTime = (s: number) => {
  if (!isFinite(s) || s < 0) return "0:00";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const VodBrowse = () => {
  const navigate = useNavigate();
  const mainRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();
  const showAdult = searchParams.get("adult") === "1";
  const [activeTab, setActiveTab] = useState("movies");
  const [movieCategory, setMovieCategory] = useState("Todos");
  const [seriesCategory, setSeriesCategory] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const { movies, categories: movieCategories, loading: moviesLoading, refetch: refetchMovies } = useVodMovies(movieCategory, showAdult);
  const { series, categories: seriesCategories, loading: seriesLoading, refetch: refetchSeries } = useVodSeries(seriesCategory, showAdult);
  const { items: continueWatching, loading: cwLoading } = useContinueWatching(showAdult);

  // Auto-focus for immediate scroll
  useEffect(() => {
    mainRef.current?.focus();
  }, []);

  // Debounced server-side search across all categories
  useEffect(() => {
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      const term = searchTerm.trim() || undefined;
      if (activeTab === "movies") {
        refetchMovies(term);
      } else {
        refetchSeries(term);
      }
    }, 300);
    return () => clearTimeout(searchTimerRef.current);
  }, [searchTerm, activeTab]);

  const handleContinueClick = async (item: WatchProgress) => {
    if (item.content_type === "movie") {
      navigate(`/vod/movie/${item.content_id}`);
    } else {
      // For episodes, look up the series_id to navigate correctly
      const { data: episode } = await supabase
        .from("vod_episodes")
        .select("series_id")
        .eq("id", item.content_id)
        .maybeSingle();
      if (episode?.series_id) {
        navigate(`/vod/series/${episode.series_id}`);
      } else {
        // Fallback: episode no longer exists, clean up progress
        navigate("/vod");
      }
    }
  };

  return (
    <div ref={mainRef} tabIndex={-1} className="h-screen overflow-y-auto bg-background" style={{ outline: "none" }}>
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50" style={{ paddingTop: `env(safe-area-inset-top, 0px)` }}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Film className="w-6 h-6 text-primary" />
              <h1 className="text-lg font-bold text-foreground">Filmes & Séries</h1>
            </div>
            <NavLink to="/">Canais</NavLink>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      {!moviesLoading && !seriesLoading && (
        <HeroBanner
          movies={movies}
          series={series}
          activeTab={activeTab as "movies" | "series"}
        />
      )}

      <main className="container mx-auto px-4 py-4 space-y-4">
        {/* Continue Watching */}
        {!cwLoading && continueWatching.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <PlayCircle className="w-4 h-4 text-primary" />
              Continuar Assistindo
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {continueWatching.map(item => {
                const pct = item.duration_secs > 0 ? (item.current_time_secs / item.duration_secs) * 100 : 0;
                return (
                  <div
                    key={item.id}
                    className="flex-shrink-0 w-40 cursor-pointer group"
                    onClick={() => handleContinueClick(item)}
                  >
                    <div className="aspect-[2/3] bg-muted rounded-lg overflow-hidden relative">
                      {item.content_cover_url ? (
                        <img src={item.content_cover_url} alt={item.content_name} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <PlayCircle className="w-10 h-10 text-white" />
                      </div>
                      {/* Progress bar */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted-foreground/30">
                        <div className="h-full bg-primary" style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    </div>
                    <p className="text-xs font-medium truncate mt-1">{item.content_name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatTime(item.current_time_secs)} / {formatTime(item.duration_secs)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Buscar filmes ou séries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center gap-4">
            <TabsList>
              <TabsTrigger value="movies" className="flex items-center gap-1">
                <Film className="w-4 h-4" />
                Filmes
              </TabsTrigger>
              <TabsTrigger value="series" className="flex items-center gap-1">
                <Clapperboard className="w-4 h-4" />
                Séries
              </TabsTrigger>
            </TabsList>

            {activeTab === "movies" && movieCategories.length > 0 && (
              <Select value={movieCategory} onValueChange={setMovieCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  {movieCategories.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {activeTab === "series" && seriesCategories.length > 0 && (
              <Select value={seriesCategory} onValueChange={setSeriesCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  {seriesCategories.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <TabsContent value="movies" className="mt-4">
            {moviesLoading ? (
              <div className="text-center text-muted-foreground py-12">Carregando filmes...</div>
            ) : movies.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                Nenhum filme encontrado. Importe filmes pelo painel admin.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {movies.map(movie => (
                  <Card
                    key={movie.id}
                    className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all overflow-hidden"
                    onClick={() => navigate(`/vod/movie/${movie.id}`)}
                  >
                    <div className="aspect-[2/3] bg-muted relative">
                      {movie.cover_url ? (
                        <img
                          src={movie.cover_url}
                          alt={movie.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      {movie.rating && movie.rating > 0 && (
                        <div className="absolute top-1 right-1 bg-background/80 text-xs px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          {movie.rating}
                        </div>
                      )}
                    </div>
                    <CardContent className="p-2">
                      <p className="text-xs font-medium truncate">{movie.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{movie.category}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="series" className="mt-4">
            {seriesLoading ? (
              <div className="text-center text-muted-foreground py-12">Carregando séries...</div>
            ) : series.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                Nenhuma série encontrada. Importe séries pelo painel admin.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {series.map(s => (
                  <Card
                    key={s.id}
                    className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all overflow-hidden"
                    onClick={() => navigate(`/vod/series/${s.id}`)}
                  >
                    <div className="aspect-[2/3] bg-muted relative">
                      {s.cover_url ? (
                        <img
                          src={s.cover_url}
                          alt={s.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Clapperboard className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      {s.rating && s.rating > 0 && (
                        <div className="absolute top-1 right-1 bg-background/80 text-xs px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          {s.rating}
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
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default VodBrowse;
