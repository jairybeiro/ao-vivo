import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Video, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface BgVideo {
  id: string;
  youtube_url: string;
  label: string | null;
  is_active: boolean;
}

const HeroBgVideoManager = () => {
  const [videos, setVideos] = useState<BgVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUrl, setNewUrl] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchVideos = useCallback(async () => {
    const { data } = await supabase
      .from("hero_bg_videos")
      .select("*")
      .order("created_at", { ascending: false });
    setVideos((data as any[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  const extractVideoId = (url: string) => {
    if (url.includes("v=")) return url.split("v=")[1]?.split("&")[0];
    if (url.includes("youtu.be/")) return url.split("youtu.be/")[1]?.split("?")[0];
    return url.trim();
  };

  const handleAdd = async () => {
    if (!newUrl.trim()) return;
    setAdding(true);
    const { error } = await supabase
      .from("hero_bg_videos")
      .insert({ youtube_url: newUrl.trim(), label: newLabel.trim() || null });
    if (error) {
      toast.error("Erro ao adicionar vídeo");
    } else {
      toast.success("Vídeo adicionado!");
      setNewUrl("");
      setNewLabel("");
      fetchVideos();
    }
    setAdding(false);
  };

  const handleToggle = async (id: string, active: boolean) => {
    await supabase.from("hero_bg_videos").update({ is_active: active }).eq("id", id);
    setVideos(prev => prev.map(v => v.id === id ? { ...v, is_active: active } : v));
  };

  const handleDelete = async (id: string) => {
    await supabase.from("hero_bg_videos").delete().eq("id", id);
    setVideos(prev => prev.filter(v => v.id !== id));
    toast.success("Vídeo removido");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Video className="w-4 h-4" />
          Vídeos de Fundo do Hero (Efeito Glow)
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Estes vídeos rodam desfocados atrás do player central, criando um efeito de luz e movimento.
          São escolhidos aleatoriamente entre os ativos.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add form */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="URL do YouTube (ex: https://youtube.com/watch?v=...)"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="flex-1"
          />
          <Input
            placeholder="Rótulo (opcional)"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className="w-full sm:w-40"
          />
          <Button onClick={handleAdd} disabled={adding || !newUrl.trim()} size="sm">
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Adicionar
          </Button>
        </div>

        {/* List */}
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : videos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum vídeo de fundo cadastrado.</p>
        ) : (
          <div className="space-y-2">
            {videos.map((v) => {
              const vid = extractVideoId(v.youtube_url);
              return (
                <div key={v.id} className="flex items-center gap-3 p-2 rounded-md bg-muted/30">
                  {vid && (
                    <img
                      src={`https://img.youtube.com/vi/${vid}/mqdefault.jpg`}
                      alt=""
                      className="w-20 h-12 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{v.label || v.youtube_url}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{v.youtube_url}</p>
                  </div>
                  <Switch
                    checked={v.is_active}
                    onCheckedChange={(checked) => handleToggle(v.id, checked)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => handleDelete(v.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HeroBgVideoManager;
