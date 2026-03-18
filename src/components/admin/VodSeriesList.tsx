import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Search, Clapperboard, Loader2, ChevronRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { VodSeriesForm } from "./VodSeriesForm";
import { VodEpisodeForm } from "./VodEpisodeForm";

interface Series {
  id: string;
  name: string;
  category: string;
  cover_url: string | null;
  plot: string | null;
  rating: number | null;
}

interface Episode {
  id: string;
  title: string;
  season: number;
  episode_num: number;
  stream_url: string;
  cover_url: string | null;
  duration_secs: number | null;
}

export const VodSeriesList = () => {
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingSeries, setEditingSeries] = useState<Series | null>(null);
  const [isSeriesModalOpen, setIsSeriesModalOpen] = useState(false);

  // Episode management
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null);
  const [isEpisodeModalOpen, setIsEpisodeModalOpen] = useState(false);

  const fetchSeries = useCallback(async () => {
    setLoading(true);
    let data: Series[] | null = null;
    let error: any = null;
    if (search.trim()) {
      const res = await supabase.rpc("search_vod_series", { search_term: search.trim() });
      data = res.data as Series[] | null;
      error = res.error;
    } else {
      const res = await supabase.from("vod_series").select("id, name, category, cover_url, plot, rating").order("created_at", { ascending: false }).limit(100);
      data = res.data;
      error = res.error;
    }
    if (error) { console.error(error); setSeriesList([]); }
    else setSeriesList(data || []);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchSeries, 300);
    return () => clearTimeout(timer);
  }, [fetchSeries]);

  const fetchEpisodes = useCallback(async (seriesId: string) => {
    setEpisodesLoading(true);
    const { data, error } = await supabase
      .from("vod_episodes")
      .select("id, title, season, episode_num, stream_url, cover_url, duration_secs")
      .eq("series_id", seriesId)
      .order("season", { ascending: true })
      .order("episode_num", { ascending: true });
    if (error) { console.error(error); setEpisodes([]); }
    else setEpisodes(data || []);
    setEpisodesLoading(false);
  }, []);

  const handleDeleteSeries = async (id: string) => {
    const { error } = await supabase.from("vod_series").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir série", { description: error.message });
    else { toast.success("Série excluída!"); fetchSeries(); }
  };

  const handleDeleteEpisode = async (id: string) => {
    const { error } = await supabase.from("vod_episodes").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir episódio", { description: error.message });
    else { toast.success("Episódio excluído!"); if (selectedSeries) fetchEpisodes(selectedSeries.id); }
  };

  const handleSeriesSuccess = () => {
    setEditingSeries(null);
    setIsSeriesModalOpen(false);
    fetchSeries();
  };

  const handleEpisodeSuccess = () => {
    setEditingEpisode(null);
    setIsEpisodeModalOpen(false);
    if (selectedSeries) fetchEpisodes(selectedSeries.id);
  };

  const openSeriesEpisodes = (series: Series) => {
    setSelectedSeries(series);
    fetchEpisodes(series.id);
  };

  const getStreamFormat = (url: string) => {
    const lower = url.toLowerCase();
    if (lower.includes(".m3u8")) return "M3U8";
    if (lower.includes(".mp4")) return "MP4";
    if (lower.includes(".ts")) return "TS";
    if (lower.includes(".txt")) return "TXT";
    return "URL";
  };

  // Episode view
  if (selectedSeries) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedSeries(null)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">{selectedSeries.name}</h3>
            <p className="text-xs text-muted-foreground">Gerenciar episódios</p>
          </div>
          <Button onClick={() => { setEditingEpisode(null); setIsEpisodeModalOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Adicionar Episódio
          </Button>
        </div>

        {episodesLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : episodes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Nenhum episódio. Adicione o primeiro!</div>
        ) : (
          <div className="space-y-2">
            {episodes.map((ep) => (
              <div key={ep.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors">
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  S{ep.season}E{ep.episode_num}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{ep.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono">{getStreamFormat(ep.stream_url)}</span>
                    {ep.duration_secs && <span>{Math.floor(ep.duration_secs / 60)}min</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => { setEditingEpisode(ep); setIsEpisodeModalOpen(true); }}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir "{ep.title}"?</AlertDialogTitle>
                        <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteEpisode(ep.id)}>Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={isEpisodeModalOpen} onOpenChange={setIsEpisodeModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingEpisode ? "Editar Episódio" : "Adicionar Episódio"}</DialogTitle>
              <DialogDescription>{selectedSeries.name}</DialogDescription>
            </DialogHeader>
            <VodEpisodeForm seriesId={selectedSeries.id} editingEpisode={editingEpisode} onSuccess={handleEpisodeSuccess} onCancel={() => { setEditingEpisode(null); setIsEpisodeModalOpen(false); }} />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Series list view
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar série..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={() => { setEditingSeries(null); setIsSeriesModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Adicionar Série
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : seriesList.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">Nenhuma série encontrada</div>
      ) : (
        <div className="space-y-2">
          {seriesList.map((series) => (
            <div key={series.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors">
              {series.cover_url ? (
                <img src={series.cover_url} alt={series.name} className="w-12 h-16 object-cover rounded" />
              ) : (
                <div className="w-12 h-16 rounded bg-muted flex items-center justify-center">
                  <Clapperboard className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openSeriesEpisodes(series)}>
                <p className="font-medium text-sm truncate">{series.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{series.category}</span>
                  {series.rating && <span>⭐ {series.rating}</span>}
                  <span className="flex items-center gap-1 text-primary">Episódios <ChevronRight className="w-3 h-3" /></span>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => { setEditingSeries(series); setIsSeriesModalOpen(true); }}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir "{series.name}"?</AlertDialogTitle>
                      <AlertDialogDescription>Todos os episódios serão excluídos junto.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteSeries(series.id)}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isSeriesModalOpen} onOpenChange={setIsSeriesModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingSeries ? "Editar Série" : "Adicionar Série"}</DialogTitle>
            <DialogDescription>{editingSeries ? "Atualize as informações da série" : "Preencha as informações da nova série"}</DialogDescription>
          </DialogHeader>
          <VodSeriesForm editingSeries={editingSeries} onSuccess={handleSeriesSuccess} onCancel={() => { setEditingSeries(null); setIsSeriesModalOpen(false); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
};
