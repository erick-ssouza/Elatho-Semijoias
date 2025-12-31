import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Eye, Trash2, Phone } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Cliente {
  id: string;
  nome: string;
  email: string | null;
  whatsapp: string | null;
  cpf: string | null;
  created_at: string;
}

interface Pedido {
  id: string;
  numero_pedido: string;
  total: number;
  status: string;
  created_at: string;
}

const ClientesTab = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [clientePedidos, setClientePedidos] = useState<Pedido[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      // Debug: check auth session
      const { data: sessionData } = await supabase.auth.getSession();
      console.log("[ClientesTab] Sessão atual:", sessionData?.session?.user?.email || "NÃO AUTENTICADO");
      
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .order("created_at", { ascending: false });

      console.log("[ClientesTab] Clientes retornados:", data?.length || 0, "registros");
      if (error) {
        console.error("[ClientesTab] Erro:", error);
        throw error;
      }
      setClientes(data || []);
    } catch (error) {
      console.error("[ClientesTab] Error fetching clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  const viewClientePedidos = async (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setLoadingPedidos(true);

    try {
      const { data, error } = await supabase
        .from("pedidos")
        .select("id, numero_pedido, total, status, created_at")
        .or(`cliente_nome.ilike.%${cliente.nome}%,cliente_email.eq.${cliente.email}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setClientePedidos(data || []);
    } catch (error) {
      console.error("Error fetching pedidos:", error);
    } finally {
      setLoadingPedidos(false);
    }
  };

  const deleteCliente = async (id: string) => {
    try {
      const { error } = await supabase.from("clientes").delete().eq("id", id);
      if (error) throw error;
      setClientes((prev) => prev.filter((c) => c.id !== id));
      toast({ title: "Cliente excluído!" });
    } catch (error) {
      toast({ title: "Erro ao excluir cliente", variant: "destructive" });
    }
  };

  const filteredClientes = clientes.filter(
    (c) =>
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

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
        <CardTitle>Gerenciar Clientes</CardTitle>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Data de Cadastro</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum cliente encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredClientes.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell className="font-medium">{cliente.nome}</TableCell>
                    <TableCell>{cliente.email || "-"}</TableCell>
                    <TableCell>
                      {cliente.whatsapp ? (
                        <a
                          href={`https://wa.me/55${cliente.whatsapp.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-green-600 hover:underline"
                        >
                          <Phone className="w-3 h-3" />
                          {cliente.whatsapp}
                        </a>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(cliente.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => viewClientePedidos(cliente)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon">
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteCliente(cliente.id)}>
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

      {/* Pedidos Modal */}
      <Dialog open={!!selectedCliente} onOpenChange={() => setSelectedCliente(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pedidos de {selectedCliente?.nome}</DialogTitle>
          </DialogHeader>
          {loadingPedidos ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : clientePedidos.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum pedido encontrado para este cliente
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientePedidos.map((pedido) => (
                  <TableRow key={pedido.id}>
                    <TableCell className="font-mono">#{pedido.numero_pedido}</TableCell>
                    <TableCell>R$ {Number(pedido.total).toFixed(2)}</TableCell>
                    <TableCell className="capitalize">{pedido.status}</TableCell>
                    <TableCell>
                      {format(new Date(pedido.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ClientesTab;
