import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAds, type Ad } from "@/hooks/useAds";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tv, LogOut, ArrowLeft, Plus, Megaphone, Briefcase, BookOpen } from "lucide-react";
import { AdForm } from "@/components/admin/AdForm";
import { AdList } from "@/components/admin/AdList";
import { CineBusinessForm } from "@/components/admin/CineBusinessForm";
import { CourseManager } from "@/components/courses/CourseManager";
import { XtreamSearch } from "@/components/admin/XtreamSearch";

const Admin = () => {
  const { user, isAdmin, loading, adminCheckLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("cinebiz");

  // Ads state
  const { ads, loading: adsLoading, refetch: refetchAds } = useAds();
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);

  // CineBusiness state
  const [editingCineBiz, setEditingCineBiz] = useState<any | null>(null);
  const [isCineBizModalOpen, setIsCineBizModalOpen] = useState(false);
  const [cineBizItems, setCineBizItems] = useState<any[]>([]);
  const [cineBizLoading, setCineBizLoading] = useState(true);

  const fetchCineBusiness = useCallback(async () => {
    setCineBizLoading(true);
    const { data, error } = await supabase
      .from("vod_movies")
      .select("*")
      .in("category", ["Negócios", "Empreendedorismo", "Mentalidade", "Liderança", "Finanças", "Marketing", "Produtividade", "Tecnologia", "Desenvolvimento Pessoal", "Startups"])
      .order("created_at", { ascending: false });
    if (!error) setCineBizItems(data || []);
    setCineBizLoading(false);
  }, []);

  useEffect(() => {
    if (user && isAdmin) fetchCineBusiness();
  }, [user, isAdmin, fetchCineBusiness]);

  useEffect(() => {
    if (!loading && !user) navigate("/admin/login", { replace: true });
  }, [user, loading, navigate]);

  if (loading || (user && adminCheckLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Acesso Negado</CardTitle>
            <CardDescription>Você não tem permissão de administrador.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
            </Button>
            <Button variant="ghost" className="w-full" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" /> Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                <p className="text-xs text-muted-foreground">Gerenciar conteúdos</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => navigate("/")}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
              </Button>
              <Button variant="outline" onClick={signOut}>
                <LogOut className="w-4 h-4 mr-2" /> Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="cinebiz" className="space-y-6" onValueChange={setActiveTab} value={activeTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="cinebiz" className="flex items-center gap-1 text-xs md:text-sm">
                <Briefcase className="w-3.5 h-3.5" />
                <span>CineBusiness</span>
              </TabsTrigger>
              <TabsTrigger value="courses" className="flex items-center gap-1 text-xs md:text-sm">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Cursos</span>
              </TabsTrigger>
              <TabsTrigger value="ads" className="flex items-center gap-1 text-xs md:text-sm">
                <Megaphone className="w-3.5 h-3.5" />
                <span>Anúncios</span>
              </TabsTrigger>
            </TabsList>

            {/* CineBusiness */}
            <TabsContent value="cinebiz" className="space-y-6">
              <XtreamSearch />
              <div className="flex justify-between items-start">
                <p className="text-sm text-muted-foreground">
                  Adicione conteúdos de negócios com busca TMDB e monetização integrada.
                </p>
                <Button onClick={() => { setEditingCineBiz(null); setIsCineBizModalOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" /> Novo Conteúdo
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
                                <Button size="sm" variant="outline" onClick={() => { setEditingCineBiz(item); setIsCineBizModalOpen(true); }}>
                                  Editar
                                </Button>
                                <Button size="sm" variant="destructive" onClick={async () => {
                                  if (confirm(`Excluir "${item.name}"?`)) {
                                    await supabase.from("vod_movies").delete().eq("id", item.id);
                                    fetchCineBusiness();
                                  }
                                }}>
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

            {/* Courses */}
            <TabsContent value="courses" className="space-y-6">
              <CourseManager />
            </TabsContent>

            {/* Ads */}
            <TabsContent value="ads" className="space-y-6">
              <div className="flex justify-between items-start">
                <p className="text-sm text-muted-foreground">Gerencie os anúncios nativos.</p>
                <Button onClick={() => { setEditingAd(null); setIsAdModalOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" /> Adicionar Anúncio
                </Button>
              </div>
              <AdList ads={ads} loading={adsLoading} onEdit={(ad) => { setEditingAd(ad); setIsAdModalOpen(true); }} onRefresh={refetchAds} />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Ad Modal */}
      <Dialog open={isAdModalOpen} onOpenChange={setIsAdModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingAd ? "Editar Anúncio" : "Adicionar Anúncio"}</DialogTitle>
            <DialogDescription>{editingAd ? "Atualize as informações do anúncio" : "Configure um novo anúncio nativo"}</DialogDescription>
          </DialogHeader>
          <AdForm
            editingAd={editingAd}
            onSuccess={() => { setEditingAd(null); setIsAdModalOpen(false); refetchAds(); }}
            onCancel={() => { setEditingAd(null); setIsAdModalOpen(false); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
