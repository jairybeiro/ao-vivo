import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CourseLesson } from "@/hooks/useCourses";

interface LessonFormProps {
  lesson?: CourseLesson;
  moduleId: string;
  orderIndex: number;
  onSubmit: (data: Omit<CourseLesson, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  onCancel: () => void;
}

export const LessonForm = ({ lesson, moduleId, orderIndex, onSubmit, onCancel }: LessonFormProps) => {
  const [title, setTitle] = useState(lesson?.title || "");
  const [description, setDescription] = useState(lesson?.description || "");
  const [streamUrlsText, setStreamUrlsText] = useState(lesson?.streamUrls.join("\n") || "");
  const [embedUrl, setEmbedUrl] = useState(lesson?.embedUrl || "");
  const [durationMinutes, setDurationMinutes] = useState(lesson?.durationMinutes?.toString() || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lesson) {
      setTitle(lesson.title);
      setDescription(lesson.description || "");
      setStreamUrlsText(lesson.streamUrls.join("\n"));
      setEmbedUrl(lesson.embedUrl || "");
      setDurationMinutes(lesson.durationMinutes?.toString() || "");
    }
  }, [lesson]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const streamUrls = streamUrlsText
        .split("\n")
        .map((url) => url.trim())
        .filter((url) => url.length > 0);

      await onSubmit({
        moduleId,
        title,
        description: description || null,
        streamUrls,
        embedUrl: embedUrl || null,
        durationMinutes: durationMinutes ? parseInt(durationMinutes) : null,
        orderIndex: lesson?.orderIndex ?? orderIndex,
      });
      onCancel();
    } catch (error) {
      console.error("Erro ao salvar aula:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Título da Aula *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Aula 1 - Primeiros passos"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição da aula"
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="embedUrl">URL do Embed (prioritário)</Label>
        <Input
          id="embedUrl"
          value={embedUrl}
          onChange={(e) => setEmbedUrl(e.target.value)}
          placeholder="https://player.exemplo.com/embed/..."
        />
      </div>

      <div>
        <Label htmlFor="streamUrls">URLs M3U8 (uma por linha)</Label>
        <Textarea
          id="streamUrls"
          value={streamUrlsText}
          onChange={(e) => setStreamUrlsText(e.target.value)}
          placeholder="https://exemplo.com/video.m3u8"
          rows={2}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Usado se não houver URL de embed
        </p>
      </div>

      <div>
        <Label htmlFor="duration">Duração (minutos)</Label>
        <Input
          id="duration"
          type="number"
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(e.target.value)}
          placeholder="Ex: 15"
          min="1"
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading || !title}>
          {loading ? "Salvando..." : lesson ? "Atualizar" : "Criar"}
        </Button>
      </div>
    </form>
  );
};
