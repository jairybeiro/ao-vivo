import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tv, LogOut, ArrowLeft, Plus } from "lucide-react";
import { ChannelForm } from "@/components/admin/ChannelForm";
import { ChannelList } from "@/components/admin/ChannelList";
interface Channel {
  id: string;
  name: string;
  category: string;
  logo: string | null;
  streamUrls: string[];
  isLive: boolean;
}

const Admin = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchChannels = useCallback(async () => {
    setChannelsLoading(true);
    const { data, error } = await supabase
      .from("channels")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching channels:", error);
      setChannels([]);
    } else {
      setChannels(
        (data || []).map((ch) => ({
          id: ch.id,
          name: ch.name,
          category: ch.category,
          logo: ch.logo,
          streamUrls: ch.stream_urls,
          isLive: ch.is_live ?? true,
        }))
      );
    }
    setChannelsLoading(false);
  }, []);

  useEffect(() => {
    if (user && isAdmin) {
      fetchChannels();
    }
  }, [user, isAdmin, fetchChannels]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    navigate("/admin/login");
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Acesso Negado</CardTitle>
            <CardDescription>
              Você não tem permissão de administrador.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para o início
            </Button>
            <Button variant="ghost" className="w-full" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleFormSuccess = () => {
    setEditingChannel(null);
    setIsModalOpen(false);
    fetchChannels();
  };

  const handleEdit = (channel: Channel) => {
    setEditingChannel(channel);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingChannel(null);
    setIsModalOpen(false);
  };

  const handleOpenAddModal = () => {
    setEditingChannel(null);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Tv className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
                <p className="text-xs text-muted-foreground">Gerenciar canais</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => navigate("/")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button variant="outline" onClick={signOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-end">
            <Button onClick={handleOpenAddModal}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Canal
            </Button>
          </div>
          
          <ChannelList
            channels={channels}
            loading={channelsLoading}
            onEdit={handleEdit}
            onRefresh={fetchChannels}
          />
        </div>
      </main>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingChannel ? "Editar Canal" : "Adicionar Canal"}
            </DialogTitle>
            <DialogDescription>
              {editingChannel 
                ? "Atualize as informações do canal" 
                : "Preencha as informações do novo canal"}
            </DialogDescription>
          </DialogHeader>
          <ChannelForm
            editingChannel={editingChannel}
            onSuccess={handleFormSuccess}
            onCancel={handleCloseModal}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
