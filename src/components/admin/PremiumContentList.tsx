import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { usePremiumContentAdmin, type PremiumContent } from "@/hooks/usePremiumContent";
import PremiumContentForm from "./PremiumContentForm";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Film } from "lucide-react";

const PremiumContentList = () => {
  const { content, loading, createContent, updateContent, deleteContent } = usePremiumContentAdmin();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<PremiumContent | null>(null);

  const handleCreate = async (data: Omit<PremiumContent, "id" | "createdAt" | "updatedAt">) => {
    try {
      await createContent(data);
      toast.success("Conteúdo criado com sucesso!");
      setIsDialogOpen(false);
    } catch {
      toast.error("Erro ao criar conteúdo");
    }
  };

  const handleUpdate = async (data: Omit<PremiumContent, "id" | "createdAt" | "updatedAt">) => {
    if (!editingContent) return;
    try {
      await updateContent(editingContent.id, data);
      toast.success("Conteúdo atualizado com sucesso!");
      setEditingContent(null);
      setIsDialogOpen(false);
    } catch {
      toast.error("Erro ao atualizar conteúdo");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este conteúdo?")) return;
    try {
      await deleteContent(id);
      toast.success("Conteúdo excluído com sucesso!");
    } catch {
      toast.error("Erro ao excluir conteúdo");
    }
  };

  const openEditDialog = (item: PremiumContent) => {
    setEditingContent(item);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setEditingContent(null);
    setIsDialogOpen(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Film className="w-5 h-5" />
          Conteúdo Premium
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => setEditingContent(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingContent ? "Editar Conteúdo" : "Novo Conteúdo"}
              </DialogTitle>
            </DialogHeader>
            <PremiumContentForm
              content={editingContent}
              onSubmit={editingContent ? handleUpdate : handleCreate}
              onCancel={closeDialog}
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando...
          </div>
        ) : content.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum conteúdo cadastrado
          </div>
        ) : (
          <div className="space-y-3">
            {content.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="w-16 h-10 object-cover rounded"
                    />
                  ) : (
                    <div className="w-16 h-10 bg-primary/10 rounded flex items-center justify-center">
                      <Film className="w-5 h-5 text-primary/50" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="font-medium truncate">{item.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {item.category}
                      </Badge>
                      {!item.isActive && (
                        <Badge variant="outline" className="text-xs">
                          Inativo
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(item)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PremiumContentList;
