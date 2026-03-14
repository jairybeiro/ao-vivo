import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Loader2, CheckCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface ImportResult {
  totalStreams: number;
  inserted: number;
  updated?: number;
  skippedDuplicates?: number;
  errors: number;
  categories: string[];
}

interface XtreamImportProps {
  onImportComplete: () => void;
}

const XtreamImport = ({ onImportComplete }: XtreamImportProps) => {
  const [dns, setDns] = useState("http://ipsmart.icu");
  const [username, setUsername] = useState("5541996151706");
  const [password, setPassword] = useState("5541996151706");
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const callImport = async (isSync = false) => {
    if (!dns || !username || !password) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (isSync) setSyncing(true);
    else setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/import-xtream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({ dns, username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro na importação");
      }

      setResult(data);
      const msg = isSync
        ? `Sincronizado! ${data.inserted} novos, ${data.updated || 0} atualizados.`
        : `${data.inserted} canais importados com sucesso!`;
      toast.success(msg);
      onImportComplete();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro na importação");
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Importar Xtream Codes
        </CardTitle>
        <CardDescription>
          Importe canais de uma API Xtream Codes. A sincronização diária é automática, mas você pode forçar manualmente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dns">DNS / URL</Label>
            <Input
              id="dns"
              value={dns}
              onChange={(e) => setDns(e.target.value)}
              placeholder="http://servidor.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="xtream-user">Usuário</Label>
            <Input
              id="xtream-user"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="xtream-pass">Senha</Label>
            <Input
              id="xtream-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={() => callImport(false)} disabled={loading || syncing} className="flex-1">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Importar Canais
              </>
            )}
          </Button>
          <Button onClick={() => callImport(true)} disabled={loading || syncing} variant="outline" className="flex-1">
            {syncing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Sincronizar Agora
              </>
            )}
          </Button>
        </div>

        {result && (
          <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <CheckCircle className="w-4 h-4" />
              Concluído
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Total na API: <strong>{result.totalStreams}</strong></p>
              <p>Novos inseridos: <strong>{result.inserted}</strong></p>
              {result.updated !== undefined && <p>Atualizados: <strong>{result.updated}</strong></p>}
              {result.skippedDuplicates !== undefined && <p>Já existentes: <strong>{result.skippedDuplicates}</strong></p>}
              {result.errors > 0 && <p className="text-destructive">Erros: {result.errors}</p>}
              <p className="text-xs">Categorias: {result.categories.join(", ")}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default XtreamImport;
