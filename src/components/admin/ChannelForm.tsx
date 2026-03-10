import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Zap, ZapOff, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CATEGORIES = ["Notícias", "Esportes", "Filmes", "Variedades", "Locais"];

interface ChannelFormProps {
  editingChannel?: {
    id: string;
    name: string;
    category: string;
    logo: string | null;
    streamUrls: string[];
    embedUrl?: string | null;
  } | null;
  onSuccess: () => void;
  onCancel?: () => void;
}

export const ChannelForm = ({ editingChannel, onSuccess, onCancel }: ChannelFormProps) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Notícias");
  const [logo, setLogo] = useState("");
  const [embedUrl, setEmbedUrl] = useState("");
  const [streamUrls, setStreamUrls] = useState(["", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  const isEditing = !!editingChannel;

  useEffect(() => {
    if (editingChannel) {
      setName(editingChannel.name);
      const normalizedCategory = editingChannel.category === "Esporte" 
        ? "Esportes" 
        : editingChannel.category;
      setCategory(CATEGORIES.includes(normalizedCategory) ? normalizedCategory : "Notícias");
      setLogo(editingChannel.logo || "");
      setEmbedUrl(editingChannel.embedUrl || "");
      const urls = [...editingChannel.streamUrls];
      while (urls.length < 3) urls.push("");
      setStreamUrls(urls.slice(0, 3));
    } else {
      resetForm();
    }
  }, [editingChannel]);

  const resetForm = () => {
    setName("");
    setCategory("Notícias");
    setLogo("");
    setEmbedUrl("");
    setStreamUrls(["", "", ""]);
  };

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...streamUrls];
    newUrls[index] = value;
    setStreamUrls(newUrls);
  };

  const handleExtractUrl = async () => {
    if (!embedUrl.trim()) {
      toast.error("Insira uma URL de embed primeiro");
      return;
    }

    setIsExtracting(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/resolve-stream`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ url: embedUrl }),
        }
      );

      const data = await response.json();

      if (data.success && data.streamUrl) {
        handleUrlChange(0, data.streamUrl);
        toast.success("URL extraída com sucesso!", {
          description: data.streamUrl.substring(0, 60) + "...",
        });
      } else {
        toast.error("Não foi possível extrair a URL", {
          description: data.error || "Nenhum stream encontrado na página",
        });
      }
    } catch (err) {
      toast.error("Erro ao extrair URL", {
        description: err instanceof Error ? err.message : "Erro de rede",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const validUrls = streamUrls.filter((url) => url.trim() !== "");
    
    if (validUrls.length === 0 && !embedUrl.trim()) {
      toast.error("Adicione pelo menos uma URL de stream ou uma URL de embed");
      setIsSubmitting(false);
      return;
    }

    if (isEditing && editingChannel) {
      const { error } = await supabase
        .from("channels")
        .update({
          name,
          category,
          logo: logo || null,
          embed_url: embedUrl || null,
          stream_urls: validUrls.length > 0 ? validUrls : ["placeholder"],
        } as any)
        .eq("id", editingChannel.id);

      if (error) {
        toast.error("Erro ao atualizar canal", { description: error.message });
      } else {
        toast.success("Canal atualizado com sucesso!");
        resetForm();
        onSuccess();
      }
    } else {
      const { error } = await supabase.from("channels").insert({
        name,
        category,
        logo: logo || null,
        embed_url: embedUrl || null,
        stream_urls: validUrls.length > 0 ? validUrls : ["placeholder"],
      } as any);

      if (error) {
        toast.error("Erro ao adicionar canal", { description: error.message });
      } else {
        toast.success("Canal adicionado com sucesso!");
        resetForm();
        onSuccess();
      }
    }

    setIsSubmitting(false);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Canal</Label>
            <Input
              id="name"
              placeholder="Ex: GloboNews"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="logo">URL do Logo (opcional)</Label>
          <Input
            id="logo"
            placeholder="https://..."
            value={logo}
            onChange={(e) => setLogo(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="embedUrl">URL do Embed (opcional)</Label>
          <div className="flex gap-2">
            <Input
              id="embedUrl"
              placeholder="https://www3.embedtv.best/hbo"
              value={embedUrl}
              onChange={(e) => setEmbedUrl(e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleExtractUrl}
              disabled={isExtracting || !embedUrl.trim()}
              className="shrink-0 gap-2"
            >
              {isExtracting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {isExtracting ? "Extraindo..." : "🪄 Extrair URL Real"}
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {embedUrl.trim() ? (
              <>
                <Zap className="w-3.5 h-3.5 text-green-500" />
                <span className="text-xs text-green-600 dark:text-green-400">
                  Clique em "Extrair URL Real" para preencher automaticamente o campo Opção 1
                </span>
              </>
            ) : (
              <>
                <ZapOff className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Sem extração automática — preencha as URLs de stream manualmente
                </span>
              </>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Label>URLs de Stream</Label>
          {streamUrls.map((url, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground w-20">
                Opção {index + 1}
              </span>
              <Input
                placeholder="https://...m3u8 ou .txt"
                value={url}
                onChange={(e) => handleUrlChange(index, e.target.value)}
              />
              {url && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleUrlChange(index, "")}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting 
              ? (isEditing ? "Atualizando..." : "Adicionando...") 
              : (isEditing ? "Atualizar Canal" : "Adicionar Canal")}
          </Button>
          {isEditing && onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};
