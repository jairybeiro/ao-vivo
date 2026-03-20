import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Search, Film, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { VodMovieForm } from "./VodMovieForm";

interface Movie {
  id: string;
  name: string;
  category: string;
  stream_url: string;
  cover_url: string | null;
  backdrop_url: string | null;
  rating: number | null;
}

export const VodMovieList = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchMovies = useCallback(async () => {
    setLoading(true);
    let data: Movie[] | null = null;
    let error: any = null;
    if (search.trim()) {
      const res = await supabase.rpc("search_vod_movies", { search_term: search.trim() });
      data = res.data as Movie[] | null;
      error = res.error;
    } else {
      const res = await supabase.from("vod_movies").select("id, name, category, stream_url, cover_url, backdrop_url, rating").order("created_at", { ascending: false }).limit(100);
      data = res.data;
      error = res.error;
    }
    if (error) {
      console.error(error);
      setMovies([]);
    } else {
      setMovies(data || []);
    }
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchMovies, 300);
    return () => clearTimeout(timer);
  }, [fetchMovies]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("vod_movies").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir filme", { description: error.message });
    } else {
      toast.success("Filme excluído!");
      fetchMovies();
    }
  };

  const handleSuccess = () => {
    setEditingMovie(null);
    setIsModalOpen(false);
    fetchMovies();
  };

  const getStreamFormat = (url: string) => {
    const lower = url.toLowerCase();
    if (lower.includes(".m3u8")) return "M3U8";
    if (lower.includes(".mp4")) return "MP4";
    if (lower.includes(".ts")) return "TS";
    if (lower.includes(".txt")) return "TXT";
    return "URL";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar filme..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={() => { setEditingMovie(null); setIsModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Adicionar Filme
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : movies.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">Nenhum filme encontrado</div>
      ) : (
        <div className="space-y-2">
          {movies.map((movie) => (
            <div key={movie.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors">
              {movie.cover_url ? (
                <img src={movie.cover_url} alt={movie.name} className="w-12 h-16 object-cover rounded" />
              ) : (
                <div className="w-12 h-16 rounded bg-muted flex items-center justify-center">
                  <Film className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{movie.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{movie.category}</span>
                  <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono">{getStreamFormat(movie.stream_url)}</span>
                  {movie.rating && <span>⭐ {movie.rating}</span>}
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => { setEditingMovie(movie); setIsModalOpen(true); }}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir "{movie.name}"?</AlertDialogTitle>
                      <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(movie.id)}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingMovie ? "Editar Filme" : "Adicionar Filme"}</DialogTitle>
            <DialogDescription>{editingMovie ? "Atualize as informações do filme" : "Preencha as informações do novo filme"}</DialogDescription>
          </DialogHeader>
          <VodMovieForm editingMovie={editingMovie} onSuccess={handleSuccess} onCancel={() => { setEditingMovie(null); setIsModalOpen(false); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
};
