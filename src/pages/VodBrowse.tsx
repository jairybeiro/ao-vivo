import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useVodMovies, useVodSeries } from "@/hooks/useVod";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Film, Clapperboard, Search, Star } from "lucide-react";
import { NavLink } from "@/components/NavLink";

const VodBrowse = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const showAdult = searchParams.get("adult") === "1";
  const [activeTab, setActiveTab] = useState("movies");
  const [movieCategory, setMovieCategory] = useState("Todos");
  const [seriesCategory, setSeriesCategory] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");

  const { movies, categories: movieCategories, loading: moviesLoading } = useVodMovies(movieCategory, showAdult);
  const { series, categories: seriesCategories, loading: seriesLoading } = useVodSeries(seriesCategory, showAdult);

  const filteredMovies = searchTerm
    ? movies.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : movies;

  const filteredSeries = searchTerm
    ? series.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : series;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
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

      <main className="container mx-auto px-4 py-4 space-y-4">
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
            ) : filteredMovies.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                Nenhum filme encontrado. Importe filmes pelo painel admin.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {filteredMovies.map(movie => (
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
            ) : filteredSeries.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                Nenhuma série encontrada. Importe séries pelo painel admin.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {filteredSeries.map(s => (
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
