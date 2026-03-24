import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Film, Clapperboard, Loader2, CheckCircle, XCircle, Search, RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const SETTINGS_KEY = "xtream_credentials";

interface CheckResult {
  moviesInApi: number;
  moviesInDb: number;
  newMovies: number;
  seriesInApi: number;
  seriesInDb: number;
  newSeries: number;
}

const VodImport = () => {
  const [dns, setDns] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [importType, setImportType] = useState<"movies" | "series" | "both">("both");
  const [progress, setProgress] = useState({ current: 0, total: 0, phase: "" });
  const [totalResult, setTotalResult] = useState<{ movies: number; series: number; episodes: number; errors: number } | null>(null);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const workerRef = useRef<Worker | null>(null);

  // Load saved credentials from database
  useEffect(() => {
    const loadCredentials = async () => {
      try {
        const { data, error } = await supabase
          .from("admin_settings" as any)
          .select("value")
          .eq("key", SETTINGS_KEY)
          .maybeSingle();
        if (error) {
          console.error("Erro ao carregar credenciais:", error);
          return;
        }
        if (data?.value) {
          const val = data.value as Record<string, string>;
          if (val.dns) setDns(val.dns);
          if (val.username) setUsername(val.username);
          if (val.password) setPassword(val.password);
        }
      } catch (err) {
        console.error("Erro ao carregar credenciais:", err);
      }
    };
    loadCredentials();
  }, []);

  const handleSaveCredentials = async () => {
    if (!dns || !username || !password) {
      toast.error("Preencha todos os campos antes de salvar");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("admin_settings" as any)
        .upsert(
          { key: SETTINGS_KEY, value: { dns, username, password }, updated_at: new Date().toISOString() },
          { onConflict: "key" }
        );
      if (error) throw error;
      toast.success("Credenciais salvas no banco!");
    } catch (err) {
      toast.error("Erro ao salvar credenciais");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Cleanup worker on unmount
  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const handleImport = useCallback(() => {
    if (!dns || !username || !password) {
      toast.error("Preencha todos os campos");
      return;
    }

    setLoading(true);
    setTotalResult(null);
    setCheckResult(null);

    // Terminate previous worker if any
    workerRef.current?.terminate();

    const worker = new Worker(
      new URL("../../workers/vodImportWorker.ts", import.meta.url),
      { type: "module" }
    );
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const msg = e.data;

      if (msg.type === "progress") {
        setProgress({ current: msg.current, total: msg.total, phase: msg.phase });
      } else if (msg.type === "done") {
        setTotalResult(msg.totals);
        setLoading(false);
        toast.success(
          `Importação completa! ${msg.totals.movies} filmes, ${msg.totals.series} séries, ${msg.totals.episodes} episódios`
        );
        worker.terminate();
        workerRef.current = null;
      } else if (msg.type === "cancelled") {
        toast.info("Importação cancelada");
        if (msg.totals) setTotalResult(msg.totals);
        setLoading(false);
        worker.terminate();
        workerRef.current = null;
      } else if (msg.type === "error") {
        toast.error(msg.message || "Erro na importação VOD");
        if (msg.totals) setTotalResult(msg.totals);
        setLoading(false);
        worker.terminate();
        workerRef.current = null;
      }
    };

    worker.onerror = (err) => {
      console.error("Worker error:", err);
      toast.error("Erro no worker de importação");
      setLoading(false);
      worker.terminate();
      workerRef.current = null;
    };

    worker.postMessage({
      type: "start",
      config: {
        dns,
        username,
        password,
        importType,
        supabaseUrl: SUPABASE_URL,
        supabaseKey: SUPABASE_KEY,
      },
    });
  }, [dns, username, password, importType]);

  const handleCancel = () => {
    workerRef.current?.postMessage({ type: "cancel" });
  };

  const handleCheck = async () => {
    if (!dns || !username || !password) {
      toast.error("Preencha todos os campos");
      return;
    }

    setChecking(true);
    setCheckResult(null);

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/import-xtream-vod`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({ dns, username, password, type: importType, mode: "check" }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro na verificação");

      setCheckResult(data);
      const totalNew = (data.newMovies || 0) + (data.newSeries || 0);
      if (totalNew > 0) {
        toast.info(`Encontrado ${totalNew} conteúdo(s) novo(s)!`);
      } else {
        toast.success("Tudo atualizado! Nenhum conteúdo novo encontrado.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao verificar novidades");
    } finally {
      setChecking(false);
    }
  };

  const progressPercent = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Film className="w-5 h-5" />
          Importar Filmes e Séries (VOD)
        </CardTitle>
        <CardDescription>
          A importação roda em segundo plano — você pode navegar em outras abas sem interromper o processo. Use "Verificar Novidades" para checar se há conteúdo novo antes de importar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="vod-dns">DNS / URL</Label>
            <Input id="vod-dns" value={dns} onChange={(e) => setDns(e.target.value)} placeholder="http://servidor.com" disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vod-user">Usuário</Label>
            <Input id="vod-user" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vod-pass">Senha</Label>
            <Input id="vod-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" disabled={loading} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>O que importar?</Label>
          <Tabs value={importType} onValueChange={(v) => setImportType(v as any)}>
            <TabsList className="grid grid-cols-3 w-full max-w-sm">
              <TabsTrigger value="both" disabled={loading}>Tudo</TabsTrigger>
              <TabsTrigger value="movies" className="flex items-center gap-1" disabled={loading}>
                <Film className="w-3 h-3" /> Filmes
              </TabsTrigger>
              <TabsTrigger value="series" className="flex items-center gap-1" disabled={loading}>
                <Clapperboard className="w-3 h-3" /> Séries
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleSaveCredentials} variant="secondary" disabled={loading || saving || !dns || !username || !password}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar Credenciais
          </Button>

          <Button onClick={handleCheck} disabled={loading || checking} variant="outline">
            {checking ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verificando...</>
            ) : (
              <><Search className="w-4 h-4 mr-2" /> Verificar Novidades</>
            )}
          </Button>

          <Button onClick={handleImport} disabled={loading} className="flex-1 min-w-[200px]">
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importando (segundo plano)...</>
            ) : (
              <><RefreshCw className="w-4 h-4 mr-2" /> Importar {importType === "movies" ? "Filmes" : importType === "series" ? "Séries" : "Tudo"}</>
            )}
          </Button>

          {loading && (
            <Button variant="destructive" onClick={handleCancel}>
              <XCircle className="w-4 h-4 mr-1" /> Cancelar
            </Button>
          )}
        </div>

        {checkResult && (
          <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Search className="w-4 h-4" /> Resultado da Verificação
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              {(importType === "movies" || importType === "both") && (
                <>
                  <p>Filmes na API: <strong>{checkResult.moviesInApi}</strong> | No banco: <strong>{checkResult.moviesInDb}</strong></p>
                  <p className={checkResult.newMovies > 0 ? "text-primary font-medium" : ""}>
                    → {checkResult.newMovies > 0 ? `${checkResult.newMovies} filme(s) novo(s)` : "Nenhum filme novo"}
                  </p>
                </>
              )}
              {(importType === "series" || importType === "both") && (
                <>
                  <p>Séries na API: <strong>{checkResult.seriesInApi}</strong> | No banco: <strong>{checkResult.seriesInDb}</strong></p>
                  <p className={checkResult.newSeries > 0 ? "text-primary font-medium" : ""}>
                    → {checkResult.newSeries > 0 ? `${checkResult.newSeries} série(s) nova(s)` : "Nenhuma série nova"}
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {loading && progress.phase && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{progress.phase}</p>
            <Progress value={progressPercent} />
          </div>
        )}

        {totalResult && (
          <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <CheckCircle className="w-4 h-4" /> Importação concluída
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Filmes: <strong>{totalResult.movies}</strong></p>
              <p>Séries: <strong>{totalResult.series}</strong></p>
              <p>Episódios: <strong>{totalResult.episodes}</strong></p>
              {totalResult.errors > 0 && <p className="text-destructive">Erros: {totalResult.errors}</p>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VodImport;
