import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const SyncChannelsButton = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [loading, setLoading] = useState(false);

  const handleSync = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-channels");

      if (error) throw error;

      if (data?.success) {
        toast.success(
          `Importação concluída: ${data.inserted} novos, ${data.skipped} já existiam (${data.total} encontrados)`
        );
        onSuccess?.();
      } else {
        toast.error(data?.error || "Nenhum canal encontrado");
      }
    } catch (err: any) {
      console.error("Sync error:", err);
      toast.error(err.message || "Erro ao importar canais");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleSync} disabled={loading}>
      <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
      {loading ? "Importando..." : "Importar do EmbedCanais"}
    </Button>
  );
};

export default SyncChannelsButton;
