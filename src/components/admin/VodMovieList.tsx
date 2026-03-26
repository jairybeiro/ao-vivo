import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Search, Film, Loader2, LinkIcon, XCircle, ShieldX, X } from "lucide-react";
import { toast } from "sonner";
import { VodMovieForm } from "./VodMovieForm";
import { BulkUpdateTmdbButton } from "./BulkUpdateTmdbButton";
import { Progress } from "@/components/ui/progress";

interface Movie {
  id: string;
  name: string;
  category: string;
  stream_url: string;
  cover_url: string | null;
  backdrop_url: string | null;
  trailer_url: string | null;
  rating: number | null;
}

const ADULT_KEYWORDS = ['adult', 'adulto', 'xxx', 'porn', '18+', 'erotic', 'erótic'];
const isAdultCategory = (cat: string) => ADULT_KEYWORDS.some(kw => cat.toLowerCase().includes(kw));

export const VodMovieList = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyProgress, setVerifyProgress] = useState({ checked: 0, total: 0, offline: 0 });
  const [offlineItems, setOfflineItems] = useState<{ id: string; name: string; stream_url: string }[]>([]);
  const [deletingAdult, setDeletingAdult] = useState(false);

  const fetchMovies = useCallback(async () => {
    setLoading(true);
    let data: Movie[] | null = null;
    let error: any = null;
    if (search.trim()) {
      const res = await supabase.rpc("search_vod_movies", { search_term: search.trim() });
      data = res.data as Movie[] | null;
      error = res.error;
    } else {
      const res = await supabase.from("vod_movies").select("id, name, category, stream_url, cover_url, backdrop_url, trailer_url, rating").order("created_at", { ascending: false }).limit(100);
      data = res.data;
      error = res.error;
    }
    if (error) { console.error(error); setMovies([]); }
    else setMovies(data || []);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchMovies, 300);
    return () => clearTimeout(timer);
  }, [fetchMovies]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("vod_movies").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir filme", { description: error.message });
    else { toast.success("Filme excluído!"); fetchMovies(); if (selectedMovie?.id === id) setSelectedMovie(null); }
  };

  const handleSuccess = () => {
    setSelectedMovie(null);
    setIsCreating(false);
    fetchMovies();
  };

  const handleDeleteAdult = async () => {
    setDeletingAdult(true);
    try {
      // Fetch all adult movies
      const { data, error } = await supabase.from("vod_movies").select("id, category").limit(10000);
      if (error) throw error;
      const adultIds = (data || []).filter(m => isAdultCategory(m.category)).map(m => m.id);
      if (adultIds.length === 0) { toast.info("Nenhum conteúdo adulto encontrado"); return; }
      // Delete in batches
      for (let i = 0; i < adultIds.length; i += 500) {
        const batch = adultIds.slice(i, i + 500);
        const { error: delErr } = await supabase.from("vod_movies").delete().in("id", batch);
        if (delErr) throw delErr;
      }
      toast.success(`${adultIds.length} filmes adultos removidos!`);
      fetchMovies();
    } catch (err: any) {
      toast.error("Erro ao remover conteúdo adulto", { description: err.message });
    } finally {
      setDeletingAdult(false);
    }
  };

  const handleVerifyLinks = async () => {
    setVerifying(true);
    setOfflineItems([]);
    setVerifyProgress({ checked: 0, total: 0, offline: 0 });
    let offset = 0;
    const batchSize = 20;
    let totalChecked = 0;
    let totalOffline = 0;
    let allOffline: { id: string; name: string; stream_url: string }[] = [];
    try {
      while (true) {
        const { data, error } = await supabase.functions.invoke('verify-vod-links', {
          body: { type: 'movies', offset, batchSize, autoDisable: false },
        });
        if (error) throw error;
        totalChecked += data.checked || 0;
        totalOffline += data.offline || 0;
        if (data.offlineItems) allOffline = [...allOffline, ...data.offlineItems];
        setVerifyProgress({ checked: totalChecked, total: data.total, offline: totalOffline });
        setOfflineItems(allOffline);
        if (data.done || !data.hasMore) break;
        offset = data.nextOffset;
      }
      if (totalOffline === 0) toast.success(`✅ Todos os ${totalChecked} links estão online!`);
      else toast.warning(`⚠️ ${totalOffline} de ${totalChecked} links estão offline`);
    } catch (err: any) {
      toast.error("Erro na verificação", { description: err.message });
    } finally {
      setVerifying(false);
    }
  };

  const handleDisableOffline = async () => {
    const ids = offlineItems.map(i => i.id);
    if (ids.length === 0) return;
    const { error } = await supabase.from("vod_movies").update({ is_active: false }).in("id", ids);
    if (error) toast.error("Erro ao desativar", { description: error.message });
    else { toast.success(`${ids.length} filmes marcados como inativos`); setOfflineItems([]); fetchMovies(); }
  };

  const getStreamFormat = (url: string) => {
    const lower = url.toLowerCase();
    if (lower.includes(".m3u8")) return "M3U8";
    if (lower.includes(".mp4")) return "MP4";
    if (lower.includes(".ts")) return "TS";
    if (lower.includes(".txt")) return "TXT";
    return "URL";
  };

  const showForm = selectedMovie || isCreating;

  return (
    <div className="flex gap-4 h-[calc(100vh-220px)]">
      {/* LEFT: List */}
      <div className={`flex flex-col min-w-0 ${showForm ? 'w-1/2' : 'w-full'} transition-all`}>
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar filme..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <BulkUpdateTmdbButton type="movies" onComplete={fetchMovies} />
          <Button variant="outline" onClick={handleVerifyLinks} disabled={verifying} size="sm">
            {verifying ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <LinkIcon className="w-4 h-4 mr-1" />}
            {verifying ? "Verificando..." : "Verificar Links"}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={deletingAdult} className="text-destructive border-destructive/30 hover:bg-destructive/10">
                {deletingAdult ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <ShieldX className="w-4 h-4 mr-1" />}
                Remover Adultos
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remover todo conteúdo adulto?</AlertDialogTitle>
                <AlertDialogDescription>Isso excluirá permanentemente todos os filmes com categorias adultas (adult, xxx, 18+, etc.).</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAdult} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir Todos</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button size="sm" onClick={() => { setSelectedMovie(null); setIsCreating(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Adicionar
          </Button>
        </div>

        {verifying && verifyProgress.total > 0 && (
          <div className="space-y-2 mb-3">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Verificando {verifyProgress.checked} de {verifyProgress.total}</span>
              <span>{verifyProgress.offline} offline</span>
            </div>
            <Progress value={(verifyProgress.checked / verifyProgress.total) * 100} />
          </div>
        )}

        {!verifying && offlineItems.length > 0 && (
          <Card className="border-destructive/50 mb-3">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <XCircle className="w-4 h-4 text-destructive" />
                {offlineItems.length} filmes com links offline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="max-h-24 overflow-y-auto space-y-1">
                {offlineItems.map(item => (
                  <div key={item.id} className="text-xs text-muted-foreground truncate">❌ {item.name}</div>
                ))}
              </div>
              <Button variant="destructive" size="sm" onClick={handleDisableOffline}>
                Desativar {offlineItems.length} filmes offline
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : movies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhum filme encontrado</div>
          ) : (
            movies.map((movie) => (
              <div
                key={movie.id}
                className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors cursor-pointer ${selectedMovie?.id === movie.id ? 'border-primary bg-primary/10' : 'border-border bg-card hover:bg-muted/50'}`}
                onClick={() => { setSelectedMovie(movie); setIsCreating(false); }}
              >
                {movie.cover_url ? (
                  <img src={movie.cover_url} alt={movie.name} className="w-10 h-14 object-cover rounded flex-shrink-0" />
                ) : (
                  <div className="w-10 h-14 rounded bg-muted flex items-center justify-center flex-shrink-0">
                    <Film className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{movie.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="truncate">{movie.category}</span>
                    <span className="px-1 py-0.5 rounded bg-primary/10 text-primary font-mono text-[10px]">{getStreamFormat(movie.stream_url)}</span>
                    {movie.rating && <span>⭐ {movie.rating}</span>}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
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
            ))
          )}
        </div>
      </div>

      {/* RIGHT: Form Panel */}
      {showForm && (
        <div className="w-1/2 border-l border-border pl-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">
              {isCreating ? "Adicionar Filme" : `Editar: ${selectedMovie?.name}`}
            </h3>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedMovie(null); setIsCreating(false); }}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <VodMovieForm
            key={selectedMovie?.id || 'new'}
            editingMovie={isCreating ? null : selectedMovie}
            onSuccess={handleSuccess}
            onCancel={() => { setSelectedMovie(null); setIsCreating(false); }}
          />
        </div>
      )}
    </div>
  );
};
