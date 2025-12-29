import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, Trash2, Phone, Download, FileText, Package } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  codigo_rastreio: string | null;
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
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [trackingCode, setTrackingCode] = useState("");
  const [pendingStatusChange, setPendingStatusChange] = useState<{ id: string; status: string } | null>(null);
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

  const handleStatusChange = (id: string, newStatus: string) => {
    if (newStatus === "enviado") {
      const pedido = pedidos.find((p) => p.id === id);
      setPendingStatusChange({ id, status: newStatus });
      setTrackingCode(pedido?.codigo_rastreio || "");
      setTrackingModalOpen(true);
    } else {
      updateStatus(id, newStatus);
    }
  };

  const confirmTrackingAndUpdateStatus = async () => {
    if (!pendingStatusChange) return;

    const { id, status } = pendingStatusChange;
    const pedido = pedidos.find((p) => p.id === id);
    if (!pedido) return;

    const previousStatus = pedido.status;

    try {
      const { error } = await supabase
        .from("pedidos")
        .update({ status, codigo_rastreio: trackingCode || null })
        .eq("id", id);

      if (error) throw error;

      setPedidos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status, codigo_rastreio: trackingCode || null } : p))
      );
      onUpdate();
      toast({ title: "Status atualizado!" });

      // Send email notification if customer has email
      if (pedido.cliente_email) {
        try {
          await supabase.functions.invoke("send-status-update-email", {
            body: {
              numeroPedido: pedido.numero_pedido,
              clienteNome: pedido.cliente_nome,
              clienteEmail: pedido.cliente_email,
              novoStatus: status,
              statusAnterior: previousStatus,
              codigoRastreio: trackingCode || null,
            },
          });
          toast({ title: "Email de notificação enviado!" });
        } catch (emailError) {
          console.error("Error sending status update email:", emailError);
        }
      }
    } catch (error) {
      toast({ title: "Erro ao atualizar status", variant: "destructive" });
    } finally {
      setTrackingModalOpen(false);
      setTrackingCode("");
      setPendingStatusChange(null);
    }
  };

  const updateStatus = async (id: string, newStatus: string, codigoRastreio?: string) => {
    const pedido = pedidos.find((p) => p.id === id);
    if (!pedido) return;

    const previousStatus = pedido.status;

    try {
      const updateData: { status: string; codigo_rastreio?: string | null } = { status: newStatus };
      if (codigoRastreio !== undefined) {
        updateData.codigo_rastreio = codigoRastreio || null;
      }

      const { error } = await supabase
        .from("pedidos")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      setPedidos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
      );
      onUpdate();
      toast({ title: "Status atualizado!" });

      // Send email notification if customer has email
      if (pedido.cliente_email) {
        try {
          await supabase.functions.invoke("send-status-update-email", {
            body: {
              numeroPedido: pedido.numero_pedido,
              clienteNome: pedido.cliente_nome,
              clienteEmail: pedido.cliente_email,
              novoStatus: newStatus,
              statusAnterior: previousStatus,
              codigoRastreio: codigoRastreio || pedido.codigo_rastreio || null,
            },
          });
          toast({ title: "Email de notificação enviado!" });
        } catch (emailError) {
          console.error("Error sending status update email:", emailError);
        }
      }
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

  const exportToCSV = () => {
    const dataToExport = filteredPedidos;
    if (dataToExport.length === 0) {
      toast({ title: "Nenhum pedido para exportar", variant: "destructive" });
      return;
    }

    const headers = ["Número", "Cliente", "Email", "WhatsApp", "Subtotal", "Frete", "Total", "Status", "Data"];
    const rows = dataToExport.map((p) => [
      p.numero_pedido,
      p.cliente_nome,
      p.cliente_email || "",
      p.cliente_whatsapp || "",
      Number(p.subtotal).toFixed(2),
      Number(p.frete).toFixed(2),
      Number(p.total).toFixed(2),
      p.status,
      format(new Date(p.created_at), "dd/MM/yyyy HH:mm"),
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(";")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pedidos_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({ title: "CSV exportado com sucesso!" });
  };

  const exportToPDF = () => {
    const dataToExport = filteredPedidos;
    if (dataToExport.length === 0) {
      toast({ title: "Nenhum pedido para exportar", variant: "destructive" });
      return;
    }

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text("Relatório de Pedidos", 14, 22);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, 30);
    doc.text(`Total de pedidos: ${dataToExport.length}`, 14, 36);

    // Table
    const tableData = dataToExport.map((p) => [
      `#${p.numero_pedido}`,
      p.cliente_nome,
      `R$ ${Number(p.total).toFixed(2)}`,
      p.status,
      format(new Date(p.created_at), "dd/MM/yyyy"),
    ]);

    autoTable(doc, {
      startY: 42,
      head: [["Número", "Cliente", "Total", "Status", "Data"]],
      body: tableData,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [139, 92, 246] },
    });

    doc.save(`pedidos_${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast({ title: "PDF exportado com sucesso!" });
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
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <CardTitle>Gerenciar Pedidos</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-1" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportToPDF}>
            <FileText className="w-4 h-4 mr-1" />
            PDF
          </Button>
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
        </div>
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
                        onValueChange={(value) => handleStatusChange(pedido.id, value)}
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

      {/* Tracking Code Modal */}
      <Dialog open={trackingModalOpen} onOpenChange={setTrackingModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Código de Rastreio
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Informe o código de rastreio para enviar junto com a notificação ao cliente.
            </p>
            <div className="space-y-2">
              <Label htmlFor="tracking-code">Código de Rastreio (opcional)</Label>
              <Input
                id="tracking-code"
                placeholder="Ex: BR123456789BR"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setTrackingModalOpen(false);
              setTrackingCode("");
              setPendingStatusChange(null);
            }}>
              Cancelar
            </Button>
            <Button onClick={confirmTrackingAndUpdateStatus}>
              Confirmar Envio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default PedidosTab;
