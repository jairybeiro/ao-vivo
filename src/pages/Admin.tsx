import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tv, Plus, LogOut, ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = ["Notícias", "Esporte", "Filmes", "Séries"];

const Admin = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Notícias");
  const [logo, setLogo] = useState("");
  const [streamUrls, setStreamUrls] = useState(["", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...streamUrls];
    newUrls[index] = value;
    setStreamUrls(newUrls);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const validUrls = streamUrls.filter((url) => url.trim() !== "");
    
    if (validUrls.length === 0) {
      toast.error("Adicione pelo menos uma URL de stream");
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.from("channels").insert({
      name,
      category,
      logo: logo || null,
      stream_urls: validUrls,
    });

    if (error) {
      toast.error("Erro ao adicionar canal", { description: error.message });
    } else {
      toast.success("Canal adicionado com sucesso!");
      setName("");
      setCategory("Notícias");
      setLogo("");
      setStreamUrls(["", "", ""]);
    }

    setIsSubmitting(false);
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

      <main className="container mx-auto px-4 py-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Adicionar Canal
            </CardTitle>
            <CardDescription>
              Preencha as informações do novo canal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Canal</Label>
                  <Input
                    id="name"
                    placeholder="Ex: GloboNews"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">URL do Logo (opcional)</Label>
                <Input
                  id="logo"
                  placeholder="https://..."
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label>URLs de Stream</Label>
                {streamUrls.map((url, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-20">
                      Opção {index + 1}
                    </span>
                    <Input
                      placeholder="https://...m3u8"
                      value={url}
                      onChange={(e) => handleUrlChange(index, e.target.value)}
                    />
                    {url && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleUrlChange(index, "")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Adicionando..." : "Adicionar Canal"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Admin;
