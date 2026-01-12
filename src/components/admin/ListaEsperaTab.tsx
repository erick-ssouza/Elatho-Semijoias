import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, Trash2, Mail, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ListaEsperaItem {
  id: string;
  produto_id: string;
  email: string;
  notificado: boolean;
  created_at: string;
}

interface Produto {
  id: string;
  nome: string;
  estoque: number | null;
}

const ListaEsperaTab = () => {
  const [listaEspera, setListaEspera] = useState<ListaEsperaItem[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduto, setSelectedProduto] = useState<string>("todos");
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [listaRes, produtosRes] = await Promise.all([
        supabase
          .from("lista_espera")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("produtos")
          .select("id, nome, estoque")
          .order("nome", { ascending: true }),
      ]);

      if (listaRes.error) throw listaRes.error;
      if (produtosRes.error) throw produtosRes.error;

      setListaEspera(listaRes.data || []);
      setProdutos(produtosRes.data || []);
    } catch (error) {
      console.error("Error fetching lista espera:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique products with waitlist count
  const produtosComEspera = useMemo(() => {
    const counts: Record<string, number> = {};
    listaEspera.forEach(item => {
      counts[item.produto_id] = (counts[item.produto_id] || 0) + 1;
    });
    
    return produtos
      .filter(p => counts[p.id])
      .map(p => ({
        ...p,
        waitlistCount: counts[p.id] || 0,
      }))
      .sort((a, b) => b.waitlistCount - a.waitlistCount);
  }, [listaEspera, produtos]);

  // Filtered list
  const filteredLista = useMemo(() => {
    if (selectedProduto === "todos") return listaEspera;
    return listaEspera.filter(item => item.produto_id === selectedProduto);
  }, [listaEspera, selectedProduto]);

  const getProdutoNome = (produtoId: string) => {
    const produto = produtos.find(p => p.id === produtoId);
    return produto?.nome || "Produto desconhecido";
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from("lista_espera")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setListaEspera(prev => prev.filter(item => item.id !== id));
      toast({ title: "Entrada removida da lista de espera" });
    } catch (error) {
      toast({ title: "Erro ao remover", variant: "destructive" });
    }
  };

  const exportCSV = () => {
    const dataToExport = filteredLista.map(item => ({
      produto: getProdutoNome(item.produto_id),
      email: item.email,
      data_cadastro: format(new Date(item.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }),
      notificado: item.notificado ? "Sim" : "Não",
    }));

    const headers = ["Produto", "E-mail", "Data Cadastro", "Notificado"];
    const csvContent = [
      headers.join(","),
      ...dataToExport.map(row => Object.values(row).map(v => `"${v}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `lista-espera-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();

    toast({ title: "Lista exportada com sucesso!" });
  };

  const markAsNotified = async (produtoId: string) => {
    try {
      const { error } = await supabase
        .from("lista_espera")
        .update({ notificado: true })
        .eq("produto_id", produtoId);

      if (error) throw error;

      setListaEspera(prev =>
        prev.map(item =>
          item.produto_id === produtoId ? { ...item, notificado: true } : item
        )
      );
      toast({ title: "Clientes marcados como notificados" });
    } catch (error) {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Lista de Espera
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={filteredLista.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Total na lista</p>
            <p className="text-2xl font-bold">{listaEspera.length}</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Produtos esgotados</p>
            <p className="text-2xl font-bold">{produtosComEspera.length}</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Aguardando aviso</p>
            <p className="text-2xl font-bold">{listaEspera.filter(i => !i.notificado).length}</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Já notificados</p>
            <p className="text-2xl font-bold">{listaEspera.filter(i => i.notificado).length}</p>
          </div>
        </div>

        {/* Filter by product */}
        <div className="flex items-center gap-4 mb-6">
          <Select value={selectedProduto} onValueChange={setSelectedProduto}>
            <SelectTrigger className="w-80">
              <SelectValue placeholder="Filtrar por produto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os produtos ({listaEspera.length})</SelectItem>
              {produtosComEspera.map(produto => (
                <SelectItem key={produto.id} value={produto.id}>
                  {produto.nome} ({produto.waitlistCount})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedProduto !== "todos" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAsNotified(selectedProduto)}
            >
              <Mail className="w-4 h-4 mr-2" />
              Marcar como notificados
            </Button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Data Cadastro</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLista.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum cliente na lista de espera
                  </TableCell>
                </TableRow>
              ) : (
                filteredLista.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{getProdutoNome(item.produto_id)}</TableCell>
                    <TableCell>{item.email}</TableCell>
                    <TableCell>
                      {format(new Date(item.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {item.notificado ? (
                        <Badge variant="secondary">Notificado</Badge>
                      ) : (
                        <Badge variant="outline">Aguardando</Badge>
                      )}
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
                            <AlertDialogTitle>Remover da lista?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteItem(item.id)}>
                              Remover
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

export default ListaEsperaTab;
