import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VodMovieFormProps {
  editingMovie?: {
    id: string;
    name: string;
    category: string;
    stream_url: string;
    cover_url: string | null;
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
  const [rating, setRating] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!editingMovie;

  useEffect(() => {
    if (editingMovie) {
      setName(editingMovie.name);
      setCategory(editingMovie.category);
      setStreamUrl(editingMovie.stream_url);
      setCoverUrl(editingMovie.cover_url || "");
      setRating(editingMovie.rating?.toString() || "");
    } else {
      resetForm();
    }
  }, [editingMovie]);

  const resetForm = () => {
    setName("");
    setCategory("Filmes");
    setStreamUrl("");
    setCoverUrl("");
    setRating("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !streamUrl.trim()) {
      toast.error("Preencha o nome e a URL do stream");
      return;
    }
    setIsSubmitting(true);

    const payload = {
      name: name.trim(),
      category: category.trim() || "Filmes",
      stream_url: streamUrl.trim(),
      cover_url: coverUrl.trim() || null,
      rating: rating ? parseFloat(rating) : null,
    };

    if (isEditing && editingMovie) {
      const { error } = await supabase
        .from("vod_movies")
        .update(payload)
        .eq("id", editingMovie.id);
      if (error) {
        toast.error("Erro ao atualizar filme", { description: error.message });
      } else {
        toast.success("Filme atualizado!");
        resetForm();
        onSuccess();
      }
    } else {
      const { error } = await supabase.from("vod_movies").insert({
        ...payload,
        xtream_id: -Math.floor(Math.random() * 900000 + 100000),
      });
      if (error) {
        toast.error("Erro ao adicionar filme", { description: error.message });
      } else {
        toast.success("Filme adicionado!");
        resetForm();
        onSuccess();
      }
    }
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        <Label>URL do Stream (mp4, m3u8, txt, ts)</Label>
        <Input placeholder="https://...mp4 ou .m3u8 ou .txt ou .ts" value={streamUrl} onChange={(e) => setStreamUrl(e.target.value)} required />
        <p className="text-xs text-muted-foreground">Formatos suportados: .mp4, .m3u8, .txt, .ts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>URL da Capa (opcional)</Label>
          <Input placeholder="https://..." value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Nota (opcional)</Label>
          <Input type="number" step="0.1" min="0" max="10" placeholder="7.5" value={rating} onChange={(e) => setRating(e.target.value)} />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          {isEditing ? "Atualizar Filme" : "Adicionar Filme"}
        </Button>
        {isEditing && onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        )}
      </div>
    </form>
  );
};
