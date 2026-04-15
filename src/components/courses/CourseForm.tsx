import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Course } from "@/hooks/useCourses";
import { Image, Film, Play, Eye, User, Layers } from "lucide-react";

interface CourseFormProps {
  course?: Course;
  onSubmit: (data: Omit<Course, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  onCancel: () => void;
}

export const CourseForm = ({ course, onSubmit, onCancel }: CourseFormProps) => {
  const [title, setTitle] = useState(course?.title || "");
  const [description, setDescription] = useState(course?.description || "");
  const [thumbnailUrl, setThumbnailUrl] = useState(course?.thumbnailUrl || "");
  const [bannerUrl, setBannerUrl] = useState(course?.bannerUrl || "");
  const [heroVideoUrl, setHeroVideoUrl] = useState(course?.heroVideoUrl || "");
  const [previewVideoUrl, setPreviewVideoUrl] = useState(course?.previewVideoUrl || "");
  const [instructorName, setInstructorName] = useState(course?.instructorName || "");
  const [level, setLevel] = useState(course?.level || "Iniciante");
  const [category, setCategory] = useState(course?.category || "Geral");
  const [isActive, setIsActive] = useState(course?.isActive ?? true);
  const [isFeatured, setIsFeatured] = useState(course?.isFeatured ?? false);
  const [priceCents, setPriceCents] = useState<number | null>(course?.priceCents ?? null);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const priceDisplay = priceCents !== null ? (priceCents / 100).toFixed(2) : "";

  useEffect(() => {
    if (course) {
      setTitle(course.title);
      setDescription(course.description || "");
      setThumbnailUrl(course.thumbnailUrl || "");
      setBannerUrl(course.bannerUrl || "");
      setHeroVideoUrl(course.heroVideoUrl || "");
      setPreviewVideoUrl(course.previewVideoUrl || "");
      setInstructorName(course.instructorName || "");
      setLevel(course.level || "Iniciante");
      setCategory(course.category);
      setIsActive(course.isActive);
      setIsFeatured(course.isFeatured);
      setPriceCents(course.priceCents ?? null);
    }
  }, [course]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        title,
        description: description || null,
        thumbnailUrl: thumbnailUrl || null,
        bannerUrl: bannerUrl || null,
        heroVideoUrl: heroVideoUrl || null,
        previewVideoUrl: previewVideoUrl || null,
        instructorName: instructorName || null,
        level,
        category,
        isActive,
        isFeatured,
        priceCents,
      });
      onCancel();
    } catch (error) {
      console.error("Erro ao salvar curso:", error);
    } finally {
      setLoading(false);
    }
  };

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
    if (match) return `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1&controls=0&loop=1&playlist=${match[1]}`;
    return url;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
      {/* Seção: Informações Básicas */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          Informações Básicas
        </h3>
        <div className="h-px bg-border" />
      </div>

      <div>
        <Label htmlFor="title">Nome do Curso *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Masterclass de Finanças Pessoais"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descreva o conteúdo e objetivos do curso..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="instructorName" className="flex items-center gap-1">
            <User className="w-3 h-3" /> Instrutor
          </Label>
          <Input
            id="instructorName"
            value={instructorName}
            onChange={(e) => setInstructorName(e.target.value)}
            placeholder="Nome do professor"
          />
        </div>
        <div>
          <Label htmlFor="category">Categoria</Label>
          <Input
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Ex: Finanças, Design..."
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="level">Nível</Label>
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Iniciante">Iniciante</SelectItem>
              <SelectItem value="Intermediário">Intermediário</SelectItem>
              <SelectItem value="Avançado">Avançado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end pb-1 gap-4">
          <div className="flex items-center gap-2">
            <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
            <Label htmlFor="isActive">Ativo</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="isFeatured" checked={isFeatured} onCheckedChange={setIsFeatured} />
            <Label htmlFor="isFeatured" className="text-amber-500 font-semibold">⭐ Destaque</Label>
          </div>
        </div>
      </div>

      {/* Preço */}
      <div>
        <Label htmlFor="price">Preço (R$)</Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          min="0"
          value={priceDisplay}
          onChange={(e) => {
            const val = e.target.value;
            setPriceCents(val ? Math.round(parseFloat(val) * 100) : null);
          }}
          placeholder="0,00 (vazio = gratuito)"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Deixe vazio para curso gratuito
        </p>
      </div>

      {/* Seção: Imagens */}
      <div className="space-y-1 pt-2">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Image className="w-4 h-4 text-primary" />
          Imagens
        </h3>
        <div className="h-px bg-border" />
      </div>

      <div>
        <Label htmlFor="thumbnailUrl">Thumbnail (Card Vertical)</Label>
        <Input
          id="thumbnailUrl"
          value={thumbnailUrl}
          onChange={(e) => setThumbnailUrl(e.target.value)}
          placeholder="https://... (proporção 2:3 recomendada)"
        />
        {thumbnailUrl && (
          <div className="mt-2 flex justify-center">
            <img
              src={thumbnailUrl}
              alt="Thumbnail preview"
              className="h-32 w-auto rounded-xl object-cover border border-border"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="bannerUrl">Banner Desktop (Horizontal)</Label>
        <Input
          id="bannerUrl"
          value={bannerUrl}
          onChange={(e) => setBannerUrl(e.target.value)}
          placeholder="https://... (proporção 16:9 recomendada)"
        />
        {bannerUrl && (
          <div className="mt-2">
            <img
              src={bannerUrl}
              alt="Banner preview"
              className="w-full h-24 rounded-xl object-cover border border-border"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          </div>
        )}
      </div>

      {/* Seção: Vídeos */}
      <div className="space-y-1 pt-2">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Film className="w-4 h-4 text-primary" />
          Vídeos
        </h3>
        <div className="h-px bg-border" />
      </div>

      <div>
        <Label htmlFor="heroVideoUrl" className="flex items-center gap-1">
          <Play className="w-3 h-3" /> Vídeo Hero (Autoplay Preview)
        </Label>
        <Input
          id="heroVideoUrl"
          value={heroVideoUrl}
          onChange={(e) => setHeroVideoUrl(e.target.value)}
          placeholder="URL do YouTube ou MP4/M3U8"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Exibido em autoplay no topo da página do curso (estilo CineBusiness)
        </p>
      </div>

      <div>
        <Label htmlFor="previewVideoUrl" className="flex items-center gap-1">
          <Eye className="w-3 h-3" /> Vídeo de Apresentação
        </Label>
        <Input
          id="previewVideoUrl"
          value={previewVideoUrl}
          onChange={(e) => setPreviewVideoUrl(e.target.value)}
          placeholder="URL do YouTube ou MP4/M3U8"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Vídeo completo de apresentação do curso (botão "Preview")
        </p>
        {previewVideoUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2 gap-1"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="w-3 h-3" />
            {showPreview ? "Ocultar Preview" : "Ver Preview"}
          </Button>
        )}
        {showPreview && previewVideoUrl && (
          <div className="mt-2 rounded-xl overflow-hidden border border-border aspect-video">
            <iframe
              src={getYouTubeEmbedUrl(previewVideoUrl) || previewVideoUrl}
              className="w-full h-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
        )}
      </div>

      {/* Ações */}
      <div className="flex gap-2 justify-end pt-3 border-t border-border">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading || !title}>
          {loading ? "Salvando..." : course ? "Atualizar" : "Criar Curso"}
        </Button>
      </div>
    </form>
  );
};
