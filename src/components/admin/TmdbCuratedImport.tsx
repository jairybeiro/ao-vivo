import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Film, Clapperboard, Search, Loader2, Plus, Star, Trash2, Pencil, Upload, Brain } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const CATEGORY_TAGS = [
  "Estratégia",
  "Mentalidade",
  "Liderança",
  "Empreendedorismo",
  "Superação",
  "Criatividade",
  "Negociação",
  "Motivação",
];

interface TmdbResult {
  name: string;
  cover_url: string | null;
  backdrop_url: string | null;
  rating: number | null;
  plot: string | null;
  category: string;
  trailer_url: string | null;
}

interface CuratedItem {
  id: string;
  name: string;
  type: "movie" | "series";
  category_tag: string | null;
  category: string;
  cover_url: string | null;
  backdrop_url: string | null;
  rating: number | null;
  trailer_url: string | null;
  stream_url?: string;
  plot?: string | null;
}

const TmdbCuratedImport = () => {
  const [tmdbId, setTmdbId] = useState("");
  const [type, setType] = useState<"movie" | "series">("movie");
  const [categoryTag, setCategoryTag] = useState("");
  const [streamUrl, setStreamUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<TmdbResult | null>(null);

  // Bulk import state
  const [bulkIds, setBulkIds] = useState("");
  const [bulkType, setBulkType] = useState<"movie" | "series">("movie");
  const [bulkTag, setBulkTag] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResults, setBulkResults] = useState<{ tmdb_id: number; name: string; status: string }[]>([]);

  // AI Insight state
  const [insightLoading, setInsightLoading] = useState<string | null>(null);
  const [insightModal, setInsightModal] = useState<{ item: CuratedItem; insight: string } | null>(null);

  const [curatedItems, setCuratedItems] = useState<CuratedItem[]>([]);
  const [curatedLoading, setCuratedLoading] = useState(false);

  // Edit state
  const [editItem, setEditItem] = useState<CuratedItem | null>(null);
  const [editForm, setEditForm] = useState({
    name: "", category: "", category_tag: "", stream_url: "",
    cover_url: "", backdrop_url: "", trailer_url: "", trailer_mp4_url: "", rating: "", plot: "",
  });
  const [editSaving, setEditSaving] = useState(false);

  const fetchCurated = async () => {
    setCuratedLoading(true);
    const { data: movies } = await supabase
      .from("vod_movies")
      .select("id, name, cover_url, backdrop_url, rating, trailer_url, category_tag, category, stream_url")
      .not("category_tag", "is", null)
      .order("name");

    const { data: series } = await supabase
      .from("vod_series")
      .select("id, name, cover_url, backdrop_url, rating, trailer_url, category_tag, category, plot")
      .not("category_tag", "is", null)
      .order("name");

    const items: CuratedItem[] = [
      ...(movies || []).map((m: any) => ({ ...m, type: "movie" as const })),
      ...(series || []).map((s: any) => ({ ...s, type: "series" as const })),
    ];
    setCuratedItems(items);
    setCuratedLoading(false);
  };

  useEffect(() => { fetchCurated(); }, []);

  const handleLookup = async () => {
    if (!tmdbId.trim()) return;
    setLoading(true);
    setPreview(null);
    try {
      const { data, error } = await supabase.functions.invoke("tmdb-lookup", {
        body: { tmdb_id: parseInt(tmdbId), type },
      });
      if (error) throw error;
      setPreview(data);
    } catch (e: any) {
      toast.error("Erro ao buscar TMDB: " + e.message);
    }
    setLoading(false);
  };

  const handleImport = async () => {
    if (!preview || !categoryTag) {
      toast.error("Selecione uma tag de curadoria");
      return;
    }

    setLoading(true);
    try {
      const table = type === "movie" ? "vod_movies" : "vod_series";
      const xtreamId = -Math.floor(Math.random() * 900000 + 100000);

      const record: any = {
        name: preview.name,
        category: preview.category || (type === "movie" ? "Filmes" : "Séries"),
        cover_url: preview.cover_url,
        backdrop_url: preview.backdrop_url,
        rating: preview.rating,
        trailer_url: preview.trailer_url,
        category_tag: categoryTag,
        xtream_id: xtreamId,
        tmdb_id: parseInt(tmdbId),
        is_active: true,
      };

      if (type === "movie") {
        record.stream_url = streamUrl || "pending";
      }
      if (type === "series") {
        record.plot = preview.plot;
      }

      const { error } = await supabase.from(table).insert(record);
      if (error) throw error;

      toast.success(`${preview.name} importado com tag "${categoryTag}"!`);
      setPreview(null);
      setTmdbId("");
      setStreamUrl("");
      setCategoryTag("");
      fetchCurated();
    } catch (e: any) {
      toast.error("Erro ao importar: " + e.message);
    }
    setLoading(false);
  };

  // Bulk import handler
  const handleBulkImport = async () => {
    if (!bulkTag) {
      toast.error("Selecione uma tag de curadoria");
      return;
    }
    const ids = bulkIds
      .split(/[\n,;\s]+/)
      .map(s => s.trim())
      .filter(s => s && !isNaN(Number(s)))
      .map(Number);

    if (ids.length === 0) {
      toast.error("Nenhum ID válido encontrado");
      return;
    }
    if (ids.length > 50) {
      toast.error("Máximo de 50 IDs por vez");
      return;
    }

    setBulkLoading(true);
    setBulkResults([]);
    try {
      const { data, error } = await supabase.functions.invoke("bulk-import-tmdb", {
        body: { tmdb_ids: ids, type: bulkType, category_tag: bulkTag },
      });
      if (error) throw error;
      setBulkResults(data.results || []);
      const imported = (data.results || []).filter((r: any) => r.status === "Importado").length;
      toast.success(`${imported} de ${ids.length} importados com sucesso!`);
      fetchCurated();
    } catch (e: any) {
      toast.error("Erro na importação em massa: " + e.message);
    }
    setBulkLoading(false);
  };

  // AI Insight handler
  const handleGenerateInsight = async (item: CuratedItem) => {
    setInsightLoading(item.id);
    try {
      const { data, error } = await supabase.functions.invoke("generate-insight", {
        body: {
          name: item.name,
          plot: item.plot || null,
          category_tag: item.category_tag,
          type: item.type,
        },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setInsightModal({ item, insight: data.insight });
    } catch (e: any) {
      toast.error("Erro ao gerar análise: " + e.message);
    }
    setInsightLoading(null);
  };

  const handleRemoveTag = async (item: CuratedItem) => {
    const table = item.type === "movie" ? "vod_movies" : "vod_series";
    const { error } = await supabase.from(table).update({ category_tag: null } as any).eq("id", item.id);
    if (error) {
      toast.error("Erro ao remover tag");
    } else {
      toast.success("Tag removida");
      fetchCurated();
    }
  };

  const openEdit = (item: CuratedItem) => {
    setEditItem(item);
    setEditForm({
      name: item.name,
      category: item.category || "",
      category_tag: item.category_tag || "",
      stream_url: item.stream_url || "",
      cover_url: item.cover_url || "",
      backdrop_url: item.backdrop_url || "",
      trailer_url: item.trailer_url || "",
      rating: item.rating?.toString() || "",
      plot: item.plot || "",
    });
  };

  const handleEditSave = async () => {
    if (!editItem) return;
    setEditSaving(true);
    const table = editItem.type === "movie" ? "vod_movies" : "vod_series";

    const payload: any = {
      name: editForm.name.trim(),
      category: editForm.category.trim() || (editItem.type === "movie" ? "Filmes" : "Séries"),
      category_tag: editForm.category_tag || null,
      cover_url: editForm.cover_url.trim() || null,
      backdrop_url: editForm.backdrop_url.trim() || null,
      trailer_url: editForm.trailer_url.trim() || null,
      rating: editForm.rating ? parseFloat(editForm.rating) : null,
    };

    if (editItem.type === "movie") {
      payload.stream_url = editForm.stream_url.trim() || "pending";
    }
    if (editItem.type === "series") {
      payload.plot = editForm.plot.trim() || null;
    }

    const { error } = await supabase.from(table).update(payload).eq("id", editItem.id);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("Atualizado com sucesso!");
      setEditItem(null);
      fetchCurated();
    }
    setEditSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Single Import Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Importar Conteúdo Curado via TMDB
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as "movie" | "series")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="movie"><span className="flex items-center gap-1"><Film className="w-3 h-3" /> Filme</span></SelectItem>
                  <SelectItem value="series"><span className="flex items-center gap-1"><Clapperboard className="w-3 h-3" /> Série</span></SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>TMDB ID</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: 550 (Fight Club)"
                  value={tmdbId}
                  onChange={(e) => setTmdbId(e.target.value)}
                />
                <Button variant="secondary" onClick={handleLookup} disabled={loading || !tmdbId.trim()}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tag de Curadoria</Label>
              <Select value={categoryTag} onValueChange={setCategoryTag}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_TAGS.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {type === "movie" && (
            <div className="space-y-2">
              <Label>URL do Stream (opcional, pode definir depois)</Label>
              <Input
                placeholder="https://..."
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
              />
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div className="border border-border rounded-lg p-4 flex gap-4">
              {preview.cover_url && (
                <img src={preview.cover_url} alt={preview.name} className="w-24 h-36 object-cover rounded" />
              )}
              <div className="flex-1 space-y-1">
                <h3 className="font-semibold text-foreground">{preview.name}</h3>
                {preview.rating && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    {preview.rating}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">{preview.category}</p>
                <p className="text-xs text-muted-foreground line-clamp-3">{preview.plot}</p>
                {preview.trailer_url && (
                  <a href={preview.trailer_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                    🎬 Ver Trailer
                  </a>
                )}
                <div className="pt-2">
                  <Button onClick={handleImport} disabled={loading || !categoryTag} size="sm">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
                    Importar com Tag
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Import */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Importação em Massa (Bulk)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Cole uma lista de IDs do TMDB (separados por vírgula, espaço ou linha). Todos serão importados com a mesma tag.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={bulkType} onValueChange={(v) => setBulkType(v as "movie" | "series")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="movie">Filme</SelectItem>
                  <SelectItem value="series">Série</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tag de Curadoria</Label>
              <Select value={bulkTag} onValueChange={setBulkTag}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {CATEGORY_TAGS.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>IDs do TMDB</Label>
            <Textarea
              placeholder={"550, 244786, 106646, 1402\nou um por linha:\n550\n244786\n106646"}
              value={bulkIds}
              onChange={(e) => setBulkIds(e.target.value)}
              rows={4}
            />
          </div>
          <Button onClick={handleBulkImport} disabled={bulkLoading || !bulkIds.trim() || !bulkTag}>
            {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
            Importar em Massa
          </Button>

          {/* Bulk Results */}
          {bulkResults.length > 0 && (
            <div className="border border-border rounded-lg p-3 space-y-1 max-h-60 overflow-y-auto">
              {bulkResults.map((r, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-border/50 last:border-0">
                  <span className="text-foreground font-medium">{r.name || `ID ${r.tmdb_id}`}</span>
                  <Badge
                    variant={r.status === "Importado" ? "default" : r.status === "Já existe" ? "secondary" : "destructive"}
                    className="text-[10px]"
                  >
                    {r.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Curated Items List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conteúdos Curados ({curatedItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {curatedLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : curatedItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum conteúdo curado. Importe via TMDB acima.</p>
          ) : (
            <div className="space-y-2">
              {curatedItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  {item.cover_url ? (
                    <img src={item.cover_url} alt={item.name} className="w-10 h-14 object-cover rounded" />
                  ) : (
                    <div className="w-10 h-14 bg-muted rounded flex items-center justify-center">
                      {item.type === "movie" ? <Film className="w-4 h-4" /> : <Clapperboard className="w-4 h-4" />}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-[10px]">
                        {item.type === "movie" ? "Filme" : "Série"}
                      </Badge>
                      <Badge className="text-[10px]">{item.category_tag}</Badge>
                      {item.type === "movie" && item.stream_url === "pending" && (
                        <Badge variant="outline" className="text-[10px] text-yellow-600 border-yellow-600">Sem link</Badge>
                      )}
                      {item.rating && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />{item.rating}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Gerar Análise Estratégica"
                      onClick={() => handleGenerateInsight(item)}
                      disabled={insightLoading === item.id}
                    >
                      {insightLoading === item.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      ) : (
                        <Brain className="w-4 h-4 text-primary" />
                      )}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveTag(item)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">💡 Sugestões de Conteúdo por Tag</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
            <div>
              <p className="font-semibold text-foreground mb-1">🎯 Estratégia</p>
              <ul className="space-y-0.5 list-disc list-inside">
                <li>A Grande Aposta (TMDB: 318846)</li>
                <li>O Jogo da Imitação (TMDB: 205596)</li>
                <li>Moneyball (TMDB: 60308)</li>
                <li>A Rede Social (TMDB: 37799)</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">🧠 Mentalidade</p>
              <ul className="space-y-0.5 list-disc list-inside">
                <li>À Procura da Felicidade (TMDB: 1402)</li>
                <li>Whiplash (TMDB: 244786)</li>
                <li>O Lobo de Wall Street (TMDB: 106646)</li>
                <li>Rocky (TMDB: 1366)</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">👑 Liderança</p>
              <ul className="space-y-0.5 list-disc list-inside">
                <li>O Discurso do Rei (TMDB: 45269)</li>
                <li>Invictus (TMDB: 22803)</li>
                <li>Lincoln (TMDB: 72976)</li>
                <li>Coach Carter (TMDB: 14534)</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">🚀 Empreendedorismo</p>
              <ul className="space-y-0.5 list-disc list-inside">
                <li>Steve Jobs (TMDB: 321697)</li>
                <li>Joy (TMDB: 274479)</li>
                <li>O Fundador (TMDB: 313542)</li>
                <li>Fome de Poder (TMDB: 313542)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar {editItem?.type === "movie" ? "Filme" : "Série"}</DialogTitle>
            <DialogDescription>Atualize os campos do conteúdo curado</DialogDescription>
          </DialogHeader>
          {editItem && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={editForm.name} onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Input value={editForm.category} onChange={(e) => setEditForm(f => ({ ...f, category: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Tag de Curadoria</Label>
                  <Select value={editForm.category_tag} onValueChange={(v) => setEditForm(f => ({ ...f, category_tag: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {CATEGORY_TAGS.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {editItem.type === "movie" && (
                <div className="space-y-2">
                  <Label>URL do Stream</Label>
                  <Input placeholder="https://..." value={editForm.stream_url} onChange={(e) => setEditForm(f => ({ ...f, stream_url: e.target.value }))} />
                </div>
              )}
              <div className="space-y-2">
                <Label>URL da Capa</Label>
                <Input value={editForm.cover_url} onChange={(e) => setEditForm(f => ({ ...f, cover_url: e.target.value }))} />
                {editForm.cover_url && <img src={editForm.cover_url} alt="Preview" className="w-16 h-24 object-cover rounded border border-border" />}
              </div>
              <div className="space-y-2">
                <Label>URL do Backdrop</Label>
                <Input value={editForm.backdrop_url} onChange={(e) => setEditForm(f => ({ ...f, backdrop_url: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>URL do Trailer (YouTube)</Label>
                <Input value={editForm.trailer_url} onChange={(e) => setEditForm(f => ({ ...f, trailer_url: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Nota</Label>
                <Input type="number" step="0.1" min="0" max="10" value={editForm.rating} onChange={(e) => setEditForm(f => ({ ...f, rating: e.target.value }))} />
              </div>
              {editItem.type === "series" && (
                <div className="space-y-2">
                  <Label>Sinopse</Label>
                  <Textarea value={editForm.plot} onChange={(e) => setEditForm(f => ({ ...f, plot: e.target.value }))} rows={3} />
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button className="flex-1" onClick={handleEditSave} disabled={editSaving}>
                  {editSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Salvar
                </Button>
                <Button variant="outline" onClick={() => setEditItem(null)}>Cancelar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AI Insight Modal */}
      <Dialog open={!!insightModal} onOpenChange={(open) => !open && setInsightModal(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Análise Estratégica: {insightModal?.item.name}
            </DialogTitle>
            <DialogDescription>
              Rascunho gerado por IA — revise e edite antes de publicar
            </DialogDescription>
          </DialogHeader>
          {insightModal && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge>{insightModal.item.category_tag}</Badge>
                <Badge variant="secondary">{insightModal.item.type === "movie" ? "Filme" : "Série"}</Badge>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {insightModal.insight}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    navigator.clipboard.writeText(insightModal.insight);
                    toast.success("Análise copiada!");
                  }}
                >
                  Copiar Texto
                </Button>
                <Button variant="outline" onClick={() => setInsightModal(null)}>Fechar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TmdbCuratedImport;
