import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePremiumContent, usePremiumContentAdmin, type PremiumContent } from "@/hooks/usePremiumContent";
import { useCourses } from "@/hooks/useCourses";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PremiumContentForm from "@/components/admin/PremiumContentForm";
import { CourseCard } from "@/components/courses/CourseCard";
import { CourseManager } from "@/components/courses/CourseManager";
import { ArrowLeft, Play, Lock, LogOut, Plus, Pencil, Trash2, Settings, BookOpen, Film } from "lucide-react";
import { toast } from "sonner";

const Premium = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const { content, loading, refetch } = usePremiumContent();
  const { courses, loading: coursesLoading } = useCourses();
  const { createContent, updateContent, deleteContent } = usePremiumContentAdmin();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<PremiumContent | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("courses");

  // Redirecionamento agora é feito pelo ProtectedRoute

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleCreate = async (data: Omit<PremiumContent, "id" | "createdAt" | "updatedAt">) => {
    try {
      await createContent(data);
      toast.success("Conteúdo criado com sucesso!");
      setIsDialogOpen(false);
      refetch();
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
      refetch();
    } catch {
      toast.error("Erro ao atualizar conteúdo");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este conteúdo?")) return;
    try {
      await deleteContent(id);
      toast.success("Conteúdo excluído com sucesso!");
      refetch();
    } catch {
      toast.error("Erro ao excluir conteúdo");
    }
  };

  const openCreateDialog = () => {
    setEditingContent(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: PremiumContent) => {
    setEditingContent(item);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setEditingContent(null);
    setIsDialogOpen(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Lock className="w-4 h-4 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold">Conteúdo Premium</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <Button
                  variant={isEditMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsEditMode(!isEditMode)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  {isEditMode ? "Modo Visualização" : "Modo Admin"}
                </Button>
                {isEditMode && (
                  <Button size="sm" onClick={openCreateDialog}>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo
                  </Button>
                )}
              </>
            )}
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {isAdmin && isEditMode ? (
          <CourseManager />
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="courses" className="gap-2">
                <BookOpen className="w-4 h-4" />
                Cursos
              </TabsTrigger>
              <TabsTrigger value="videos" className="gap-2">
                <Film className="w-4 h-4" />
                Vídeos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="courses">
              {coursesLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="aspect-[3/4] bg-muted rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : courses.length === 0 ? (
                <div className="text-center py-16">
                  <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h2 className="text-xl font-semibold mb-2">Nenhum curso disponível</h2>
                  <p className="text-muted-foreground">Novos cursos serão adicionados em breve.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {courses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      onClick={() => navigate(`/course/${course.id}`)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="videos">
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="aspect-video bg-muted rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : content.length === 0 ? (
                <div className="text-center py-16">
                  <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h2 className="text-xl font-semibold mb-2">Nenhum conteúdo disponível</h2>
                  <p className="text-muted-foreground">Novos conteúdos serão adicionados em breve.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {content.map((item) => (
                    <div key={item.id} className="relative group">
                      <button
                        onClick={() => navigate(`/premium/watch/${item.id}`)}
                        className="w-full relative aspect-video rounded-lg overflow-hidden bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-xl text-left"
                      >
                        {item.thumbnailUrl ? (
                          <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                            <Lock className="w-8 h-8 text-primary/50" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300">
                            <Play className="w-6 h-6 text-primary-foreground ml-1" />
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <h3 className="font-semibold text-white text-sm line-clamp-1 mb-1">{item.title}</h3>
                          {item.description && <p className="text-white/70 text-xs line-clamp-2">{item.description}</p>}
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Admin Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
    </div>
  );
};

export default Premium;
