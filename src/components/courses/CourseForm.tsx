import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Course } from "@/hooks/useCourses";

interface CourseFormProps {
  course?: Course;
  onSubmit: (data: Omit<Course, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  onCancel: () => void;
}

export const CourseForm = ({ course, onSubmit, onCancel }: CourseFormProps) => {
  const [title, setTitle] = useState(course?.title || "");
  const [description, setDescription] = useState(course?.description || "");
  const [thumbnailUrl, setThumbnailUrl] = useState(course?.thumbnailUrl || "");
  const [category, setCategory] = useState(course?.category || "Geral");
  const [isActive, setIsActive] = useState(course?.isActive ?? true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (course) {
      setTitle(course.title);
      setDescription(course.description || "");
      setThumbnailUrl(course.thumbnailUrl || "");
      setCategory(course.category);
      setIsActive(course.isActive);
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
        category,
        isActive,
      });
      onCancel();
    } catch (error) {
      console.error("Erro ao salvar curso:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Título *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nome do curso"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição do curso"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="thumbnailUrl">URL da Thumbnail</Label>
        <Input
          id="thumbnailUrl"
          value={thumbnailUrl}
          onChange={(e) => setThumbnailUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>

      <div>
        <Label htmlFor="category">Categoria</Label>
        <Input
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Ex: Programação, Design..."
        />
      </div>

      <div className="flex items-center gap-2">
        <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
        <Label htmlFor="isActive">Curso ativo</Label>
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading || !title}>
          {loading ? "Salvando..." : course ? "Atualizar" : "Criar"}
        </Button>
      </div>
    </form>
  );
};
