import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAds, type Ad } from "@/hooks/useAds";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tv, LogOut, ArrowLeft, Plus, Megaphone, Film, Download, Clapperboard, Sparkles, Briefcase } from "lucide-react";
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
import { CineBusinessForm } from "@/components/admin/CineBusinessForm";

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

  // Estados para CineBusiness
  const [editingCineBiz, setEditingCineBiz] = useState<any | null>(null);
  const [isCineBizModalOpen, setIsCineBizModalOpen] = useState(false);
  const [cineBizItems, setCineBizItems] = useState<any[]>([]);
  const [cineBizLoading, setCineBizLoading] = useState(true);

  const fetchCineBusiness = useCallback(async () => {
    setCineBizLoading(true);
    try {
      const { data, error } = await supabase
        .from("vod_movies")
        .select("*")
        .in("category", ["Negócios", "Empreendedorismo", "Mentalidade", "Liderança", "Finanças", "Marketing", "Produtividade", "Tecnologia", "Desenvolvimento Pessoal", "Startups"])
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error fetching CineBusiness:", error);
        setCineBizItems([]);
      } else {
        setCineBizItems(data || []);
      }
    } catch (err) {
      console.error("Error:", err);
    }
    setCineBizLoading(false);
  }, []);

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
      fetchCineBusiness();
    }
  }, [user, isAdmin, fetchChannels, fetchCineBusiness]);

  if (loading || (user && adminCheckLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  useEffect(() => {
    if (!loading && !user) {
      navigate("/admin/login", { replace: true });
    }
  }, [user, loading, navigate]);

  if (!user) {
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
            <TabsList className="grid w-full grid-cols-4 md:grid-cols-9">
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
              <TabsTrigger value="cinebiz" className="flex items-center gap-1 text-xs md:text-sm">
                <Briefcase className="w-3.5 h-3.5" />
                <span className="hidden md:inline">CineBusiness</span>
                <span className="md:hidden">CineBiz</span>
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

            {/* Import tab is rendered outside Tabs to persist worker */}
            <TabsContent value="import" className="hidden" />

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

            {/* Tab CineBusiness */}
            <TabsContent value="cinebiz" className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Adicione conteúdos de negócios com busca TMDB e monetização integrada.
                  </p>
                </div>
                <Button onClick={() => { setEditingCineBiz(null); setIsCineBizModalOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Conteúdo
                </Button>
              </div>
              {isCineBizModalOpen && (
                <Card>
                  <CardHeader>
                    <CardTitle>{editingCineBiz ? "Editar Conteúdo" : "Adicionar Conteúdo CineBusiness"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CineBusinessForm
                      editingMovie={editingCineBiz}
                      onSuccess={() => { setIsCineBizModalOpen(false); setEditingCineBiz(null); fetchCineBusiness(); }}
                      onCancel={() => { setIsCineBizModalOpen(false); setEditingCineBiz(null); }}
                    />
                  </CardContent>
                </Card>
              )}
              
              {/* Tabela de Conteúdos Cadastrados */}
              <Card>
                <CardHeader>
                  <CardTitle>Conteúdos Cadastrados</CardTitle>
                  <CardDescription>Gerencie os conteúdos do CineBusiness</CardDescription>
                </CardHeader>
                <CardContent>
                  {cineBizLoading ? (
                    <div className="text-center text-muted-foreground py-8">Carregando...</div>
                  ) : cineBizItems.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">Nenhum conteúdo cadastrado</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-2">Título</th>
                            <th className="text-left py-2 px-2">Categoria</th>
                            <th className="text-left py-2 px-2">Nota</th>
                            <th className="text-left py-2 px-2">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cineBizItems.map((item) => (
                            <tr key={item.id} className="border-b hover:bg-muted/50">
                              <td className="py-2 px-2 font-medium">{item.name}</td>
                              <td className="py-2 px-2 text-muted-foreground">{item.category}</td>
                              <td className="py-2 px-2">{item.rating ? `${item.rating.toFixed(1)}/10` : '-'}</td>
                              <td className="py-2 px-2 flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingCineBiz(item);
                                    setIsCineBizModalOpen(true);
                                  }}
                                >
                                  Editar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={async () => {
                                    if (confirm(`Tem certeza que deseja excluir "${item.name}"?`)) {
                                      const { error } = await supabase.from("vod_movies").delete().eq("id", item.id);
                                      if (error) {
                                        alert("Erro ao excluir: " + error.message);
                                      } else {
                                        fetchCineBusiness();
                                      }
                                    }
                                  }}
                                >
                                  Excluir
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* VodImport rendered outside Tabs so it never unmounts */}
          <div className={activeTab === "import" ? "mt-6 space-y-6" : "hidden"}>
            <VodImport />
          </div>
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
