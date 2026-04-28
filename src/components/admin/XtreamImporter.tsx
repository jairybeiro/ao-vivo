import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Copy, Check, Loader2, Eye, EyeOff, Film, Tv, Download, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface XtreamCredentials {
  host: string;
  username: string;
  password: string;
}

const API_PRESETS: Record<string, XtreamCredentials> = {
  elitedns: { host: "http://elitedns.sbs", username: "1993119", password: "6020464" },
  smarters: { host: "http://smarters.sbs", username: "1993119", password: "6020464" },
  ipsmart: { host: "http://ipsmart.icu", username: "5541996151706", password: "5541996151706" },
  parceirobx: { host: "http://parceirobx.top", username: "269198972", password: "941862576" },
  mgf: { host: "https://w1.mgf.lat", username: "8766366135", password: "4325807369" },
};

interface MovieResult {
  stream_id: number;
  name: string;
  stream_url: string;
  cover_url: string | null;
  rating: string | null;
  category_id: string | null;
  container_extension: string;
  added: string | null;
}

interface SeriesResult {
  series_id: number;
  name: string;
  cover_url: string | null;
  rating: string | null;
  plot: string | null;
  category_id: string | null;
}

interface EpisodeResult {
  id: string;
  season: number;
  episode_num: string;
  title: string;
  stream_url: string;
  cover_url: string | null;
  duration_secs: number | null;
}

interface SeriesInfo {
  info: {
    name: string;
    cover_url: string | null;
    backdrop_url: string | null;
    plot: string | null;
    rating: string | null;
    tmdb_id: number | null;
  };
  episodes: EpisodeResult[];
  season_count: number;
}

export const XtreamImporter = () => {
  const [showCredentials, setShowCredentials] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState("elitedns");
  const [credentials, setCredentials] = useState<XtreamCredentials>(API_PRESETS.elitedns);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<"movie" | "series">("movie");

  // Movie state
  const [movieResults, setMovieResults] = useState<MovieResult[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<MovieResult | null>(null);
  const [importingMovie, setImportingMovie] = useState(false);

  // Series state
  const [seriesResults, setSeriesResults] = useState<SeriesResult[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<SeriesResult | null>(null);
  const [seriesInfo, setSeriesInfo] = useState<SeriesInfo | null>(null);
  const [loadingSeriesInfo, setLoadingSeriesInfo] = useState(false);
  const [importingSeries, setImportingSeries] = useState(false);
  const [expandedSeasons, setExpandedSeasons] = useState<Set<number>>(new Set());

  const [searching, setSearching] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    if (API_PRESETS[preset]) setCredentials(API_PRESETS[preset]);
  };

  const handleSearch = useCallback(async () => {
    if (searchTerm.trim().length < 2) {
      toast.error("Digite pelo menos 2 caracteres");
      return;
    }
    setSearching(true);
    setMovieResults([]);
    setSeriesResults([]);

    try {
      const { data, error } = await supabase.functions.invoke("xtream-search", {
        body: { ...credentials, search: searchTerm.trim(), type: searchType },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (searchType === "movie") {
        setMovieResults(data?.results || []);
      } else {
        setSeriesResults(data?.results || []);
      }
      if ((data?.results || []).length === 0) toast.info("Nenhum resultado encontrado");
    } catch (err: any) {
      toast.error("Erro na busca: " + (err.message || "Erro desconhecido"));
    } finally {
      setSearching(false);
    }
  }, [searchTerm, credentials, searchType]);

  const handleSelectSeries = async (series: SeriesResult) => {
    setSelectedSeries(series);
    setLoadingSeriesInfo(true);
    setSeriesInfo(null);
    try {
      const { data, error } = await supabase.functions.invoke("xtream-series-info", {
        body: { ...credentials, series_id: series.series_id },
      });
      if (error) throw error;
      setSeriesInfo(data);
      // Expand first season by default
      if (data?.episodes?.length > 0) {
        const seasons = Array.from(new Set(data.episodes.map((ep: EpisodeResult) => ep.season))) as number[];
        setExpandedSeasons(new Set<number>([seasons[0]]));
      }
    } catch (err: any) {
      toast.error("Erro ao carregar série: " + err.message);
    } finally {
      setLoadingSeriesInfo(false);
    }
  };

  const importMovie = async (movie: MovieResult) => {
    setImportingMovie(true);
    try {
      const { error } = await supabase.from("vod_movies").insert({
        name: movie.name,
        stream_url: movie.stream_url,
        cover_url: movie.cover_url || null,
        rating: movie.rating ? parseFloat(String(movie.rating)) : null,
        xtream_id: movie.stream_id,
        category: "Filmes",
        is_active: true,
      });
      if (error) {
        if (error.message?.includes("duplicate") || error.message?.includes("unique")) {
          toast.error("Filme já importado");
        } else throw error;
      } else {
        toast.success(`"${movie.name}" importado com sucesso!`);
      }
    } catch (err: any) {
      toast.error("Erro ao importar: " + err.message);
    } finally {
      setImportingMovie(false);
    }
  };

  const importSeries = async () => {
    if (!selectedSeries || !seriesInfo) return;
    setImportingSeries(true);
    try {
      // Insert series
      const { data: insertedSeries, error: seriesError } = await supabase
        .from("vod_series")
        .insert({
          name: seriesInfo.info.name || selectedSeries.name,
          cover_url: seriesInfo.info.cover_url || selectedSeries.cover_url || null,
          backdrop_url: seriesInfo.info.backdrop_url || null,
          plot: seriesInfo.info.plot || selectedSeries.plot || null,
          rating: seriesInfo.info.rating ? parseFloat(String(seriesInfo.info.rating)) : null,
          tmdb_id: seriesInfo.info.tmdb_id || null,
          xtream_id: selectedSeries.series_id,
          category: "Séries",
          is_active: true,
        })
        .select("id")
        .single();

      if (seriesError) {
        if (seriesError.message?.includes("duplicate") || seriesError.message?.includes("unique")) {
          toast.error("Série já importada");
        } else throw seriesError;
        setImportingSeries(false);
        return;
      }

      // Insert episodes
      const episodes = seriesInfo.episodes.map((ep) => ({
        series_id: insertedSeries.id,
        season: ep.season,
        episode_num: parseInt(String(ep.episode_num)) || 1,
        title: ep.title,
        stream_url: ep.stream_url,
        cover_url: ep.cover_url || null,
        duration_secs: ep.duration_secs || null,
        plot: (ep as any).plot || null,
        xtream_id: parseInt(String(ep.id)),
      }));

      if (episodes.length > 0) {
        const { error: epError } = await supabase.from("vod_episodes").insert(episodes);
        if (epError) throw epError;
      }

      toast.success(`"${seriesInfo.info.name}" importada com ${episodes.length} episódios!`);
      setSelectedSeries(null);
      setSeriesInfo(null);
    } catch (err: any) {
      toast.error("Erro ao importar série: " + err.message);
    } finally {
      setImportingSeries(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success("Copiado!");
      setTimeout(() => setCopiedField(null), 2000);
    } catch { toast.error("Erro ao copiar"); }
  };

  const toggleSeason = (season: number) => {
    setExpandedSeasons((prev) => {
      const next = new Set(prev);
      next.has(season) ? next.delete(season) : next.add(season);
      return next;
    });
  };

  // Group episodes by season
  const episodesBySeason = seriesInfo?.episodes.reduce((acc, ep) => {
    if (!acc[ep.season]) acc[ep.season] = [];
    acc[ep.season].push(ep);
    return acc;
  }, {} as Record<number, EpisodeResult[]>);

  return (
    <Card className="border-primary/20">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Download className="w-4 h-4" /> Importar via Xtream
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowCredentials(!showCredentials)}>
            {showCredentials ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
            {showCredentials ? "Ocultar" : "Credenciais"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {showCredentials && (
          <div className="space-y-2">
            <Select value={selectedPreset} onValueChange={handlePresetChange}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Selecionar API" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="elitedns">elitedns.sbs (atual)</SelectItem>
                <SelectItem value="smarters">smarters.sbs</SelectItem>
                <SelectItem value="ipsmart">ipsmart.icu</SelectItem>
                <SelectItem value="parceirobx">parceirobx.top (novo)</SelectItem>
                <SelectItem value="mgf">w1.mgf.lat (novo)</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
            {selectedPreset === "custom" && (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Host</Label>
                  <Input className="h-8 text-xs" value={credentials.host} onChange={(e) => setCredentials({ ...credentials, host: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Usuário</Label>
                  <Input className="h-8 text-xs" value={credentials.username} onChange={(e) => setCredentials({ ...credentials, username: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Senha</Label>
                  <Input className="h-8 text-xs" type="password" value={credentials.password} onChange={(e) => setCredentials({ ...credentials, password: e.target.value })} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search Type + Input */}
        <Tabs value={searchType} onValueChange={(v) => { setSearchType(v as "movie" | "series"); setMovieResults([]); setSeriesResults([]); }}>
          <TabsList className="grid w-full grid-cols-2 h-8">
            <TabsTrigger value="movie" className="text-xs flex items-center gap-1">
              <Film className="w-3 h-3" /> Filmes
            </TabsTrigger>
            <TabsTrigger value="series" className="text-xs flex items-center gap-1">
              <Tv className="w-3 h-3" /> Séries
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2">
          <Input
            className="h-9 text-sm"
            placeholder={searchType === "movie" ? "Ex: Forrest Gump, Wolf..." : "Ex: Breaking Bad, Friends..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button size="sm" className="h-9 px-4" onClick={handleSearch} disabled={searching}>
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>

        {/* Movie Results */}
        {movieResults.length > 0 && (
          <div className="max-h-72 overflow-y-auto space-y-1 border rounded-md p-2">
            {movieResults.map((item) => (
              <div key={item.stream_id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 transition-colors">
                {item.cover_url && (
                  <img src={item.cover_url} alt="" className="w-8 h-11 rounded object-cover flex-shrink-0" onError={(e) => (e.currentTarget.style.display = "none")} />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">.{item.container_extension}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => copyToClipboard(item.stream_url, `url-${item.stream_id}`)}>
                    {copiedField === `url-${item.stream_id}` ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                  </Button>
                  <Button size="sm" variant="default" className="h-7 px-2 text-xs" onClick={() => importMovie(item)} disabled={importingMovie}>
                    {importingMovie ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Series Results */}
        {seriesResults.length > 0 && (
          <div className="max-h-72 overflow-y-auto space-y-1 border rounded-md p-2">
            {seriesResults.map((item) => (
              <button
                key={item.series_id}
                onClick={() => handleSelectSeries(item)}
                className="w-full flex items-center gap-2 p-2 rounded hover:bg-muted/50 text-left transition-colors"
              >
                {item.cover_url && (
                  <img src={item.cover_url} alt="" className="w-8 h-11 rounded object-cover flex-shrink-0" onError={(e) => (e.currentTarget.style.display = "none")} />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  {item.rating && <p className="text-xs text-primary">⭐ {item.rating}</p>}
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>

      {/* Series Detail Modal */}
      <Dialog open={!!selectedSeries} onOpenChange={(open) => { if (!open) { setSelectedSeries(null); setSeriesInfo(null); } }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">{selectedSeries?.name}</DialogTitle>
            <DialogDescription>
              {loadingSeriesInfo ? "Carregando episódios..." : seriesInfo ? `${seriesInfo.season_count} temporada(s) · ${seriesInfo.episodes.length} episódio(s)` : "Detalhes da série"}
            </DialogDescription>
          </DialogHeader>

          {loadingSeriesInfo && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}

          {seriesInfo && (
            <div className="space-y-4">
              {/* Series info */}
              <div className="flex gap-3">
                {seriesInfo.info.cover_url && (
                  <img src={seriesInfo.info.cover_url} alt="" className="w-20 h-28 rounded object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{seriesInfo.info.name}</p>
                  {seriesInfo.info.rating && <p className="text-xs text-primary mt-1">⭐ {seriesInfo.info.rating}</p>}
                  {seriesInfo.info.plot && <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{seriesInfo.info.plot}</p>}
                </div>
              </div>

              {/* Episodes by season */}
              {episodesBySeason && Object.entries(episodesBySeason)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([season, episodes]) => (
                  <div key={season} className="border rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleSeason(Number(season))}
                      className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-sm font-medium">Temporada {season}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{episodes.length} ep.</span>
                        {expandedSeasons.has(Number(season)) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </div>
                    </button>
                    {expandedSeasons.has(Number(season)) && (
                      <div className="divide-y">
                        {episodes.map((ep) => (
                          <div key={ep.id} className="flex items-center gap-2 px-3 py-2 text-xs">
                            <span className="text-muted-foreground w-6">E{ep.episode_num}</span>
                            <span className="flex-1 truncate">{ep.title}</span>
                            {ep.duration_secs && (
                              <span className="text-muted-foreground">{Math.round(ep.duration_secs / 60)}min</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

              <Button className="w-full" onClick={importSeries} disabled={importingSeries}>
                {importingSeries ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                Importar Série Completa ({seriesInfo.episodes.length} episódios)
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Movie Detail Modal */}
      <Dialog open={!!selectedMovie} onOpenChange={(open) => !open && setSelectedMovie(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">{selectedMovie?.name}</DialogTitle>
            <DialogDescription>Detalhes do filme</DialogDescription>
          </DialogHeader>
          {selectedMovie && (
            <div className="space-y-3">
              {selectedMovie.cover_url && <img src={selectedMovie.cover_url} alt="" className="w-full max-h-48 object-contain rounded" />}
              <FieldRow label="URL" value={selectedMovie.stream_url} onCopy={copyToClipboard} copiedField={copiedField} highlight />
              <Button className="w-full" onClick={() => importMovie(selectedMovie)} disabled={importingMovie}>
                {importingMovie ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                Importar Filme
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

function FieldRow({ label, value, onCopy, copiedField, highlight }: {
  label: string; value: string; onCopy: (text: string, field: string) => void; copiedField: string | null; highlight?: boolean;
}) {
  return (
    <div className={`flex items-start gap-2 p-2 rounded ${highlight ? "bg-primary/10 border border-primary/20" : "bg-muted/30"}`}>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className={`text-xs break-all ${highlight ? "text-primary font-medium" : ""}`}>{value}</p>
      </div>
      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onCopy(value, label)}>
        {copiedField === label ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
      </Button>
    </div>
  );
}
