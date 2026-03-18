import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VodEpisodeFormProps {
  seriesId: string;
  editingEpisode?: {
    id: string;
    title: string;
    season: number;
    episode_num: number;
    stream_url: string;
    cover_url: string | null;
    duration_secs: number | null;
  } | null;
  onSuccess: () => void;
  onCancel?: () => void;
}

export const VodEpisodeForm = ({ seriesId, editingEpisode, onSuccess, onCancel }: VodEpisodeFormProps) => {
  const [title, setTitle] = useState("");
  const [season, setSeason] = useState("1");
  const [episodeNum, setEpisodeNum] = useState("1");
  const [streamUrl, setStreamUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [durationSecs, setDurationSecs] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!editingEpisode;

  useEffect(() => {
    if (editingEpisode) {
      setTitle(editingEpisode.title);
      setSeason(editingEpisode.season.toString());
      setEpisodeNum(editingEpisode.episode_num.toString());
      setStreamUrl(editingEpisode.stream_url);
      setCoverUrl(editingEpisode.cover_url || "");
      setDurationSecs(editingEpisode.duration_secs?.toString() || "");
    } else {
      setTitle(""); setSeason("1"); setEpisodeNum("1"); setStreamUrl(""); setCoverUrl(""); setDurationSecs("");
    }
  }, [editingEpisode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !streamUrl.trim()) {
      toast.error("Preencha o título e a URL do stream");
      return;
    }
    setIsSubmitting(true);

    const payload = {
      series_id: seriesId,
      title: title.trim(),
      season: parseInt(season) || 1,
      episode_num: parseInt(episodeNum) || 1,
      stream_url: streamUrl.trim(),
      cover_url: coverUrl.trim() || null,
      duration_secs: durationSecs ? parseInt(durationSecs) : null,
    };

    if (isEditing && editingEpisode) {
      const { error } = await supabase.from("vod_episodes").update(payload).eq("id", editingEpisode.id);
      if (error) toast.error("Erro ao atualizar episódio", { description: error.message });
      else { toast.success("Episódio atualizado!"); onSuccess(); }
    } else {
      const { error } = await supabase.from("vod_episodes").insert({
        ...payload,
        xtream_id: -Math.floor(Math.random() * 900000 + 100000),
      });
      if (error) toast.error("Erro ao adicionar episódio", { description: error.message });
      else { toast.success("Episódio adicionado!"); onSuccess(); }
    }
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Título do Episódio</Label>
        <Input placeholder="Ex: Pilot" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Temporada</Label>
          <Input type="number" min="1" value={season} onChange={(e) => setSeason(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Episódio Nº</Label>
          <Input type="number" min="1" value={episodeNum} onChange={(e) => setEpisodeNum(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Duração (seg)</Label>
          <Input type="number" min="0" placeholder="3600" value={durationSecs} onChange={(e) => setDurationSecs(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>URL do Stream (mp4, m3u8, txt, ts)</Label>
        <Input placeholder="https://...mp4" value={streamUrl} onChange={(e) => setStreamUrl(e.target.value)} required />
        <p className="text-xs text-muted-foreground">Formatos suportados: .mp4, .m3u8, .txt, .ts</p>
      </div>
      <div className="space-y-2">
        <Label>URL da Capa (opcional)</Label>
        <Input placeholder="https://..." value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isEditing ? "Atualizar Episódio" : "Adicionar Episódio"}
        </Button>
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>}
      </div>
    </form>
  );
};
