import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, X, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const BUSINESS_CATEGORIES = [
  "Negócios",
  "Empreendedorismo",
  "Mentalidade",
  "Liderança",
  "Finanças",
  "Marketing",
  "Produtividade",
  "Tecnologia",
  "Desenvolvimento Pessoal",
  "Startups",
];

interface TmdbResult {
  tmdb_id: number;
  title: string;
  original_title: string;
  overview: string | null;
  poster_url: string | null;
  backdrop_url: string | null;
  rating: number | null;
  release_date: string | null;
}

interface CineBusinessFormProps {
  editingMovie?: any | null;
  onSuccess: () => void;
  onCancel?: () => void;
}

export const CineBusinessForm = ({ editingMovie, onSuccess, onCancel }: CineBusinessFormProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TmdbResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedResult, setSelectedResult] = useState<TmdbResult | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Negócios");
  const [coverUrl, setCoverUrl] = useState("");
  const [backdropUrl, setBackdropUrl] = useState("");
  const [trailerUrl, setTrailerUrl] = useState("");
  const [rating, setRating] = useState("");
  const [sinopse, setSinopse] = useState("");
  const [streamUrl, setStreamUrl] = useState("pending");

  // Monetization fields
  const [linkCheckout, setLinkCheckout] = useState("");
  const [tempoAnuncio, setTempoAnuncio] = useState("30");
  const [urlImagemAnuncio, setUrlImagemAnuncio] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!editingMovie;

  useEffect(() => {
    if (editingMovie) {
      setName(editingMovie.name || "");
      setCategory(editingMovie.category || "Negócios");
      setStreamUrl(editingMovie.stream_url || "pending");
      setCoverUrl(editingMovie.cover_url || "");
      setBackdropUrl(editingMovie.backdrop_url || "");
      setTrailerUrl(editingMovie.trailer_url || "");
      setRating(editingMovie.rating?.toString() || "");
      setSinopse(editingMovie.sinopse || "");
      setLinkCheckout(editingMovie.link_checkout || "");
      setTempoAnuncio(editingMovie.tempo_anuncio?.toString() || "30");
      setUrlImagemAnuncio(editingMovie.url_imagem_anuncio || "");
    }
  }, [editingMovie]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return;
    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("tmdb-search", {
        body: { query: searchQuery.trim(), type: "movie" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSearchResults(data.results || []);
    } catch (err: any) {
      toast.error("Erro na busca TMDB", { description: err.message });
    }
    setIsSearching(false);
  }, [searchQuery]);

  const handleSelectResult = async (result: TmdbResult) => {
    setSelectedResult(result);
    setSearchResults([]);
    setName(result.title);
    setCoverUrl(result.poster_url || "");
    setBackdropUrl(result.backdrop_url || "");
    setRating(result.rating?.toString() || "");
    setSinopse(result.overview || "");

    // Fetch trailer
    try {
      const { data } = await supabase.functions.invoke("tmdb-lookup", {
        body: { tmdb_id: result.tmdb_id, type: "movie" },
      });
      if (data?.trailer_url) setTrailerUrl(data.trailer_url);
    } catch { /* silent */ }

    toast.success("Dados preenchidos automaticamente!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Preencha o nome"); return; }
    setIsSubmitting(true);

    const payload: any = {
      name: name.trim(),
      category: category.trim() || "Negócios",
      stream_url: streamUrl.trim() || "pending",
      cover_url: coverUrl.trim() || null,
      backdrop_url: backdropUrl.trim() || null,
      trailer_url: trailerUrl.trim() || null,
      rating: rating ? parseFloat(rating) : null,
      sinopse: sinopse.trim() || null,
      link_checkout: linkCheckout.trim() || null,
      tempo_anuncio: tempoAnuncio ? parseInt(tempoAnuncio) : 30,
      url_imagem_anuncio: urlImagemAnuncio.trim() || null,
      tmdb_id: selectedResult?.tmdb_id || editingMovie?.tmdb_id || null,
    };

    if (isEditing && editingMovie) {
      const { error } = await supabase.from("vod_movies").update(payload).eq("id", editingMovie.id);
      if (error) toast.error("Erro ao atualizar", { description: error.message });
      else { toast.success("Conteúdo atualizado!"); onSuccess(); }
    } else {
      const { error } = await supabase.from("vod_movies").insert({
        ...payload,
        xtream_id: -Math.floor(Math.random() * 900000 + 100000),
      });
      if (error) toast.error("Erro ao adicionar", { description: error.message });
      else { toast.success("Conteúdo adicionado!"); onSuccess(); }
    }
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* TMDB Search */}
      <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
        <Label className="text-sm font-semibold text-primary">🔍 Buscar no TMDB</Label>
        <div className="flex gap-2">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[200px] h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BUSINESS_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Buscar filme ou documentário..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
              className="h-9 text-sm"
            />
            <Button type="button" size="sm" variant="secondary" onClick={handleSearch} disabled={isSearching}>
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="max-h-64 overflow-y-auto space-y-1 rounded-lg border border-border bg-card p-2">
            {searchResults.map((r) => (
              <button
                key={r.tmdb_id}
                type="button"
                onClick={() => handleSelectResult(r)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors text-left"
              >
                {r.poster_url ? (
                  <img src={r.poster_url} alt="" className="w-10 h-14 rounded object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-14 rounded bg-muted flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{r.original_title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {r.rating && <span className="text-xs text-primary font-medium">⭐ {r.rating}</span>}
                    {r.release_date && <span className="text-xs text-muted-foreground">{r.release_date.slice(0, 4)}</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {selectedResult && (
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Selecionado: {selectedResult.title}</span>
            <button type="button" onClick={() => setSelectedResult(null)}><X className="w-3 h-3" /></button>
          </div>
        )}
      </div>

      {/* Basic Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Título</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do conteúdo" required />
        </div>
        <div className="space-y-2">
          <Label>Nota</Label>
          <Input type="number" step="0.1" min="0" max="10" value={rating} onChange={(e) => setRating(e.target.value)} placeholder="8.5" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Sinopse</Label>
        <Textarea value={sinopse} onChange={(e) => setSinopse(e.target.value)} placeholder="Descrição do conteúdo..." rows={3} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>URL do Poster</Label>
          <Input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://..." />
          {coverUrl && <img src={coverUrl} alt="Poster" className="w-14 h-20 rounded object-cover border border-border" />}
        </div>
        <div className="space-y-2">
          <Label>URL do Backdrop</Label>
          <Input value={backdropUrl} onChange={(e) => setBackdropUrl(e.target.value)} placeholder="https://..." />
          {backdropUrl && <img src={backdropUrl} alt="Backdrop" className="w-full h-20 rounded object-cover border border-border" />}
        </div>
      </div>

      <div className="space-y-2">
        <Label>URL do Trailer (YouTube)</Label>
        <Input value={trailerUrl} onChange={(e) => setTrailerUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
      </div>

      <div className="space-y-2">
        <Label>URL do Stream (mp4, m3u8)</Label>
        <Input value={streamUrl} onChange={(e) => setStreamUrl(e.target.value)} placeholder="URL do conteúdo completo ou 'pending'" />
      </div>

      {/* Monetization Section */}
      <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-4">
        <Label className="text-sm font-semibold text-amber-400">💰 Monetização</Label>
        
        <div className="space-y-2">
          <Label className="text-xs">Link do Checkout (botão de compra)</Label>
          <Input value={linkCheckout} onChange={(e) => setLinkCheckout(e.target.value)} placeholder="https://pay.hotmart.com/..." />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">Tempo para modal (segundos)</Label>
            <Input type="number" min="5" max="300" value={tempoAnuncio} onChange={(e) => setTempoAnuncio(e.target.value)} placeholder="30" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Imagem do anúncio (modal)</Label>
            <Input value={urlImagemAnuncio} onChange={(e) => setUrlImagemAnuncio(e.target.value)} placeholder="https://..." />
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isEditing ? "Atualizar Conteúdo" : "Adicionar Conteúdo"}
        </Button>
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>}
      </div>
    </form>
  );
};
