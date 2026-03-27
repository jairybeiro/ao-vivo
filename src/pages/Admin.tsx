import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAds, type Ad } from "@/hooks/useAds";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tv, LogOut, ArrowLeft, Plus, Megaphone, Film, Download, Clapperboard, Sparkles } from "lucide-react";
import VodImport from "@/components/admin/VodImport";
import SyncChannelsButton from "@/components/admin/SyncChannelsButton";

import { ChannelForm } from "@/components/admin/ChannelForm";
import { ChannelList } from "@/components/admin/ChannelList";
import { AdForm } from "@/components/admin/AdForm";
import { AdList } from "@/components/admin/AdList";
import PremiumContentList from "@/components/admin/PremiumContentList";
import { VodMovieList } from "@/components/admin/VodMovieList";
import { VodSeriesList } from "@/components/admin/VodSeriesList";
import { toProxyAssetUrl } from "@/lib/streamProxy";
import TmdbCuratedImport from "@/components/admin/TmdbCuratedImport";

interface Channel {
  id: string;
  name: string;
  category: string;
  logo: string | null;
  streamUrls: string[];
  embedUrl?: string | null;
  isLive: boolean;
}

const Admin = () => {
  const { user, isAdmin, loading, adminCheckLoading, signOut } = useAuth();
  const navigate = useNavigate();
  
  // Estados para canais
  const [activeTab, setActiveTab] = useState("channels");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  
  // Estados para anúncios
  const { ads, loading: adsLoading, refetch: refetchAds } = useAds();
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);

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
          logo: toProxyAssetUrl(ch.logo),
          streamUrls: ch.stream_urls,
          embedUrl: (ch as any).embed_url || null,
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

  if (loading || (user && adminCheckLoading)) {
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

  // Handlers para canais
  const handleChannelFormSuccess = () => {
    setEditingChannel(null);
    setIsChannelModalOpen(false);
    fetchChannels();
  };

  const handleEditChannel = (channel: Channel) => {
    setEditingChannel(channel);
    setIsChannelModalOpen(true);
  };

  const handleCloseChannelModal = () => {
    setEditingChannel(null);
    setIsChannelModalOpen(false);
  };

  const handleOpenAddChannelModal = () => {
    setEditingChannel(null);
    setIsChannelModalOpen(true);
  };

  // Handlers para anúncios
  const handleAdFormSuccess = () => {
    setEditingAd(null);
    setIsAdModalOpen(false);
    refetchAds();
  };

  const handleEditAd = (ad: Ad) => {
    setEditingAd(ad);
    setIsAdModalOpen(true);
  };

  const handleCloseAdModal = () => {
    setEditingAd(null);
    setIsAdModalOpen(false);
  };

  const handleOpenAddAdModal = () => {
    setEditingAd(null);
    setIsAdModalOpen(true);
  };

  return (
    <div className="h-screen overflow-y-auto bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Tv className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
                <p className="text-xs text-muted-foreground">Gerenciar canais e anúncios</p>
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

      <main className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="channels" className="space-y-6" onValueChange={(v) => setActiveTab(v)} value={activeTab}>
            <TabsList className="grid w-full grid-cols-4 md:grid-cols-8">
              <TabsTrigger value="channels" className="flex items-center gap-1 text-xs md:text-sm">
                <Tv className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Canais</span>
                <span className="md:hidden">Canais</span>
              </TabsTrigger>
              <TabsTrigger value="movies" className="flex items-center gap-1 text-xs md:text-sm">
                <Film className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Filmes</span>
                <span className="md:hidden">Filmes</span>
              </TabsTrigger>
              <TabsTrigger value="series" className="flex items-center gap-1 text-xs md:text-sm">
                <Clapperboard className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Séries</span>
                <span className="md:hidden">Séries</span>
              </TabsTrigger>
              <TabsTrigger value="import" className="flex items-center gap-1 text-xs md:text-sm">
                <Download className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Importar</span>
                <span className="md:hidden">Import</span>
              </TabsTrigger>
              <TabsTrigger value="ads" className="flex items-center gap-1 text-xs md:text-sm">
                <Megaphone className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Anúncios</span>
                <span className="md:hidden">Ads</span>
              </TabsTrigger>
              <TabsTrigger value="premium" className="flex items-center gap-1 text-xs md:text-sm">
                <Film className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Premium</span>
                <span className="md:hidden">VIP</span>
              </TabsTrigger>
              <TabsTrigger value="curated" className="flex items-center gap-1 text-xs md:text-sm">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Curadoria</span>
                <span className="md:hidden">Curar</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab de Canais */}
            <TabsContent value="channels" className="space-y-6">
              <div className="flex justify-end gap-2">
                <SyncChannelsButton onSuccess={fetchChannels} />
                <Button onClick={handleOpenAddChannelModal}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Canal
                </Button>
              </div>
              
              <ChannelList
                channels={channels}
                loading={channelsLoading}
                onEdit={handleEditChannel}
                onRefresh={fetchChannels}
              />
            </TabsContent>

            {/* Tab de Filmes */}
            <TabsContent value="movies" className="space-y-6">
              <VodMovieList />
            </TabsContent>

            {/* Tab de Séries */}
            <TabsContent value="series" className="space-y-6">
              <VodSeriesList />
            </TabsContent>

            {/* Tab de Importação Xtream - forceMount keeps worker alive across tab switches */}
            <TabsContent value="import" className="space-y-6 data-[state=inactive]:hidden" forceMount>
              <VodImport />
            </TabsContent>

            {/* Tab de Anúncios */}
            <TabsContent value="ads" className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Gerencie os anúncios nativos exibidos na plataforma.
                  </p>
                </div>
                <Button onClick={handleOpenAddAdModal}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Anúncio
                </Button>
              </div>
              
              <AdList
                ads={ads}
                loading={adsLoading}
                onEdit={handleEditAd}
                onRefresh={refetchAds}
              />
            </TabsContent>

            {/* Tab de Conteúdo Premium */}
            <TabsContent value="premium" className="space-y-6">
              <PremiumContentList />
            </TabsContent>

            {/* Tab de Curadoria */}
            <TabsContent value="curated" className="space-y-6">
              <TmdbCuratedImport />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Modal de Canal */}
      <Dialog open={isChannelModalOpen} onOpenChange={setIsChannelModalOpen}>
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
            onSuccess={handleChannelFormSuccess}
            onCancel={handleCloseChannelModal}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de Anúncio */}
      <Dialog open={isAdModalOpen} onOpenChange={setIsAdModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingAd ? "Editar Anúncio" : "Adicionar Anúncio"}
            </DialogTitle>
            <DialogDescription>
              {editingAd 
                ? "Atualize as informações do anúncio" 
                : "Configure um novo anúncio nativo"}
            </DialogDescription>
          </DialogHeader>
          <AdForm
            editingAd={editingAd}
            onSuccess={handleAdFormSuccess}
            onCancel={handleCloseAdModal}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
