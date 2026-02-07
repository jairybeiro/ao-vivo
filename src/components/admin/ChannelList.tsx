import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, List, Tv } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    
    const { error } = await supabase
      .from("channels")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Erro ao excluir canal", { description: error.message });
    } else {
      toast.success("Canal excluído com sucesso!");
      onRefresh();
    }
    
    setDeletingId(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <List className="w-5 h-5" />
          Canais Cadastrados
        </CardTitle>
        <CardDescription>
          {channels.length} {channels.length === 1 ? "canal cadastrado" : "canais cadastrados"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando canais...
          </div>
        ) : channels.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum canal cadastrado ainda.
          </div>
        ) : (
          <div className="rounded-md border">
            <ScrollArea className="max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Canal</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>URLs</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {channels.map((channel) => (
                    <TableRow key={channel.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {channel.logo ? (
                            <img 
                              src={channel.logo} 
                              alt={channel.name}
                              className="w-8 h-8 rounded object-contain bg-muted"
                            />
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
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(channel)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Canal</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o canal "{channel.name}"? 
                                  Esta ação não pode ser desfeita.
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
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
