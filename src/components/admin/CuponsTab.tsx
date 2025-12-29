import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2, Ticket } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Cupom {
  id: string;
  codigo: string;
  tipo: string;
  valor: number;
  valor_minimo: number;
  uso_maximo: number | null;
  uso_atual: number;
  ativo: boolean;
  validade: string | null;
  created_at: string;
}

const CuponsTab = () => {
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCupom, setEditingCupom] = useState<Cupom | null>(null);
  const [formData, setFormData] = useState({
    codigo: "",
    tipo: "percentual",
    valor: "",
    valor_minimo: "",
    uso_maximo: "",
    validade: "",
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCupons();
  }, []);

  const fetchCupons = async () => {
    try {
      const { data, error } = await supabase
        .from("cupons")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCupons(data || []);
    } catch (error) {
      console.error("Error fetching cupons:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      codigo: "",
      tipo: "percentual",
      valor: "",
      valor_minimo: "",
      uso_maximo: "",
      validade: "",
    });
    setEditingCupom(null);
  };

  const openEditDialog = (cupom: Cupom) => {
    setEditingCupom(cupom);
    setFormData({
      codigo: cupom.codigo,
      tipo: cupom.tipo,
      valor: cupom.valor.toString(),
      valor_minimo: cupom.valor_minimo?.toString() || "",
      uso_maximo: cupom.uso_maximo?.toString() || "",
      validade: cupom.validade ? cupom.validade.split("T")[0] : "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const cupomData = {
        codigo: formData.codigo.toUpperCase().trim(),
        tipo: formData.tipo,
        valor: parseFloat(formData.valor),
        valor_minimo: formData.valor_minimo ? parseFloat(formData.valor_minimo) : 0,
        uso_maximo: formData.uso_maximo ? parseInt(formData.uso_maximo) : null,
        validade: formData.validade ? new Date(formData.validade).toISOString() : null,
      };

      if (editingCupom) {
        const { error } = await supabase
          .from("cupons")
          .update(cupomData)
          .eq("id", editingCupom.id);

        if (error) throw error;
        toast({ title: "Cupom atualizado!" });
      } else {
        const { error } = await supabase.from("cupons").insert(cupomData);
        if (error) throw error;
        toast({ title: "Cupom criado!" });
      }

      setDialogOpen(false);
      resetForm();
      fetchCupons();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar cupom",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleAtivo = async (id: string, ativo: boolean) => {
    try {
      const { error } = await supabase
        .from("cupons")
        .update({ ativo: !ativo })
        .eq("id", id);

      if (error) throw error;
      setCupons((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ativo: !ativo } : c))
      );
      toast({ title: ativo ? "Cupom desativado" : "Cupom ativado" });
    } catch (error) {
      toast({ title: "Erro ao atualizar cupom", variant: "destructive" });
    }
  };

  const deleteCupom = async (id: string) => {
    try {
      const { error } = await supabase.from("cupons").delete().eq("id", id);
      if (error) throw error;
      setCupons((prev) => prev.filter((c) => c.id !== id));
      toast({ title: "Cupom excluído!" });
    } catch (error) {
      toast({ title: "Erro ao excluir cupom", variant: "destructive" });
    }
  };

  const isExpired = (validade: string | null) => {
    if (!validade) return false;
    return new Date(validade) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Ticket className="w-5 h-5" />
          Gerenciar Cupons
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Cupom
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCupom ? "Editar Cupom" : "Novo Cupom"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="codigo">Código do Cupom</Label>
                <Input
                  id="codigo"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  placeholder="EX: DESCONTO10"
                  required
                  className="uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Desconto</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value: "percentual" | "fixo") =>
                      setFormData({ ...formData, tipo: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentual">Percentual (%)</SelectItem>
                      <SelectItem value="fixo">Valor Fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor">
                    {formData.tipo === "percentual" ? "Desconto (%)" : "Desconto (R$)"}
                  </Label>
                  <Input
                    id="valor"
                    type="number"
                    step={formData.tipo === "percentual" ? "1" : "0.01"}
                    min="0"
                    max={formData.tipo === "percentual" ? "100" : undefined}
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor_minimo">Valor Mínimo (R$)</Label>
                  <Input
                    id="valor_minimo"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valor_minimo}
                    onChange={(e) => setFormData({ ...formData, valor_minimo: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="uso_maximo">Uso Máximo</Label>
                  <Input
                    id="uso_maximo"
                    type="number"
                    min="1"
                    value={formData.uso_maximo}
                    onChange={(e) => setFormData({ ...formData, uso_maximo: e.target.value })}
                    placeholder="Ilimitado"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="validade">Validade</Label>
                <Input
                  id="validade"
                  type="date"
                  value={formData.validade}
                  onChange={(e) => setFormData({ ...formData, validade: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Deixe em branco para cupom sem validade
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingCupom ? "Salvar Alterações" : "Criar Cupom"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Desconto</TableHead>
                <TableHead>Mínimo</TableHead>
                <TableHead>Uso</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cupons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum cupom cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                cupons.map((cupom) => (
                  <TableRow key={cupom.id}>
                    <TableCell className="font-mono font-bold">
                      {cupom.codigo}
                    </TableCell>
                    <TableCell>
                      {cupom.tipo === "percentual"
                        ? `${cupom.valor}%`
                        : `R$ ${Number(cupom.valor).toFixed(2)}`}
                    </TableCell>
                    <TableCell>
                      R$ {Number(cupom.valor_minimo).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {cupom.uso_atual} / {cupom.uso_maximo || "∞"}
                    </TableCell>
                    <TableCell>
                      {cupom.validade ? (
                        <span className={isExpired(cupom.validade) ? "text-red-500" : ""}>
                          {format(new Date(cupom.validade), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Sem validade</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={cupom.ativo}
                          onCheckedChange={() => toggleAtivo(cupom.id, cupom.ativo)}
                        />
                        {cupom.ativo && !isExpired(cupom.validade) ? (
                          <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                        ) : isExpired(cupom.validade) ? (
                          <Badge className="bg-red-100 text-red-800">Expirado</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">Inativo</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openEditDialog(cupom)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon">
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir cupom?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteCupom(cupom.id)}>
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default CuponsTab;
