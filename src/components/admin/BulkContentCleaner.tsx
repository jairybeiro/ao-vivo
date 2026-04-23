import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Film, Tv2, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Counts {
  movies: number;
  series: number;
  episodes: number;
}

const CINEBIZ_CATEGORIES = [
  "Negócios",
  "Empreendedorismo",
  "Mentalidade",
  "Liderança",
  "Finanças",
  "Marketing",
  "Produtividade",
  "Tecnologia",
  "Desenvolvimento Pessoal",
  "Startups",
];

export const BulkContentCleaner = ({ onCleared }: { onCleared?: () => void }) => {
  const [counts, setCounts] = useState<Counts>({ movies: 0, series: 0, episodes: 0 });
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<"movies" | "series" | "all" | null>(null);

  const fetchCounts = async () => {
    setLoading(true);
    const [moviesRes, seriesRes, episodesRes] = await Promise.all([
      supabase.from("vod_movies").select("id", { count: "exact", head: true }),
      supabase.from("vod_series").select("id", { count: "exact", head: true }),
      supabase.from("vod_episodes").select("id", { count: "exact", head: true }),
    ]);
    setCounts({
      movies: moviesRes.count ?? 0,
      series: seriesRes.count ?? 0,
      episodes: episodesRes.count ?? 0,
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  const deleteAllMovies = async () => {
    setDeleting("movies");
    // Exclui apenas filmes que NÃO são CineBusiness, para preservar a curadoria
    const { error } = await supabase
      .from("vod_movies")
      .delete()
      .not("category", "in", `(${CINEBIZ_CATEGORIES.map((c) => `"${c}"`).join(",")})`);
    setDeleting(null);
    if (error) {
      toast({ title: "Erro ao excluir filmes", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Filmes excluídos", description: "Todos os filmes (exceto CineBusiness) foram removidos." });
    await fetchCounts();
    onCleared?.();
  };

  const deleteAllSeries = async () => {
    setDeleting("series");
    // Episódios são removidos em cascata via FK ON DELETE CASCADE
    const { error } = await supabase.from("vod_series").delete().not("id", "is", null);
    setDeleting(null);
    if (error) {
      toast({ title: "Erro ao excluir séries", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Séries excluídas", description: "Todas as séries e episódios foram removidos." });
    await fetchCounts();
    onCleared?.();
  };

  const deleteAll = async () => {
    setDeleting("all");
    const [moviesRes, seriesRes] = await Promise.all([
      supabase
        .from("vod_movies")
        .delete()
        .not("category", "in", `(${CINEBIZ_CATEGORIES.map((c) => `"${c}"`).join(",")})`),
      supabase.from("vod_series").delete().not("id", "is", null),
    ]);
    setDeleting(null);
    const err = moviesRes.error || seriesRes.error;
    if (err) {
      toast({ title: "Erro ao limpar acervo", description: err.message, variant: "destructive" });
      return;
    }
    toast({ title: "Acervo limpo", description: "Filmes e séries foram removidos." });
    await fetchCounts();
    onCleared?.();
  };

  const isBusy = deleting !== null;

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <Trash2 className="w-5 h-5" />
          Limpeza em Massa
        </CardTitle>
        <CardDescription>
          Remove conteúdo importado quando uma fonte parar de funcionar e precisar ser substituída.
          Filmes do CineBusiness são preservados.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="text-2xl font-bold">{loading ? "—" : counts.movies}</div>
            <div className="text-xs text-muted-foreground">Filmes</div>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="text-2xl font-bold">{loading ? "—" : counts.series}</div>
            <div className="text-xs text-muted-foreground">Séries</div>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="text-2xl font-bold">{loading ? "—" : counts.episodes}</div>
            <div className="text-xs text-muted-foreground">Episódios</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="flex-1" disabled={isBusy || counts.movies === 0}>
                {deleting === "movies" ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Film className="w-4 h-4 mr-2" />
                )}
                Excluir Filmes
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir todos os filmes?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação removerá todos os filmes do acervo (exceto os do CineBusiness).
                  Não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={deleteAllMovies} className="bg-destructive hover:bg-destructive/90">
                  Sim, excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="flex-1" disabled={isBusy || counts.series === 0}>
                {deleting === "series" ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Tv2 className="w-4 h-4 mr-2" />
                )}
                Excluir Séries
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir todas as séries?</AlertDialogTitle>
                <AlertDialogDescription>
                  Todas as séries serão removidas, incluindo todas as temporadas e episódios em cascata.
                  Não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={deleteAllSeries} className="bg-destructive hover:bg-destructive/90">
                  Sim, excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={isBusy || (counts.movies === 0 && counts.series === 0)}
              >
                {deleting === "all" ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Limpar Tudo
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Limpar todo o acervo?</AlertDialogTitle>
                <AlertDialogDescription>
                  Filmes e séries (com episódios) serão removidos. O CineBusiness será preservado.
                  Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={deleteAll} className="bg-destructive hover:bg-destructive/90">
                  Sim, limpar tudo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};
