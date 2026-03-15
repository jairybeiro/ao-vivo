import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Film, Clapperboard, Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface ImportResult {
  moviesInserted: number;
  seriesInserted: number;
  episodesInserted: number;
  errors: number;
  totalMoviesInApi: number;
  totalSeriesInApi: number;
  hasMoreSeries: boolean;
  seriesPage: number;
}

const VodImport = () => {
  const [dns, setDns] = useState("http://ipsmart.icu");
  const [username, setUsername] = useState("5541996151706");
  const [password, setPassword] = useState("5541996151706");
  const [loading, setLoading] = useState(false);
  const [importType, setImportType] = useState<"movies" | "series" | "both">("both");
  const [progress, setProgress] = useState({ current: 0, total: 0, phase: "" });
  const [totalResult, setTotalResult] = useState<{ movies: number; series: number; episodes: number; errors: number } | null>(null);
  const cancelRef = useRef(false);

  const callImport = async (type: string, seriesPage = 0): Promise<ImportResult> => {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/import-xtream-vod`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({ dns, username, password, type, seriesPage, seriesPageSize: 50 }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Erro na importação");
    return data;
  };

  const handleImport = async () => {
    if (!dns || !username || !password) {
      toast.error("Preencha todos os campos");
      return;
    }

    setLoading(true);
    setTotalResult(null);
    cancelRef.current = false;

    let totalMovies = 0, totalSeries = 0, totalEpisodes = 0, totalErrors = 0;

    try {
      // Phase 1: Movies
      if (importType === "movies" || importType === "both") {
        setProgress({ current: 0, total: 1, phase: "Importando filmes..." });
        const result = await callImport("movies");
        totalMovies = result.moviesInserted;
        totalErrors += result.errors;
      }

      if (cancelRef.current) throw new Error("Cancelado");

      // Phase 2: Series (paginated)
      if (importType === "series" || importType === "both") {
        // First call to get total
        setProgress({ current: 0, total: 1, phase: "Carregando séries (página 1)..." });
        const firstResult = await callImport("series", 0);
        totalSeries += firstResult.seriesInserted;
        totalEpisodes += firstResult.episodesInserted;
        totalErrors += firstResult.errors;

        const totalInApi = firstResult.totalSeriesInApi;
        const pageSize = 50;
        const totalPages = Math.ceil(totalInApi / pageSize);

        setProgress({ current: 1, total: totalPages, phase: `Séries: página 1 de ${totalPages}` });

        // Continue with remaining pages
        let page = 1;
        while (firstResult.hasMoreSeries || page < totalPages) {
          if (cancelRef.current) throw new Error("Cancelado");
          if (page >= totalPages) break;

          setProgress({ current: page + 1, total: totalPages, phase: `Séries: página ${page + 1} de ${totalPages}` });
          const result = await callImport("series", page);
          totalSeries += result.seriesInserted;
          totalEpisodes += result.episodesInserted;
          totalErrors += result.errors;

          if (!result.hasMoreSeries) break;
          page++;
        }
      }

      setTotalResult({ movies: totalMovies, series: totalSeries, episodes: totalEpisodes, errors: totalErrors });
      toast.success(`Importação completa! ${totalMovies} filmes, ${totalSeries} séries, ${totalEpisodes} episódios`);
    } catch (err) {
      if ((err as Error).message === "Cancelado") {
        toast.info("Importação cancelada");
      } else {
        toast.error(err instanceof Error ? err.message : "Erro na importação VOD");
      }
      if (totalMovies || totalSeries || totalEpisodes) {
        setTotalResult({ movies: totalMovies, series: totalSeries, episodes: totalEpisodes, errors: totalErrors });
      }
    } finally {
      setLoading(false);
    }
  };

  const progressPercent = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Film className="w-5 h-5" />
          Importar Filmes e Séries (VOD)
        </CardTitle>
        <CardDescription>
          Importe filmes e séries da API Xtream Codes. Séries são importadas em páginas para evitar timeout.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="vod-dns">DNS / URL</Label>
            <Input id="vod-dns" value={dns} onChange={(e) => setDns(e.target.value)} placeholder="http://servidor.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vod-user">Usuário</Label>
            <Input id="vod-user" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vod-pass">Senha</Label>
            <Input id="vod-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>O que importar?</Label>
          <Tabs value={importType} onValueChange={(v) => setImportType(v as any)}>
            <TabsList className="grid grid-cols-3 w-full max-w-sm">
              <TabsTrigger value="both">Tudo</TabsTrigger>
              <TabsTrigger value="movies" className="flex items-center gap-1">
                <Film className="w-3 h-3" /> Filmes
              </TabsTrigger>
              <TabsTrigger value="series" className="flex items-center gap-1">
                <Clapperboard className="w-3 h-3" /> Séries
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleImport} disabled={loading} className="flex-1">
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importando...</>
            ) : (
              <><Film className="w-4 h-4 mr-2" /> Importar {importType === "movies" ? "Filmes" : importType === "series" ? "Séries" : "Tudo"}</>
            )}
          </Button>
          {loading && (
            <Button variant="destructive" onClick={() => { cancelRef.current = true; }}>
              <XCircle className="w-4 h-4 mr-1" /> Cancelar
            </Button>
          )}
        </div>

        {loading && progress.phase && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{progress.phase}</p>
            <Progress value={progressPercent} />
          </div>
        )}

        {totalResult && (
          <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <CheckCircle className="w-4 h-4" /> Importação concluída
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Filmes: <strong>{totalResult.movies}</strong></p>
              <p>Séries: <strong>{totalResult.series}</strong></p>
              <p>Episódios: <strong>{totalResult.episodes}</strong></p>
              {totalResult.errors > 0 && <p className="text-destructive">Erros: {totalResult.errors}</p>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VodImport;
