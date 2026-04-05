import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Copy, Check, Loader2, RefreshCw, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface XtreamResult {
  stream_id: number;
  name: string;
  stream_url: string;
  cover_url: string | null;
  rating: string | null;
  category_id: string | null;
  container_extension: string;
  added: string | null;
}

interface XtreamCredentials {
  host: string;
  username: string;
  password: string;
}

const DEFAULT_CREDENTIALS: XtreamCredentials = {
  host: "http://ipsmart.icu",
  username: "5541996151706",
  password: "5541996151706",
};

export const XtreamSearch = () => {
  const [expanded, setExpanded] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentials, setCredentials] = useState<XtreamCredentials>(DEFAULT_CREDENTIALS);
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<XtreamResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedItem, setSelectedItem] = useState<XtreamResult | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (searchTerm.trim().length < 2) {
      toast.error("Digite pelo menos 2 caracteres");
      return;
    }

    setSearching(true);
    setResults([]);

    try {
      const { data, error } = await supabase.functions.invoke("xtream-search", {
        body: {
          host: credentials.host,
          username: credentials.username,
          password: credentials.password,
          search: searchTerm.trim(),
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResults(data?.results || []);
      if ((data?.results || []).length === 0) {
        toast.info("Nenhum resultado encontrado");
      }
    } catch (err: any) {
      toast.error("Erro na busca: " + (err.message || "Erro desconhecido"));
    } finally {
      setSearching(false);
    }
  }, [searchTerm, credentials]);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success("Copiado!");
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setExpanded(!expanded)}
        className="w-full justify-start text-xs text-muted-foreground border-dashed"
      >
        <RefreshCw className="w-3 h-3 mr-1.5" />
        Atualizar
      </Button>

      {expanded && (
        <Card className="border-dashed">
          <CardHeader className="py-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Buscar Mídia</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setShowCredentials(!showCredentials)}
              >
                {showCredentials ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                {showCredentials ? "Ocultar" : "Credenciais"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {showCredentials && (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Host</Label>
                  <Input
                    className="h-8 text-xs"
                    value={credentials.host}
                    onChange={(e) => setCredentials({ ...credentials, host: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Usuário</Label>
                  <Input
                    className="h-8 text-xs"
                    value={credentials.username}
                    onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Senha</Label>
                  <Input
                    className="h-8 text-xs"
                    type="password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Input
                className="h-9 text-sm"
                placeholder="Ex: Forrest Gump, Wolf of Wall Street..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button size="sm" className="h-9 px-4" onClick={handleSearch} disabled={searching}>
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>

            {results.length > 0 && (
              <div className="max-h-60 overflow-y-auto space-y-1 border rounded-md p-2">
                {results.map((item) => (
                  <button
                    key={item.stream_id}
                    onClick={() => setSelectedItem(item)}
                    className="w-full flex items-center gap-2 p-2 rounded hover:bg-muted/50 text-left transition-colors"
                  >
                    {item.cover_url && (
                      <img
                        src={item.cover_url}
                        alt=""
                        className="w-8 h-11 rounded object-cover flex-shrink-0"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">.{item.container_extension}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Detail Modal */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">{selectedItem?.name}</DialogTitle>
            <DialogDescription>Detalhes da mídia encontrada</DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-3">
              {selectedItem.cover_url && (
                <img
                  src={selectedItem.cover_url}
                  alt={selectedItem.name}
                  className="w-full max-h-48 object-contain rounded"
                />
              )}

              <FieldRow label="Nome" value={selectedItem.name} onCopy={copyToClipboard} copiedField={copiedField} />
              <FieldRow label="URL da Mídia (MP4)" value={selectedItem.stream_url} onCopy={copyToClipboard} copiedField={copiedField} highlight />
              <FieldRow label="Capa" value={selectedItem.cover_url || "—"} onCopy={copyToClipboard} copiedField={copiedField} />
              <FieldRow label="Extensão" value={selectedItem.container_extension} onCopy={copyToClipboard} copiedField={copiedField} />
              <FieldRow label="Rating" value={selectedItem.rating || "—"} onCopy={copyToClipboard} copiedField={copiedField} />
              <FieldRow label="Stream ID" value={String(selectedItem.stream_id)} onCopy={copyToClipboard} copiedField={copiedField} />
              {selectedItem.added && (
                <FieldRow label="Adicionado" value={selectedItem.added} onCopy={copyToClipboard} copiedField={copiedField} />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

function FieldRow({
  label,
  value,
  onCopy,
  copiedField,
  highlight,
}: {
  label: string;
  value: string;
  onCopy: (text: string, field: string) => void;
  copiedField: string | null;
  highlight?: boolean;
}) {
  const isCopied = copiedField === label;

  return (
    <div className={`flex items-start gap-2 p-2 rounded ${highlight ? "bg-primary/10 border border-primary/20" : "bg-muted/30"}`}>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className={`text-xs break-all ${highlight ? "text-primary font-medium" : ""}`}>{value}</p>
      </div>
      {value && value !== "—" && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 flex-shrink-0"
          onClick={() => onCopy(value, label)}
        >
          {isCopied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
        </Button>
      )}
    </div>
  );
}
