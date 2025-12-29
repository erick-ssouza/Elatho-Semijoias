import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Star } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Depoimento {
  id: string;
  cliente_nome: string;
  texto: string;
  nota: number;
  aprovado: boolean;
  resposta_admin: string | null;
  created_at: string;
}

const DepoimentosTab = () => {
  const [depoimentos, setDepoimentos] = useState<Depoimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingResposta, setEditingResposta] = useState<{ id: string; resposta: string } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchDepoimentos();
  }, []);

  const fetchDepoimentos = async () => {
    try {
      // Admin can see all depoimentos regardless of aprovado status
      const { data, error } = await supabase
        .from("depoimentos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDepoimentos(data || []);
    } catch (error) {
      console.error("Error fetching depoimentos:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAprovado = async (id: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from("depoimentos")
        .update({ aprovado: !currentValue })
        .eq("id", id);
      if (error) throw error;
      setDepoimentos((prev) =>
        prev.map((d) => (d.id === id ? { ...d, aprovado: !currentValue } : d))
      );
      toast({ title: !currentValue ? "Depoimento aprovado!" : "Depoimento reprovado!" });
    } catch (error) {
      toast({ title: "Erro ao atualizar depoimento", variant: "destructive" });
    }
  };

  const saveResposta = async () => {
    if (!editingResposta) return;

    try {
      const { error } = await supabase
        .from("depoimentos")
        .update({ resposta_admin: editingResposta.resposta })
        .eq("id", editingResposta.id);
      if (error) throw error;
      setDepoimentos((prev) =>
        prev.map((d) =>
          d.id === editingResposta.id
            ? { ...d, resposta_admin: editingResposta.resposta }
            : d
        )
      );
      setEditingResposta(null);
      toast({ title: "Resposta salva!" });
    } catch (error) {
      toast({ title: "Erro ao salvar resposta", variant: "destructive" });
    }
  };

  const deleteDepoimento = async (id: string) => {
    try {
      const { error } = await supabase.from("depoimentos").delete().eq("id", id);
      if (error) throw error;
      setDepoimentos((prev) => prev.filter((d) => d.id !== id));
      toast({ title: "Depoimento excluído!" });
    } catch (error) {
      toast({ title: "Erro ao excluir depoimento", variant: "destructive" });
    }
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
      <CardHeader>
        <CardTitle>Gerenciar Depoimentos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Texto</TableHead>
                <TableHead>Nota</TableHead>
                <TableHead>Aprovado</TableHead>
                <TableHead>Resposta</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {depoimentos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum depoimento encontrado
                  </TableCell>
                </TableRow>
              ) : (
                depoimentos.map((depoimento) => (
                  <TableRow key={depoimento.id}>
                    <TableCell className="font-medium">{depoimento.cliente_nome}</TableCell>
                    <TableCell className="max-w-xs">
                      <p className="truncate" title={depoimento.texto}>
                        {depoimento.texto}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < depoimento.nota ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={depoimento.aprovado}
                        onCheckedChange={() => toggleAprovado(depoimento.id, depoimento.aprovado)}
                      />
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {editingResposta?.id === depoimento.id ? (
                        <div className="flex gap-2">
                          <Input
                            value={editingResposta.resposta}
                            onChange={(e) =>
                              setEditingResposta({ ...editingResposta, resposta: e.target.value })
                            }
                            className="text-sm"
                          />
                          <Button size="sm" onClick={saveResposta}>
                            Salvar
                          </Button>
                        </div>
                      ) : (
                        <p
                          className="truncate cursor-pointer hover:text-primary"
                          title={depoimento.resposta_admin || "Clique para adicionar resposta"}
                          onClick={() =>
                            setEditingResposta({
                              id: depoimento.id,
                              resposta: depoimento.resposta_admin || "",
                            })
                          }
                        >
                          {depoimento.resposta_admin || (
                            <span className="text-muted-foreground italic">Adicionar resposta...</span>
                          )}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(depoimento.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="icon">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir depoimento?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteDepoimento(depoimento.id)}>
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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

export default DepoimentosTab;
