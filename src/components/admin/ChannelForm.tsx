import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Pencil } from "lucide-react";
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

  const isEditing = !!editingChannel;

  useEffect(() => {
    if (editingChannel) {
      setName(editingChannel.name);
      // Normaliza categoria legada "Esporte" para "Esportes"
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const validUrls = streamUrls.filter((url) => url.trim() !== "");
    
    // Permite canais apenas com embed_url (sem stream_urls obrigatórios)
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
            <Label htmlFor="embedUrl">URL do Embed (opcional - para atualização automática)</Label>
            <Input
              id="embedUrl"
              placeholder="https://exemplo.embedtv.best/canal"
              value={embedUrl}
              onChange={(e) => setEmbedUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Se preenchido, o sistema tentará extrair automaticamente o m3u8 atualizado desta URL.
            </p>
          </div>

          <div className="space-y-3">
            <Label>URLs de Stream</Label>
            {streamUrls.map((url, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground w-20">
                  Opção {index + 1}
                </span>
                <Input
                  placeholder="https://...m3u8"
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
