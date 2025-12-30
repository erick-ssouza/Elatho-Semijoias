import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Package, CheckCircle, Truck, Clock, MapPin, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { toast } from "sonner";

interface Pedido {
  id: string;
  numero_pedido: string;
  status: string;
  codigo_rastreio: string | null;
  created_at: string;
  itens: { nome: string; quantidade: number }[];
}

interface HistoricoItem {
  id: string;
  status_novo: string;
  created_at: string;
}

const statusConfig: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  pendente: { label: "Pendente", icon: Clock, color: "text-yellow-600" },
  confirmado: { label: "Confirmado", icon: CheckCircle, color: "text-blue-600" },
  enviado: { label: "Enviado", icon: Truck, color: "text-purple-600" },
  entregue: { label: "Entregue", icon: MapPin, color: "text-green-600" },
  cancelado: { label: "Cancelado", icon: Package, color: "text-destructive" },
};

const statusOrder = ["pendente", "confirmado", "enviado", "entregue"];

export default function Rastreio() {
  const [numeroPedido, setNumeroPedido] = useState("");
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!numeroPedido.trim()) {
      toast.error("Digite o número do pedido");
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      // Fetch order
      const { data: pedidoData, error: pedidoError } = await supabase
        .from("pedidos")
        .select("id, numero_pedido, status, codigo_rastreio, created_at, itens")
        .eq("numero_pedido", numeroPedido.trim().toUpperCase())
        .maybeSingle();

      if (pedidoError) throw pedidoError;

      if (!pedidoData) {
        setPedido(null);
        setHistorico([]);
        return;
      }

      setPedido(pedidoData as Pedido);

      // Fetch status history
      const { data: historicoData } = await supabase
        .from("pedidos_historico")
        .select("id, status_novo, created_at")
        .eq("pedido_id", pedidoData.id)
        .order("created_at", { ascending: true });

      setHistorico(historicoData || []);
    } catch (error) {
      console.error("Error fetching order:", error);
      toast.error("Erro ao buscar pedido");
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStatusIndex = () => {
    if (!pedido) return -1;
    return statusOrder.indexOf(pedido.status);
  };

  return (
    <>
      <Helmet>
        <title>Rastrear Pedido | Elatho Semijoias</title>
        <meta name="description" content="Rastreie seu pedido Elatho Semijoias. Acompanhe o status da entrega em tempo real." />
      </Helmet>

      <Navbar />
      
      <main className="pt-24 pb-16 min-h-screen">
        <div className="container mx-auto px-6">
          <Breadcrumbs items={[{ label: "Rastrear Pedido" }]} />

          <h1 className="text-3xl md:text-4xl font-display text-center mb-8">
            Rastrear Pedido
          </h1>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="max-w-md mx-auto mb-12">
            <div className="flex gap-2">
              <input
                type="text"
                value={numeroPedido}
                onChange={(e) => setNumeroPedido(e.target.value)}
                placeholder="Ex: ELA-20250101-001"
                className="input-minimal flex-1"
              />
              <button
                type="submit"
                disabled={loading}
                className="btn-minimal"
              >
                {loading ? "Buscando..." : "Buscar"}
              </button>
            </div>
          </form>

          {/* Results */}
          {searched && !loading && (
            <div className="max-w-2xl mx-auto">
              {!pedido ? (
                <div className="text-center py-12 bg-muted/30 rounded">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Nenhum pedido encontrado com o número informado.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Verifique se digitou corretamente (ex: ELA-20250101-001)
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Order Info */}
                  <div className="p-6 border border-border">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                          Pedido
                        </p>
                        <p className="font-medium">{pedido.numero_pedido}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                          Data
                        </p>
                        <p className="text-sm">
                          {format(new Date(pedido.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="border-t border-border pt-4">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                        Itens
                      </p>
                      {Array.isArray(pedido.itens) && pedido.itens.map((item, index) => (
                        <p key={index} className="text-sm">
                          {item.quantidade}x {item.nome}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Status Timeline */}
                  <div className="p-6 border border-border">
                    <h2 className="text-lg font-display mb-6">Status do Pedido</h2>
                    
                    {pedido.status === "cancelado" ? (
                      <div className="flex items-center gap-3 text-destructive">
                        <Package className="h-5 w-5" />
                        <span>Pedido cancelado</span>
                      </div>
                    ) : (
                      <div className="relative">
                        {/* Progress line */}
                        <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                        
                        {statusOrder.map((status, index) => {
                          const config = statusConfig[status];
                          const Icon = config.icon;
                          const isCompleted = index <= getCurrentStatusIndex();
                          const isCurrent = index === getCurrentStatusIndex();
                          
                          // Find history entry for this status
                          const historyEntry = historico.find(h => h.status_novo === status);
                          
                          return (
                            <div key={status} className="relative flex items-start gap-4 pb-6 last:pb-0">
                              <div
                                className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                                  isCompleted
                                    ? "bg-foreground text-background"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 pt-1">
                                <p className={`font-medium ${isCurrent ? config.color : ""}`}>
                                  {config.label}
                                </p>
                                {historyEntry && (
                                  <p className="text-xs text-muted-foreground">
                                    {format(new Date(historyEntry.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Tracking Code */}
                  {pedido.codigo_rastreio && (
                    <div className="p-6 border border-border">
                      <h2 className="text-lg font-display mb-4">Código de Rastreio</h2>
                      <div className="flex items-center gap-4">
                        <code className="px-3 py-2 bg-muted text-sm">
                          {pedido.codigo_rastreio}
                        </code>
                        <a
                          href={`https://rastreamento.correios.com.br/app/index.php?objetos=${pedido.codigo_rastreio}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Rastrear nos Correios
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
