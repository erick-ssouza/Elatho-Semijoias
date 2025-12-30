import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Package, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { OrderSkeleton } from "@/components/ui/skeletons";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface Pedido {
  id: string;
  numero_pedido: string;
  status: string;
  total: number;
  codigo_rastreio: string | null;
  created_at: string;
  itens: { nome: string; quantidade: number; preco: number; variacao?: string }[];
  endereco: { rua: string; numero: string; bairro: string; cidade: string; estado: string; cep: string } | null;
}

const statusLabels: Record<string, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

const statusColors: Record<string, string> = {
  pendente: "bg-yellow-100 text-yellow-800",
  confirmado: "bg-blue-100 text-blue-800",
  enviado: "bg-purple-100 text-purple-800",
  entregue: "bg-green-100 text-green-800",
  cancelado: "bg-red-100 text-red-800",
};

export default function MeusPedidos() {
  const [email, setEmail] = useState("");
  const [numeroPedido, setNumeroPedido] = useState("");
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("Digite seu email");
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      let query = supabase
        .from("pedidos")
        .select("id, numero_pedido, status, total, codigo_rastreio, created_at, itens, endereco")
        .eq("cliente_email", email.trim().toLowerCase())
        .order("created_at", { ascending: false });

      if (numeroPedido.trim()) {
        query = query.eq("numero_pedido", numeroPedido.trim().toUpperCase());
      }

      const { data, error } = await query;

      if (error) throw error;

      setPedidos((data as Pedido[]) || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Erro ao buscar pedidos");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) =>
    price.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

  return (
    <>
      <Helmet>
        <title>Meus Pedidos | Elatho Semijoias</title>
        <meta name="description" content="Consulte seus pedidos Elatho Semijoias. Veja o histórico de compras e acompanhe suas entregas." />
      </Helmet>

      <Navbar />
      
      <main className="pt-24 pb-16 min-h-screen">
        <div className="container mx-auto px-6">
          <Breadcrumbs items={[{ label: "Meus Pedidos" }]} />

          <h1 className="text-3xl md:text-4xl font-display text-center mb-8">
            Meus Pedidos
          </h1>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="max-w-md mx-auto mb-12 space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Seu email *"
              className="input-minimal w-full"
              required
            />
            <input
              type="text"
              value={numeroPedido}
              onChange={(e) => setNumeroPedido(e.target.value)}
              placeholder="Número do pedido (opcional)"
              className="input-minimal w-full"
            />
            <button
              type="submit"
              disabled={loading}
              className="btn-minimal w-full"
            >
              {loading ? "Buscando..." : "Buscar Pedidos"}
            </button>
          </form>

          {/* Results */}
          {loading && searched && (
            <div className="max-w-3xl mx-auto">
              <OrderSkeleton count={3} />
            </div>
          )}

          {searched && !loading && (
            <div className="max-w-3xl mx-auto">
              {pedidos.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Nenhum pedido encontrado para este email.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pedidos.map((pedido) => (
                    <div key={pedido.id} className="border border-border">
                      {/* Header */}
                      <button
                        onClick={() => setExpandedId(expandedId === pedido.id ? null : pedido.id)}
                        className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <Package className="h-5 w-5 text-muted-foreground" />
                          <div className="text-left">
                            <p className="font-medium">{pedido.numero_pedido}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(pedido.created_at), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <span className={`px-2 py-1 text-xs rounded ${statusColors[pedido.status]}`}>
                            {statusLabels[pedido.status]}
                          </span>
                          <span className="font-medium">R$ {formatPrice(pedido.total)}</span>
                          {expandedId === pedido.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </button>

                      {/* Expanded Content */}
                      {expandedId === pedido.id && (
                        <div className="p-4 border-t border-border space-y-4">
                          {/* Items */}
                          <div>
                            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                              Itens
                            </p>
                            <div className="space-y-2">
                              {Array.isArray(pedido.itens) && pedido.itens.map((item, index) => (
                                <div key={index} className="flex justify-between text-sm">
                                  <span>
                                    {item.quantidade}x {item.nome}
                                    {item.variacao && (
                                      <span className="text-muted-foreground"> ({item.variacao})</span>
                                    )}
                                  </span>
                                  <span>R$ {formatPrice(item.preco * item.quantidade)}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Address */}
                          {pedido.endereco && (
                            <div>
                              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                                Endereço de Entrega
                              </p>
                              <p className="text-sm">
                                {pedido.endereco.rua}, {pedido.endereco.numero}
                                <br />
                                {pedido.endereco.bairro} - {pedido.endereco.cidade}/{pedido.endereco.estado}
                                <br />
                                CEP: {pedido.endereco.cep}
                              </p>
                            </div>
                          )}

                          {/* Tracking */}
                          {pedido.codigo_rastreio && (
                            <div>
                              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                                Rastreamento
                              </p>
                              <div className="flex items-center gap-4">
                                <code className="px-2 py-1 bg-muted text-sm">
                                  {pedido.codigo_rastreio}
                                </code>
                                <a
                                  href={`https://rastreamento.correios.com.br/app/index.php?objetos=${pedido.codigo_rastreio}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  Rastrear
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            </div>
                          )}

                          <Link
                            to={`/rastreio?pedido=${pedido.numero_pedido}`}
                            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            Ver timeline completa
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>
                      )}
                    </div>
                  ))}
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
