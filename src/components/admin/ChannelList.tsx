import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, List, Tv } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { toProxyAssetUrl } from "@/lib/streamProxy";

interface Channel {
  id: string;
  name: string;
  category: string;
  logo: string | null;
  streamUrls: string[];
  isLive: boolean;
}

interface ChannelListProps {
  channels: Channel[];
  loading: boolean;
  onEdit: (channel: Channel) => void;
  onRefresh: () => void;
}

export const ChannelList = ({ channels, loading, onEdit, onRefresh }: ChannelListProps) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const allSelected = channels.length > 0 && selectedIds.size === channels.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < channels.length;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(channels.map((ch) => ch.id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const { error } = await supabase.from("channels").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir canal", { description: error.message });
    } else {
      toast.success("Canal excluído com sucesso!");
      setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
      onRefresh();
    }
    setDeletingId(null);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkDeleting(true);
    const ids = Array.from(selectedIds);
    const BATCH_SIZE = 50;
    let deletedCount = 0;
    let lastError: string | null = null;

    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const batch = ids.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from("channels").delete().in("id", batch);
      if (error) {
        lastError = error.message;
        break;
      }
      deletedCount += batch.length;
    }

    if (lastError) {
      toast.error("Erro ao excluir canais", { description: `${deletedCount} excluídos antes do erro: ${lastError}` });
    } else {
      toast.success(`${deletedCount} canal(is) excluído(s) com sucesso!`);
    }
    setSelectedIds(new Set());
    onRefresh();
    setBulkDeleting(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <List className="w-5 h-5" />
              Canais Cadastrados
            </CardTitle>
            <CardDescription>
              {channels.length} {channels.length === 1 ? "canal cadastrado" : "canais cadastrados"}
            </CardDescription>
          </div>
          {selectedIds.size > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={bulkDeleting}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir {selectedIds.size} selecionado(s)
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir Canais em Massa</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir {selectedIds.size} canal(is)? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleBulkDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {bulkDeleting ? "Excluindo..." : "Excluir Todos"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando canais...</div>
        ) : channels.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Nenhum canal cadastrado ainda.</div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelected}
                      ref={(el) => { if (el) (el as unknown as HTMLInputElement).indeterminate = someSelected; }}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>URLs</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {channels.map((channel) => {
                  const logoUrl = toProxyAssetUrl(channel.logo);
                  return (
                    <TableRow key={channel.id} className={selectedIds.has(channel.id) ? "bg-muted/50" : ""}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(channel.id)}
                          onCheckedChange={() => toggleOne(channel.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {logoUrl ? (
                            <img src={logoUrl} alt={channel.name} className="w-8 h-8 rounded object-contain bg-muted" />
                          ) : (
                            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                              <Tv className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                          <span className="font-medium">{channel.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{channel.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">
                          {channel.streamUrls.length} {channel.streamUrls.length === 1 ? "URL" : "URLs"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => onEdit(channel)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Canal</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o canal "{channel.name}"? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(channel.id)}
                                  disabled={deletingId === channel.id}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {deletingId === channel.id ? "Excluindo..." : "Excluir"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
