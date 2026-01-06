import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CATEGORIES = ["Notícias", "Esporte", "Filmes", "Séries"];

interface ChannelFormProps {
  editingChannel?: {
    id: string;
    name: string;
    category: string;
    logo: string | null;
    streamUrls: string[];
  } | null;
  onSuccess: () => void;
  onCancel?: () => void;
}

export const ChannelForm = ({ editingChannel, onSuccess, onCancel }: ChannelFormProps) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Notícias");
  const [logo, setLogo] = useState("");
  const [streamUrls, setStreamUrls] = useState(["", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!editingChannel;

  useEffect(() => {
    if (editingChannel) {
      setName(editingChannel.name);
      setCategory(editingChannel.category);
      setLogo(editingChannel.logo || "");
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
    
    if (validUrls.length === 0) {
      toast.error("Adicione pelo menos uma URL de stream");
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
          stream_urls: validUrls,
        })
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
        stream_urls: validUrls,
      });

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
