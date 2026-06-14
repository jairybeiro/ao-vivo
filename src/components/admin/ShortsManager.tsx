import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Film } from "lucide-react";

interface Short {
  id: string;
  title: string;
  cover_url: string | null;
  media_url: string;
  is_active: boolean;
  display_order: number;
}

const emptyForm = { title: "", cover_url: "", media_url: "", is_active: true, display_order: 0 };

export const ShortsManager = () => {
  const [items, setItems] = useState<Short[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Short | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("shorts")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (!error) setItems(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (s: Short) => {
    setEditing(s);
    setForm({
      title: s.title,
      cover_url: s.cover_url ?? "",
      media_url: s.media_url,
      is_active: s.is_active,
      display_order: s.display_order,
    });
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.media_url.trim()) {
      toast({ title: "Preencha título e link da mídia", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      cover_url: form.cover_url.trim() || null,
      media_url: form.media_url.trim(),
      is_active: form.is_active,
      display_order: Number(form.display_order) || 0,
    };
    const { error } = editing
      ? await supabase.from("shorts").update(payload).eq("id", editing.id)
      : await supabase.from("shorts").insert(payload);
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar short", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: editing ? "Short atualizado" : "Short criado" });
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
    fetchItems();
  };

  const remove = async (s: Short) => {
    if (!confirm(`Excluir "${s.title}"?`)) return;
    const { error } = await supabase.from("shorts").delete().eq("id", s.id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
      return;
    }
    fetchItems();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <p className="text-sm text-muted-foreground">
          Publique vídeos curtos verticais (estilo Shorts/Reels). Suporta MP4 e HLS (.m3u8).
        </p>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" /> Novo Short
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editing ? "Editar Short" : "Novo Short"}</CardTitle>
            <CardDescription>Informe título, capa e link da mídia (vertical).</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex: Ronaldinho Gaúcho — Drible histórico"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Link da capa / miniatura</Label>
                <Input
                  value={form.cover_url}
                  onChange={(e) => setForm({ ...form, cover_url: e.target.value })}
                  placeholder="https://...jpg"
                />
              </div>
              <div className="space-y-2">
                <Label>Link da mídia (MP4 ou .m3u8)</Label>
                <Input
                  value={form.media_url}
                  onChange={(e) => setForm({ ...form, media_url: e.target.value })}
                  placeholder="https://.../video.mp4 ou .../stream.m3u8"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ordem</Label>
                  <Input
                    type="number"
                    value={form.display_order}
                    onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ativo</Label>
                  <div className="flex items-center h-10">
                    <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setEditing(null); }}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Film className="w-4 h-4" /> Shorts Cadastrados</CardTitle>
          <CardDescription>{items.length} item(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-muted-foreground py-8">Carregando...</div>
          ) : items.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">Nenhum short cadastrado</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Capa</th>
                    <th className="text-left py-2 px-2">Título</th>
                    <th className="text-left py-2 px-2">Ordem</th>
                    <th className="text-left py-2 px-2">Ativo</th>
                    <th className="text-left py-2 px-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((s) => (
                    <tr key={s.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-2">
                        {s.cover_url ? (
                          <img src={s.cover_url} alt={s.title} className="w-10 h-14 object-cover rounded" />
                        ) : (
                          <div className="w-10 h-14 bg-muted rounded flex items-center justify-center">
                            <Film className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-2 font-medium">{s.title}</td>
                      <td className="py-2 px-2 text-muted-foreground">{s.display_order}</td>
                      <td className="py-2 px-2">{s.is_active ? "Sim" : "Não"}</td>
                      <td className="py-2 px-2 flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(s)}>
                          <Pencil className="w-3 h-3 mr-1" /> Editar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => remove(s)}>
                          <Trash2 className="w-3 h-3 mr-1" /> Excluir
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
    </div>
  );
};

export default ShortsManager;