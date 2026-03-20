import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VodSeriesFormProps {
  editingSeries?: {
    id: string;
    name: string;
    category: string;
    cover_url: string | null;
    backdrop_url: string | null;
    plot: string | null;
    rating: number | null;
  } | null;
  onSuccess: () => void;
  onCancel?: () => void;
}

export const VodSeriesForm = ({ editingSeries, onSuccess, onCancel }: VodSeriesFormProps) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Séries");
  const [coverUrl, setCoverUrl] = useState("");
  const [backdropUrl, setBackdropUrl] = useState("");
  const [plot, setPlot] = useState("");
  const [rating, setRating] = useState("");
  const [tmdbId, setTmdbId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingTmdb, setIsFetchingTmdb] = useState(false);

  const isEditing = !!editingSeries;

  useEffect(() => {
    if (editingSeries) {
      setName(editingSeries.name); setCategory(editingSeries.category);
      setCoverUrl(editingSeries.cover_url || ""); setBackdropUrl(editingSeries.backdrop_url || "");
      setPlot(editingSeries.plot || ""); setRating(editingSeries.rating?.toString() || ""); setTmdbId("");
    } else {
      setName(""); setCategory("Séries"); setCoverUrl(""); setBackdropUrl(""); setPlot(""); setRating(""); setTmdbId("");
    }
  }, [editingSeries]);

  const fetchTmdb = async () => {
    if (!tmdbId.trim()) { toast.error("Informe o código TMDB"); return; }
    setIsFetchingTmdb(true);
    try {
      const { data, error } = await supabase.functions.invoke("tmdb-lookup", {
        body: { tmdb_id: tmdbId.trim(), type: "series" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data.name) setName(data.name);
      if (data.cover_url) setCoverUrl(data.cover_url);
      if (data.backdrop_url) setBackdropUrl(data.backdrop_url);
      if (data.rating) setRating(data.rating.toString());
      if (data.category) setCategory(data.category);
      if (data.plot) setPlot(data.plot);
      toast.success("Dados do TMDB carregados!");
    } catch (err: any) {
      toast.error("Erro ao buscar TMDB", { description: err.message });
    }
    setIsFetchingTmdb(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Preencha o nome da série"); return; }
    setIsSubmitting(true);

    const payload = {
      name: name.trim(),
      category: category.trim() || "Séries",
      cover_url: coverUrl.trim() || null,
      plot: plot.trim() || null,
      rating: rating ? parseFloat(rating) : null,
    };

    if (isEditing && editingSeries) {
      const { error } = await supabase.from("vod_series").update(payload).eq("id", editingSeries.id);
      if (error) toast.error("Erro ao atualizar série", { description: error.message });
      else { toast.success("Série atualizada!"); onSuccess(); }
    } else {
      const { error } = await supabase.from("vod_series").insert({
        ...payload,
        xtream_id: -Math.floor(Math.random() * 900000 + 100000),
      });
      if (error) toast.error("Erro ao adicionar série", { description: error.message });
      else { toast.success("Série adicionada!"); onSuccess(); }
    }
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* TMDB Lookup */}
      <div className="flex items-end gap-2 p-3 rounded-lg border border-dashed border-primary/30 bg-primary/5">
        <div className="flex-1 space-y-1">
          <Label className="text-xs font-medium text-primary">Código TMDB (opcional)</Label>
          <Input
            placeholder="Ex: 1622 (Supernatural)"
            value={tmdbId}
            onChange={(e) => setTmdbId(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <Button type="button" size="sm" variant="secondary" onClick={fetchTmdb} disabled={isFetchingTmdb}>
          {isFetchingTmdb ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          <span className="ml-1">Buscar</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nome da Série</Label>
          <Input placeholder="Ex: Breaking Bad" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Input placeholder="Séries" value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>URL da Capa (opcional)</Label>
          <Input placeholder="https://..." value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} />
          {coverUrl && (
            <img src={coverUrl} alt="Preview" className="w-16 h-24 object-cover rounded border border-border" />
          )}
        </div>
        <div className="space-y-2">
          <Label>Nota (opcional)</Label>
          <Input type="number" step="0.1" min="0" max="10" placeholder="8.5" value={rating} onChange={(e) => setRating(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Sinopse (opcional)</Label>
        <Textarea placeholder="Descrição da série..." value={plot} onChange={(e) => setPlot(e.target.value)} rows={3} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isEditing ? "Atualizar Série" : "Adicionar Série"}
        </Button>
        {isEditing && onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>}
      </div>
    </form>
  );
};
