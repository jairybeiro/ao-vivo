/**
 * AdForm - Formulário para criar/editar anúncios
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Ad } from "@/hooks/useAds";

interface AdFormProps {
  editingAd?: Ad | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const AD_TYPES = [
  { value: "sidebar", label: "Lateral (Desktop)" },
  { value: "below_player", label: "Abaixo do Player (Mobile)" },
  { value: "preroll", label: "Pre-Roll (Antes do Vídeo)" },
];

export function AdForm({ editingAd, onSuccess, onCancel }: AdFormProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("sidebar");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ctaText, setCtaText] = useState("Saiba mais");
  const [ctaUrl, setCtaUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [duration, setDuration] = useState(5);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingAd) {
      setName(editingAd.name);
      setType(editingAd.type);
      setTitle(editingAd.title);
      setDescription(editingAd.description);
      setCtaText(editingAd.ctaText || "Saiba mais");
      setCtaUrl(editingAd.ctaUrl || "");
      setImageUrl(editingAd.imageUrl || "");
      setDuration(editingAd.duration);
      setIsActive(editingAd.isActive);
    } else {
      setName("");
      setType("sidebar");
      setTitle("");
      setDescription("");
      setCtaText("Saiba mais");
      setCtaUrl("");
      setImageUrl("");
      setDuration(5);
      setIsActive(true);
    }
  }, [editingAd]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const adData = {
      name,
      type,
      title,
      description,
      cta_text: ctaText,
      cta_url: ctaUrl || null,
      image_url: imageUrl || null,
      duration,
      is_active: isActive,
    };

    try {
      if (editingAd) {
        const { error } = await supabase
          .from("ads")
          .update(adData)
          .eq("id", editingAd.id);

        if (error) throw error;
        toast.success("Anúncio atualizado com sucesso!");
      } else {
        const { error } = await supabase.from("ads").insert(adData);

        if (error) throw error;
        toast.success("Anúncio criado com sucesso!");
      }
      onSuccess();
    } catch (error: any) {
      console.error("Erro ao salvar anúncio:", error);
      toast.error(error.message || "Erro ao salvar anúncio");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome interno</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Promo Janeiro 2025"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Tipo de anúncio</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              {AD_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título do anúncio"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Texto curto do anúncio"
          rows={2}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ctaText">Texto do botão</Label>
          <Input
            id="ctaText"
            value={ctaText}
            onChange={(e) => setCtaText(e.target.value)}
            placeholder="Saiba mais"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ctaUrl">URL de destino</Label>
          <Input
            id="ctaUrl"
            type="url"
            value={ctaUrl}
            onChange={(e) => setCtaUrl(e.target.value)}
            placeholder="https://exemplo.com"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="imageUrl">URL da imagem</Label>
        <Input
          id="imageUrl"
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://exemplo.com/imagem.jpg"
        />
      </div>

      {type === "preroll" && (
        <div className="space-y-2">
          <Label htmlFor="duration">Duração (segundos)</Label>
          <Input
            id="duration"
            type="number"
            min={3}
            max={15}
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value) || 5)}
          />
        </div>
      )}

      <div className="flex items-center justify-between py-2 px-3 bg-muted rounded-lg">
        <Label htmlFor="isActive" className="cursor-pointer">
          Anúncio ativo
        </Label>
        <Switch
          id="isActive"
          checked={isActive}
          onCheckedChange={setIsActive}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Salvando..." : editingAd ? "Atualizar" : "Criar"}
        </Button>
      </div>
    </form>
  );
}
