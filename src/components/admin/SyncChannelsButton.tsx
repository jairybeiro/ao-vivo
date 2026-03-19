import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SyncChannelsButtonProps {
  onComplete: () => void;
}

export const SyncChannelsButton = ({ onComplete }: SyncChannelsButtonProps) => {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-channels");

      if (error) {
        toast.error("Erro ao sincronizar", { description: error.message });
        return;
      }

      if (data?.error) {
        toast.error("Erro ao sincronizar", { description: data.error });
        return;
      }

      toast.success(
        `Sincronização concluída! ${data.created} novos canais adicionados e ${data.updated} atualizados (${data.total} encontrados).`
      );
      onComplete();
    } catch (err) {
      toast.error("Erro inesperado ao sincronizar canais.");
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleSync} disabled={syncing}>
      {syncing ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <RefreshCw className="w-4 h-4 mr-2" />
      )}
      {syncing ? "Sincronizando..." : "Sincronizar (EmbedCanais)"}
    </Button>
  );
};
