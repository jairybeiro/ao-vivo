import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type PremiumContent } from "@/hooks/usePremiumContent";
import { X, Plus } from "lucide-react";

interface PremiumContentFormProps {
  content?: PremiumContent | null;
  onSubmit: (data: Omit<PremiumContent, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
}

const CATEGORIES = ["Geral", "Filmes", "Séries", "Documentários", "Shows"];

const PremiumContentForm = ({ content, onSubmit, onCancel }: PremiumContentFormProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [embedUrl, setEmbedUrl] = useState("");
  const [streamUrls, setStreamUrls] = useState<string[]>([""]);
  const [category, setCategory] = useState("Geral");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (content) {
      setTitle(content.title);
      setDescription(content.description || "");
      setThumbnailUrl(content.thumbnailUrl || "");
      setEmbedUrl(content.embedUrl || "");
      setStreamUrls(content.streamUrls.length > 0 ? content.streamUrls : [""]);
      setCategory(content.category);
      setIsActive(content.isActive);
    }
  }, [content]);

  const handleAddStreamUrl = () => {
    setStreamUrls([...streamUrls, ""]);
  };

  const handleRemoveStreamUrl = (index: number) => {
    setStreamUrls(streamUrls.filter((_, i) => i !== index));
  };

  const handleStreamUrlChange = (index: number, value: string) => {
    const newUrls = [...streamUrls];
    newUrls[index] = value;
    setStreamUrls(newUrls);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      description: description || null,
      thumbnailUrl: thumbnailUrl || null,
      embedUrl: embedUrl || null,
      streamUrls: streamUrls.filter((url) => url.trim() !== ""),
      category,
      isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Título *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nome do conteúdo"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição do conteúdo"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="thumbnail">URL da Thumbnail</Label>
        <Input
          id="thumbnail"
          value={thumbnailUrl}
          onChange={(e) => setThumbnailUrl(e.target.value)}
          placeholder="https://exemplo.com/imagem.jpg"
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

      <div className="space-y-2">
        <Label htmlFor="embed">URL do Embed (iframe)</Label>
        <Input
          id="embed"
          value={embedUrl}
          onChange={(e) => setEmbedUrl(e.target.value)}
          placeholder="https://exemplo.com/embed/video"
        />
        <p className="text-xs text-muted-foreground">
          Se preenchido, terá prioridade sobre URLs m3u8
        </p>
      </div>

      <div className="space-y-2">
        <Label>URLs de Stream (m3u8)</Label>
        {streamUrls.map((url, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={url}
              onChange={(e) => handleStreamUrlChange(index, e.target.value)}
              placeholder="https://exemplo.com/stream.m3u8"
            />
            {streamUrls.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveStreamUrl(index)}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddStreamUrl}
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar URL
        </Button>
        <p className="text-xs text-muted-foreground">
          Opcional se URL de embed estiver preenchida
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
        <Label htmlFor="active">Conteúdo ativo</Label>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">
          {content ? "Atualizar" : "Criar"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
};

export default PremiumContentForm;
