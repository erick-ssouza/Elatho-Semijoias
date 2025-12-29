import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, Trash2, Phone } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Pedido {
  id: string;
  numero_pedido: string;
  cliente_nome: string;
  cliente_whatsapp: string | null;
  cliente_email: string | null;
  total: number;
  subtotal: number;
  frete: number;
  status: string;
  created_at: string;
  itens: unknown;
  endereco: unknown;
}

interface PedidosTabProps {
  onUpdate: () => void;
}

const statusColors: Record<string, string> = {
  pendente: "bg-amber-100 text-amber-800",
  confirmado: "bg-blue-100 text-blue-800",
  enviado: "bg-purple-100 text-purple-800",
  entregue: "bg-green-100 text-green-800",
  cancelado: "bg-red-100 text-red-800",
};

const PedidosTab = ({ onUpdate }: PedidosTabProps) => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPedidos();
  }, []);

  const fetchPedidos = async () => {
    try {
      const { data, error } = await supabase
        .from("pedidos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPedidos(data || []);
    } catch (error) {
      console.error("Error fetching pedidos:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("pedidos")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      setPedidos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
      );
      onUpdate();
      toast({ title: "Status atualizado!" });
    } catch (error) {
      toast({ title: "Erro ao atualizar status", variant: "destructive" });
    }
  };

  const deletePedido = async (id: string) => {
    try {
      const { error } = await supabase.from("pedidos").delete().eq("id", id);
      if (error) throw error;

      setPedidos((prev) => prev.filter((p) => p.id !== id));
      onUpdate();
      toast({ title: "Pedido excluído!" });
    } catch (error) {
      toast({ title: "Erro ao excluir pedido", variant: "destructive" });
    }
  };

  const filteredPedidos = filterStatus === "todos"
    ? pedidos
    : pedidos.filter((p) => p.status === filterStatus);

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
        <CardTitle>Gerenciar Pedidos</CardTitle>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="confirmado">Confirmado</SelectItem>
            <SelectItem value="enviado">Enviado</SelectItem>
            <SelectItem value="entregue">Entregue</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPedidos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum pedido encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredPedidos.map((pedido) => (
                  <TableRow key={pedido.id}>
                    <TableCell className="font-mono font-medium">
                      #{pedido.numero_pedido}
                    </TableCell>
                    <TableCell>{pedido.cliente_nome}</TableCell>
                    <TableCell>
                      {pedido.cliente_whatsapp && (
                        <a
                          href={`https://wa.me/55${pedido.cliente_whatsapp.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-green-600 hover:underline"
                        >
                          <Phone className="w-3 h-3" />
                          {pedido.cliente_whatsapp}
                        </a>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      R$ {Number(pedido.total).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={pedido.status}
                        onValueChange={(value) => updateStatus(pedido.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <Badge className={statusColors[pedido.status] || ""}>
                            {pedido.status}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="confirmado">Confirmado</SelectItem>
                          <SelectItem value="enviado">Enviado</SelectItem>
                          <SelectItem value="entregue">Entregue</SelectItem>
                          <SelectItem value="cancelado">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {format(new Date(pedido.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setSelectedPedido(pedido)}
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
                              <AlertDialogTitle>Excluir pedido?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deletePedido(pedido.id)}>
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

      {/* Details Modal */}
      <Dialog open={!!selectedPedido} onOpenChange={() => setSelectedPedido(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido #{selectedPedido?.numero_pedido}</DialogTitle>
          </DialogHeader>
          {selectedPedido && (
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">Cliente</h4>
                <p>{selectedPedido.cliente_nome}</p>
                {selectedPedido.cliente_email && <p className="text-muted-foreground">{selectedPedido.cliente_email}</p>}
                {selectedPedido.cliente_whatsapp && <p className="text-muted-foreground">{selectedPedido.cliente_whatsapp}</p>}
              </div>

              {selectedPedido.endereco && (
                <div>
                  <h4 className="font-medium mb-2">Endereço de Entrega</h4>
                  {(() => {
                    const endereco = selectedPedido.endereco as Record<string, string>;
                    return (
                      <>
                        <p>
                          {endereco.logradouro}, {endereco.numero}
                          {endereco.complemento && ` - ${endereco.complemento}`}
                        </p>
                        <p>{endereco.bairro}</p>
                        <p>
                          {endereco.cidade} - {endereco.estado}
                        </p>
                        <p>CEP: {endereco.cep}</p>
                      </>
                    );
                  })()}
                </div>
              )}

              <div>
                <h4 className="font-medium mb-2">Itens do Pedido</h4>
                <div className="space-y-2">
                  {(selectedPedido.itens as any[]).map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-2 bg-muted rounded">
                      <div>
                        <p className="font-medium">{item.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.variacao} • Qtd: {item.quantidade}
                        </p>
                      </div>
                      <p className="font-medium">R$ {(item.preco * item.quantidade).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>R$ {Number(selectedPedido.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Frete:</span>
                  <span>R$ {Number(selectedPedido.frete).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>R$ {Number(selectedPedido.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default PedidosTab;
