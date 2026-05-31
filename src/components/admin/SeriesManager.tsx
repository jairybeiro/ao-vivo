import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Pencil, Trash2, Tv2, Loader2, Search, Link2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface SeriesRow {
  id: string;
  name: string;
  category: string;
  cover_url: string | null;
  backdrop_url: string | null;
  trailer_url: string | null;
  trailer_mp4_url: string | null;
  plot: string | null;
  rating: number | null;
  is_active: boolean | null;
}

interface EpisodeRow {
  id: string;
  season: number;
  episode_num: number;
  title: string;
  stream_url: string;
}

export const SeriesManager = ({ onChanged, embedded = false }: { onChanged?: () => void; embedded?: boolean }) => {
  const [series, setSeries] = useState<SeriesRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<SeriesRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [episodes, setEpisodes] = useState<EpisodeRow[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [savingEpisodeId, setSavingEpisodeId] = useState<string | null>(null);
  const [episodeSearch, setEpisodeSearch] = useState("");

  useEffect(() => {
    if (!editing) {
      setEpisodes([]);
      setEpisodeSearch("");
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingEpisodes(true);
      const { data, error } = await supabase
        .from("vod_episodes")
        .select("id,season,episode_num,title,stream_url")
        .eq("series_id", editing.id)
        .order("season", { ascending: true })
        .order("episode_num", { ascending: true })
        .limit(2000);
      if (cancelled) return;
      if (error) {
        toast({ title: "Erro ao carregar episódios", description: error.message, variant: "destructive" });
      } else {
        setEpisodes((data ?? []) as EpisodeRow[]);
      }
      setLoadingEpisodes(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [editing]);

  const updateEpisodeField = (id: string, field: keyof EpisodeRow, value: string) => {
    setEpisodes((prev) => prev.map((ep) => (ep.id === id ? { ...ep, [field]: value } : ep)));
  };

  const saveEpisode = async (ep: EpisodeRow) => {
    setSavingEpisodeId(ep.id);
    const { error } = await supabase
      .from("vod_episodes")
      .update({ stream_url: ep.stream_url, title: ep.title })
      .eq("id", ep.id);
    setSavingEpisodeId(null);
    if (error) {
      toast({ title: "Erro ao salvar episódio", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Episódio atualizado", description: `T${ep.season} E${ep.episode_num}` });
  };

  const fetchSeries = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("vod_series")
      .select("id,name,category,cover_url,backdrop_url,trailer_url,trailer_mp4_url,plot,rating,is_active")
      .order("name", { ascending: true })
      .limit(1000);
    if (error) {
      toast({ title: "Erro ao carregar séries", description: error.message, variant: "destructive" });
    } else {
      setSeries((data ?? []) as SeriesRow[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSeries();
  }, [fetchSeries]);

  const filtered = series.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.category ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    const { error } = await supabase
      .from("vod_series")
      .update({
        name: editing.name,
        category: editing.category,
        cover_url: editing.cover_url,
        backdrop_url: editing.backdrop_url,
        trailer_url: editing.trailer_url,
        trailer_mp4_url: editing.trailer_mp4_url,
        plot: editing.plot,
        rating: editing.rating,
        is_active: editing.is_active,
      })
      .eq("id", editing.id);
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Série atualizada" });
    setEditing(null);
    await fetchSeries();
    onChanged?.();
  };

  const handleDelete = async (id: string, name: string) => {
    setDeletingId(id);
    // Episódios são removidos em cascata via FK
    const { error } = await supabase.from("vod_series").delete().eq("id", id);
    setDeletingId(null);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Série excluída", description: `"${name}" e seus episódios foram removidos.` });
    await fetchSeries();
    onChanged?.();
  };

  const body = (
    <div className="space-y-4">
      <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou categoria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-8">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">Nenhuma série encontrada</div>
        ) : (
          <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Capa</th>
                  <th className="text-left py-2 px-2">Título</th>
                  <th className="text-left py-2 px-2">Categoria</th>
                  <th className="text-left py-2 px-2">Nota</th>
                  <th className="text-left py-2 px-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b hover:bg-muted/40">
                    <td className="py-2 px-2">
                      {s.cover_url ? (
                        <img
                          src={s.cover_url}
                          alt={s.name}
                          className="w-10 h-14 object-cover rounded"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-10 h-14 rounded bg-muted" />
                      )}
                    </td>
                    <td className="py-2 px-2 font-medium max-w-[260px] truncate">{s.name}</td>
                    <td className="py-2 px-2 text-muted-foreground">{s.category}</td>
                    <td className="py-2 px-2">{s.rating ? s.rating.toFixed(1) : "-"}</td>
                    <td className="py-2 px-2">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setEditing(s)}>
                          <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive" disabled={deletingId === s.id}>
                              {deletingId === s.id ? (
                                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5 mr-1" />
                              )}
                              Excluir
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir "{s.name}"?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Todas as temporadas e episódios desta série serão removidos.
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(s.id, s.name)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Sim, excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );

  const dialog = (
    <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Série</DialogTitle>
            <DialogDescription>Atualize os metadados desta série.</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Categoria</Label>
                  <Input
                    value={editing.category}
                    onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Nota (0-10)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={editing.rating ?? ""}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        rating: e.target.value === "" ? null : parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <Label>Capa (cover_url)</Label>
                <Input
                  value={editing.cover_url ?? ""}
                  onChange={(e) => setEditing({ ...editing, cover_url: e.target.value || null })}
                />
              </div>
              <div>
                <Label>Backdrop (backdrop_url)</Label>
                <Input
                  value={editing.backdrop_url ?? ""}
                  onChange={(e) => setEditing({ ...editing, backdrop_url: e.target.value || null })}
                />
              </div>
              <div>
                <Label>Trailer (YouTube/embed)</Label>
                <Input
                  value={editing.trailer_url ?? ""}
                  onChange={(e) => setEditing({ ...editing, trailer_url: e.target.value || null })}
                />
              </div>
              <div>
                <Label>Trailer MP4/HLS (alta definição)</Label>
                <Input
                  value={editing.trailer_mp4_url ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, trailer_mp4_url: e.target.value || null })
                  }
                />
              </div>
              <div>
                <Label>Sinopse</Label>
                <Textarea
                  rows={4}
                  value={editing.plot ?? ""}
                  onChange={(e) => setEditing({ ...editing, plot: e.target.value || null })}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="series-active"
                  type="checkbox"
                  checked={editing.is_active ?? true}
                  onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                />
                <Label htmlFor="series-active" className="cursor-pointer">
                  Série ativa (visível no catálogo)
                </Label>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="flex items-center gap-2 text-base">
                    <Link2 className="w-4 h-4" /> Episódios e links de stream
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {episodes.length} episódio(s)
                  </span>
                </div>
                <Input
                  placeholder="Filtrar por título, temporada (T1) ou episódio (E2)..."
                  value={episodeSearch}
                  onChange={(e) => setEpisodeSearch(e.target.value)}
                  className="mb-3"
                />
                {loadingEpisodes ? (
                  <div className="text-center text-muted-foreground py-6 text-sm">
                    Carregando episódios...
                  </div>
                ) : episodes.length === 0 ? (
                  <div className="text-center text-muted-foreground py-6 text-sm">
                    Nenhum episódio cadastrado
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {episodes
                      .filter((ep) => {
                        if (!episodeSearch.trim()) return true;
                        const q = episodeSearch.toLowerCase();
                        return (
                          ep.title.toLowerCase().includes(q) ||
                          `t${ep.season}`.includes(q) ||
                          `e${ep.episode_num}`.includes(q) ||
                          `t${ep.season} e${ep.episode_num}`.includes(q)
                        );
                      })
                      .map((ep) => (
                        <div
                          key={ep.id}
                          className="rounded-md border bg-muted/30 p-3 space-y-2"
                        >
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">
                              T{ep.season} · E{ep.episode_num}
                            </span>
                            <Input
                              value={ep.title}
                              onChange={(e) => updateEpisodeField(ep.id, "title", e.target.value)}
                              className="h-7 text-xs"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Input
                              value={ep.stream_url}
                              onChange={(e) =>
                                updateEpisodeField(ep.id, "stream_url", e.target.value)
                              }
                              placeholder="https://.../episodio.m3u8"
                              className="font-mono text-xs"
                            />
                            <Button
                              size="sm"
                              onClick={() => saveEpisode(ep)}
                              disabled={savingEpisodeId === ep.id}
                            >
                              {savingEpisodeId === ep.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                "Salvar"
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
  );

  if (embedded) {
    return (
      <>
        {body}
        {dialog}
      </>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tv2 className="w-5 h-5" /> Gerenciar Séries
        </CardTitle>
        <CardDescription>
          Edite ou exclua séries individualmente. Excluir remove todas as temporadas e episódios.
        </CardDescription>
      </CardHeader>
      <CardContent>{body}</CardContent>
      {dialog}
    </Card>
  );
};