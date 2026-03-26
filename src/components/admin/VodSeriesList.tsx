import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Search, Clapperboard, Loader2, ChevronRight, ArrowLeft, ShieldX, X } from "lucide-react";
import { toast } from "sonner";
import { VodSeriesForm } from "./VodSeriesForm";
import { VodEpisodeForm } from "./VodEpisodeForm";
import { BulkUpdateTmdbButton } from "./BulkUpdateTmdbButton";

const ADULT_KEYWORDS = ['adult', 'adulto', 'xxx', 'porn', '18+', 'erotic', 'erótic'];
const isAdultCategory = (cat: string) => ADULT_KEYWORDS.some(kw => cat.toLowerCase().includes(kw));

interface Series {
  id: string;
  name: string;
  category: string;
  cover_url: string | null;
  backdrop_url: string | null;
  trailer_url: string | null;
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
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingAdult, setDeletingAdult] = useState(false);

  // Episode management
  const [episodeViewSeries, setEpisodeViewSeries] = useState<Series | null>(null);
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
      const res = await supabase.from("vod_series").select("id, name, category, cover_url, backdrop_url, trailer_url, plot, rating").order("created_at", { ascending: false }).limit(100);
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
    else { toast.success("Série excluída!"); fetchSeries(); if (selectedSeries?.id === id) setSelectedSeries(null); }
  };

  const handleDeleteEpisode = async (id: string) => {
    const { error } = await supabase.from("vod_episodes").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir episódio", { description: error.message });
    else { toast.success("Episódio excluído!"); if (episodeViewSeries) fetchEpisodes(episodeViewSeries.id); }
  };

  const handleSeriesSuccess = () => {
    setSelectedSeries(null);
    setIsCreating(false);
    fetchSeries();
  };

  const handleEpisodeSuccess = () => {
    setEditingEpisode(null);
    setIsEpisodeModalOpen(false);
    if (episodeViewSeries) fetchEpisodes(episodeViewSeries.id);
  };

  const handleDeleteAdult = async () => {
    setDeletingAdult(true);
    try {
      const { data, error } = await supabase.from("vod_series").select("id, category").limit(10000);
      if (error) throw error;
      const adultIds = (data || []).filter(s => isAdultCategory(s.category)).map(s => s.id);
      if (adultIds.length === 0) { toast.info("Nenhum conteúdo adulto encontrado"); return; }
      for (let i = 0; i < adultIds.length; i += 500) {
        const batch = adultIds.slice(i, i + 500);
        const { error: delErr } = await supabase.from("vod_series").delete().in("id", batch);
        if (delErr) throw delErr;
      }
      toast.success(`${adultIds.length} séries adultas removidas!`);
      fetchSeries();
    } catch (err: any) {
      toast.error("Erro ao remover conteúdo adulto", { description: err.message });
    } finally {
      setDeletingAdult(false);
    }
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
  if (episodeViewSeries) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setEpisodeViewSeries(null)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">{episodeViewSeries.name}</h3>
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
              <DialogDescription>{episodeViewSeries.name}</DialogDescription>
            </DialogHeader>
            <VodEpisodeForm seriesId={episodeViewSeries.id} editingEpisode={editingEpisode} onSuccess={handleEpisodeSuccess} onCancel={() => { setEditingEpisode(null); setIsEpisodeModalOpen(false); }} />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  const showForm = selectedSeries || isCreating;

  // Series list view with split panel
  return (
    <div className="flex gap-4 h-[calc(100vh-220px)]">
      {/* LEFT: List */}
      <div className={`flex flex-col min-w-0 ${showForm ? 'w-1/2' : 'w-full'} transition-all`}>
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar série..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <BulkUpdateTmdbButton type="series" onComplete={fetchSeries} />
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
                <AlertDialogDescription>Isso excluirá permanentemente todas as séries (e seus episódios) com categorias adultas.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAdult} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir Todos</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button size="sm" onClick={() => { setSelectedSeries(null); setIsCreating(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Adicionar
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : seriesList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhuma série encontrada</div>
          ) : (
            seriesList.map((series) => (
              <div
                key={series.id}
                className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors cursor-pointer ${selectedSeries?.id === series.id ? 'border-primary bg-primary/10' : 'border-border bg-card hover:bg-muted/50'}`}
                onClick={() => { setSelectedSeries(series); setIsCreating(false); }}
              >
                {series.cover_url ? (
                  <img src={series.cover_url} alt={series.name} className="w-10 h-14 object-cover rounded flex-shrink-0" />
                ) : (
                  <div className="w-10 h-14 rounded bg-muted flex items-center justify-center flex-shrink-0">
                    <Clapperboard className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{series.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="truncate">{series.category}</span>
                    {series.rating && <span>⭐ {series.rating}</span>}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setEpisodeViewSeries(series); fetchEpisodes(series.id); }}>
                    <ChevronRight className="w-4 h-4 text-primary" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
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
            ))
          )}
        </div>
      </div>

      {/* RIGHT: Form Panel */}
      {showForm && (
        <div className="w-1/2 border-l border-border pl-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">
              {isCreating ? "Adicionar Série" : `Editar: ${selectedSeries?.name}`}
            </h3>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedSeries(null); setIsCreating(false); }}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <VodSeriesForm
            key={selectedSeries?.id || 'new'}
            editingSeries={isCreating ? null : selectedSeries}
            onSuccess={handleSeriesSuccess}
            onCancel={() => { setSelectedSeries(null); setIsCreating(false); }}
          />
        </div>
      )}
    </div>
  );
};
