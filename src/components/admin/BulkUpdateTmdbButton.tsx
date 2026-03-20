import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ImagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BulkUpdateTmdbButtonProps {
  type: "movies" | "series";
  onComplete?: () => void;
}

export const BulkUpdateTmdbButton = ({ type, onComplete }: BulkUpdateTmdbButtonProps) => {
  const [loading, setLoading] = useState(false);

  const handleBulk = async () => {
    setLoading(true);
    toast.info(`Buscando backdrops e trailers para ${type === "movies" ? "filmes" : "séries"}...`, { duration: 5000 });

    try {
      const { data, error } = await supabase.functions.invoke("bulk-update-tmdb", {
        body: { type },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(
        `Atualização concluída! ${data.updated} de ${data.total} ${type === "movies" ? "filmes" : "séries"} atualizados.`,
        { duration: 6000 }
      );
      onComplete?.();
    } catch (err: any) {
      toast.error("Erro na atualização em massa", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleBulk} disabled={loading}>
      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImagePlus className="w-4 h-4 mr-2" />}
      {loading ? "Atualizando..." : "Buscar Backdrops/Trailers"}
    </Button>
  );
};
