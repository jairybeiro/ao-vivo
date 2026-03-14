import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface ImportResult {
  totalStreams: number;
  inserted: number;
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
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleImport = async () => {
    if (!dns || !username || !password) {
      toast.error("Preencha todos os campos");
      return;
    }

    setLoading(true);
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
      toast.success(`${data.inserted} canais importados com sucesso!`);
      onImportComplete();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro na importação");
    } finally {
      setLoading(false);
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
          Importe canais de uma API Xtream Codes automaticamente.
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

        <Button onClick={handleImport} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Importando canais...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Importar Canais
            </>
          )}
        </Button>

        {result && (
          <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-green-600">
              <CheckCircle className="w-4 h-4" />
              Importação concluída
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Total na API: <strong>{result.totalStreams}</strong></p>
              <p>Inseridos: <strong>{result.inserted}</strong></p>
              {result.errors > 0 && <p className="text-destructive">Erros: {result.errors}</p>}
              <p>Categorias: {result.categories.join(", ")}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default XtreamImport;
