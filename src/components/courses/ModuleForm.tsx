import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CourseModule } from "@/hooks/useCourses";

interface ModuleFormProps {
  module?: CourseModule;
  courseId: string;
  orderIndex: number;
  onSubmit: (data: Omit<CourseModule, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  onCancel: () => void;
}

export const ModuleForm = ({ module, courseId, orderIndex, onSubmit, onCancel }: ModuleFormProps) => {
  const [title, setTitle] = useState(module?.title || "");
  const [description, setDescription] = useState(module?.description || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (module) {
      setTitle(module.title);
      setDescription(module.description || "");
    }
  }, [module]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        courseId,
        title,
        description: description || null,
        orderIndex: module?.orderIndex ?? orderIndex,
      });
      onCancel();
    } catch (error) {
      console.error("Erro ao salvar módulo:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Título do Módulo *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Módulo 1 - Introdução"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição do módulo"
          rows={2}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading || !title}>
          {loading ? "Salvando..." : module ? "Atualizar" : "Criar"}
        </Button>
      </div>
    </form>
  );
};
