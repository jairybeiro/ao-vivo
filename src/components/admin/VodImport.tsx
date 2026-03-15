import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Film, Clapperboard, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface VodImportResult {
  moviesInserted: number;
  moviesUpdated: number;
  seriesInserted: number;
  episodesInserted: number;
  errors: number;
}

const VodImport = () => {
  const [dns, setDns] = useState("http://ipsmart.icu");
  const [username, setUsername] = useState("5541996151706");
  const [password, setPassword] = useState("5541996151706");
  const [loading, setLoading] = useState(false);
  const [importType, setImportType] = useState<"movies" | "series" | "both">("both");
  const [result, setResult] = useState<VodImportResult | null>(null);

  const handleImport = async () => {
    if (!dns || !username || !password) {
      toast.error("Preencha todos os campos");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/import-xtream-vod`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({ dns, username, password, type: importType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro na importação");
      }

      setResult(data);
      toast.success(
        `Importado! ${data.moviesInserted} filmes, ${data.seriesInserted} séries, ${data.episodesInserted} episódios`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro na importação VOD");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Film className="w-5 h-5" />
          Importar Filmes e Séries (VOD)
        </CardTitle>
        <CardDescription>
          Importe filmes e séries da API Xtream Codes. URLs MP4 diretas — mais estáveis que streams ao vivo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="vod-dns">DNS / URL</Label>
            <Input
              id="vod-dns"
              value={dns}
              onChange={(e) => setDns(e.target.value)}
              placeholder="http://servidor.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vod-user">Usuário</Label>
            <Input
              id="vod-user"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vod-pass">Senha</Label>
            <Input
              id="vod-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>O que importar?</Label>
          <Tabs value={importType} onValueChange={(v) => setImportType(v as any)}>
            <TabsList className="grid grid-cols-3 w-full max-w-sm">
              <TabsTrigger value="both">Tudo</TabsTrigger>
              <TabsTrigger value="movies" className="flex items-center gap-1">
                <Film className="w-3 h-3" />
                Filmes
              </TabsTrigger>
              <TabsTrigger value="series" className="flex items-center gap-1">
                <Clapperboard className="w-3 h-3" />
                Séries
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Button onClick={handleImport} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Importando... (pode levar alguns minutos)
            </>
          ) : (
            <>
              <Film className="w-4 h-4 mr-2" />
              Importar {importType === "movies" ? "Filmes" : importType === "series" ? "Séries" : "Filmes e Séries"}
            </>
          )}
        </Button>

        {result && (
          <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <CheckCircle className="w-4 h-4" />
              Importação concluída
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Filmes inseridos: <strong>{result.moviesInserted}</strong></p>
              <p>Filmes atualizados: <strong>{result.moviesUpdated}</strong></p>
              <p>Séries inseridas: <strong>{result.seriesInserted}</strong></p>
              <p>Episódios inseridos: <strong>{result.episodesInserted}</strong></p>
              {result.errors > 0 && <p className="text-destructive">Erros: {result.errors}</p>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VodImport;
