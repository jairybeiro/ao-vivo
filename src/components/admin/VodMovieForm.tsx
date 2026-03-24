import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VodMovieFormProps {
  editingMovie?: {
    id: string;
    name: string;
    category: string;
    stream_url: string;
    cover_url: string | null;
    backdrop_url: string | null;
    trailer_url: string | null;
    rating: number | null;
  } | null;
  onSuccess: () => void;
  onCancel?: () => void;
}

export const VodMovieForm = ({ editingMovie, onSuccess, onCancel }: VodMovieFormProps) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Filmes");
  const [streamUrl, setStreamUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [backdropUrl, setBackdropUrl] = useState("");
  const [trailerUrl, setTrailerUrl] = useState("");
  const [rating, setRating] = useState("");
  const [tmdbId, setTmdbId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingTmdb, setIsFetchingTmdb] = useState(false);

  const isEditing = !!editingMovie;

  useEffect(() => {
    if (editingMovie) {
      setName(editingMovie.name);
      setCategory(editingMovie.category);
      setStreamUrl(editingMovie.stream_url);
      setCoverUrl(editingMovie.cover_url || "");
      setBackdropUrl(editingMovie.backdrop_url || "");
      setTrailerUrl(editingMovie.trailer_url || "");
      setRating(editingMovie.rating?.toString() || "");
      setTmdbId("");
    } else {
      resetForm();
    }
  }, [editingMovie]);

  const resetForm = () => {
    setName(""); setCategory("Filmes"); setStreamUrl(""); setCoverUrl(""); setBackdropUrl(""); setTrailerUrl(""); setRating(""); setTmdbId("");
  };

  const fetchTmdb = async () => {
    if (!tmdbId.trim()) { toast.error("Informe o código TMDB"); return; }
    setIsFetchingTmdb(true);
    try {
      const { data, error } = await supabase.functions.invoke("tmdb-lookup", {
        body: { tmdb_id: tmdbId.trim(), type: "movie" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data.name) setName(data.name);
      if (data.cover_url) setCoverUrl(data.cover_url);
      if (data.backdrop_url) setBackdropUrl(data.backdrop_url);
      if (data.trailer_url) setTrailerUrl(data.trailer_url);
      if (data.rating) setRating(data.rating.toString());
      if (data.category) setCategory(data.category);
      toast.success("Dados do TMDB carregados!");
    } catch (err: any) {
      toast.error("Erro ao buscar TMDB", { description: err.message });
    }
    setIsFetchingTmdb(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !streamUrl.trim()) { toast.error("Preencha o nome e a URL do stream"); return; }
    setIsSubmitting(true);

    const payload = {
      name: name.trim(),
      category: category.trim() || "Filmes",
      stream_url: streamUrl.trim(),
      cover_url: coverUrl.trim() || null,
      backdrop_url: backdropUrl.trim() || null,
      trailer_url: trailerUrl.trim() || null,
      rating: rating ? parseFloat(rating) : null,
    };

    if (isEditing && editingMovie) {
      const { error } = await supabase.from("vod_movies").update(payload).eq("id", editingMovie.id);
      if (error) toast.error("Erro ao atualizar filme", { description: error.message });
      else { toast.success("Filme atualizado!"); resetForm(); onSuccess(); }
    } else {
      const { error } = await supabase.from("vod_movies").insert({
        ...payload,
        xtream_id: -Math.floor(Math.random() * 900000 + 100000),
      });
      if (error) toast.error("Erro ao adicionar filme", { description: error.message });
      else { toast.success("Filme adicionado!"); resetForm(); onSuccess(); }
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
            placeholder="Ex: 603 (Matrix)"
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
          <Label>Nome do Filme</Label>
          <Input placeholder="Ex: Matrix" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Input placeholder="Filmes" value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>URL do Stream (mp4, m3u8, txt, ts)</Label>
          {streamUrl && streamUrl !== "pending" && (
            <a
              href={streamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              🔗 Testar no navegador
            </a>
          )}
        </div>
        <Input placeholder="https://...mp4 ou .m3u8 ou .txt ou .ts" value={streamUrl} onChange={(e) => setStreamUrl(e.target.value)} required />
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
          <Input type="number" step="0.1" min="0" max="10" placeholder="7.5" value={rating} onChange={(e) => setRating(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>URL do Backdrop / Imagem de Fundo (opcional)</Label>
        <Input placeholder="https://..." value={backdropUrl} onChange={(e) => setBackdropUrl(e.target.value)} />
        {backdropUrl && (
          <img src={backdropUrl} alt="Backdrop" className="w-full h-24 object-cover rounded border border-border" />
        )}
      </div>

      <div className="space-y-2">
        <Label>URL do Trailer - YouTube (opcional)</Label>
        <Input placeholder="https://www.youtube.com/watch?v=..." value={trailerUrl} onChange={(e) => setTrailerUrl(e.target.value)} />
      </div>

      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isEditing ? "Atualizar Filme" : "Adicionar Filme"}
        </Button>
        {isEditing && onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>}
      </div>
    </form>
  );
};
