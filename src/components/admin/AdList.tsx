/**
 * AdList - Lista de anúncios no painel admin
 */

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Trash2, LayoutPanelLeft, Smartphone, Play } from "lucide-react";
import { toast } from "sonner";
import type { Ad } from "@/hooks/useAds";

interface AdListProps {
  ads: Ad[];
  loading: boolean;
  onEdit: (ad: Ad) => void;
  onRefresh: () => void;
}

const TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  sidebar: { label: "Lateral", icon: <LayoutPanelLeft className="w-3 h-3" /> },
  below_player: { label: "Abaixo do Player", icon: <Smartphone className="w-3 h-3" /> },
  preroll: { label: "Pre-Roll", icon: <Play className="w-3 h-3" /> },
};

export function AdList({ ads, loading, onEdit, onRefresh }: AdListProps) {
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o anúncio "${name}"?`)) {
      return;
    }

    const { error } = await supabase.from("ads").delete().eq("id", id);

    if (error) {
      console.error("Erro ao excluir anúncio:", error);
      toast.error("Erro ao excluir anúncio");
    } else {
      toast.success("Anúncio excluído com sucesso!");
      onRefresh();
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (ads.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Nenhum anúncio cadastrado.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {ads.map((ad) => {
        const typeInfo = TYPE_LABELS[ad.type] || { label: ad.type, icon: null };

        return (
          <Card key={ad.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-foreground truncate">
                      {ad.name}
                    </h3>
                    <Badge variant={ad.isActive ? "default" : "secondary"}>
                      {ad.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      {typeInfo.icon}
                      {typeInfo.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                    {ad.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {ad.description}
                  </p>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(ad)}
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(ad.id, ad.name)}
                    title="Excluir"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
