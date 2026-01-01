import { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  CheckCircle,
  Copy,
  Check,
  MessageCircle,
  Home,
  Package,
  MapPin,
  Clock,
  QrCode,
  Loader2,
  BadgeCheck,
  Timer,
  RefreshCw,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';

interface ItemPedido {
  nome: string;
  variacao?: string | null;
  quantidade: number;
  preco: number;
}

interface EnderecoPedido {
  cep: string;
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
}

interface LocationState {
  numeroPedido: string;
  total: number;
  subtotal: number;
  frete: number;
  desconto?: number;
  metodoPagamento: 'pix' | 'cartao';
  itens: ItemPedido[];
  endereco: EnderecoPedido;
  clienteNome: string;

  // PIX do Mercado Pago
  pixCopiaECola?: string;
  pixQrCodeBase64?: string;
  pixPaymentId?: string;
  pixExpirationDate?: string;
}

interface PedidoData {
  numeroPedido: string;
  total: number;
  subtotal: number;
  frete: number;
  desconto?: number;
  metodoPagamento: 'pix' | 'cartao';
  itens: ItemPedido[];
  endereco: EnderecoPedido;
  clienteNome: string;
  pixCopiaECola?: string;
  paymentStatus?: string;
  status?: string;
}

const PRAZO_ENTREGA = '7 a 15 dias úteis';

// Helper function to check if payment is confirmed
const isPaymentConfirmed = (status?: string | null, paymentStatus?: string | null): boolean => {
  const confirmedStatuses = ['confirmado', 'pago', 'approved', 'enviado', 'entregue'];
  return confirmedStatuses.includes(status || '') || confirmedStatuses.includes(paymentStatus || '');
};

export default function PedidoConfirmado() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const locationState = (location.state as LocationState | null) ?? null;
  const numeroFromQuery = searchParams.get('numero')?.trim() || '';
  const numeroPedido = locationState?.numeroPedido || numeroFromQuery;

  const [copiedPix, setCopiedPix] = useState(false);
  const [loading, setLoading] = useState(!locationState && !!numeroPedido);
  const [pedidoData, setPedidoData] = useState<PedidoData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [pedidoId, setPedidoId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  const { items: cartItems, clearCart } = useCart();
  const cartClearedRef = useRef(false);

  const maybeClearCartOnConfirmed = useCallback(
    (status?: string | null, paymentStatusArg?: string | null) => {
      if (cartClearedRef.current) return;
      if (!isPaymentConfirmed(status, paymentStatusArg)) return;

      if (cartItems.length > 0) {
        clearCart();
      }

      cartClearedRef.current = true;
    },
    [cartItems.length, clearCart]
  );

  // Function to fetch order status from database
  const fetchOrderStatus = useCallback(async () => {
    if (!numeroPedido) return null;

    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select('id, numero_pedido, status, payment_status, itens, total, subtotal, frete, endereco, metodo_pagamento, cliente_nome')
        .eq('numero_pedido', numeroPedido)
        .maybeSingle();

      if (error || !data) {
        console.error('Erro ao buscar pedido:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Erro ao buscar status:', err);
      return null;
    }
  }, [numeroPedido]);

  // Manual refresh function
  const handleRefreshStatus = useCallback(async () => {
    setIsRefreshing(true);
    const data = await fetchOrderStatus();

    if (data) {
      setOrderStatus(data.status);
      setPaymentStatus(data.payment_status);
      setLastChecked(new Date());
      setPedidoId(data.id);

      // Update pedidoData with fresh data
      setPedidoData(prev =>
        prev
          ? {
              ...prev,
              status: data.status || undefined,
              paymentStatus: data.payment_status || undefined,
            }
          : null
      );

      maybeClearCartOnConfirmed(data.status, data.payment_status);

      if (isPaymentConfirmed(data.status, data.payment_status)) {
        toast({
          title: '🎉 Pagamento Confirmado!',
          description: 'Seu pagamento foi processado com sucesso.',
        });
      }
    }

    setIsRefreshing(false);
  }, [fetchOrderStatus, maybeClearCartOnConfirmed, toast]);

  // Buscar dados do pedido no backend se não tiver state
  useEffect(() => {
    const fetchPedido = async () => {
      // If we have locationState, still fetch fresh status from DB
      if (locationState) {
        const freshData = await fetchOrderStatus();
        if (freshData) {
          setOrderStatus(freshData.status);
          setPaymentStatus(freshData.payment_status);
          setPedidoId(freshData.id);
          setLastChecked(new Date());
          maybeClearCartOnConfirmed(freshData.status, freshData.payment_status);
        }
        return;
      }

      if (!numeroPedido) return;

      setLoading(true);
      setNotFound(false);

      const data = await fetchOrderStatus();

      if (!data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Mapear dados do banco para o formato esperado
      const itens = (data.itens as unknown as ItemPedido[]) || [];
      const endereco = (data.endereco as unknown as EnderecoPedido) || {
        cep: '',
        rua: '',
        numero: '',
        bairro: '',
        cidade: '',
        estado: '',
      };

      setPedidoId(data.id);
      setPaymentStatus(data.payment_status);
      setOrderStatus(data.status);
      setPedidoData({
        numeroPedido: data.numero_pedido,
        total: Number(data.total) || 0,
        subtotal: Number(data.subtotal) || 0,
        frete: Number(data.frete) || 0,
        metodoPagamento: (data.metodo_pagamento as 'pix' | 'cartao') || 'pix',
        itens,
        endereco,
        clienteNome: data.cliente_nome,
        paymentStatus: data.payment_status || undefined,
        status: data.status || undefined,
      });
      setLastChecked(new Date());
      maybeClearCartOnConfirmed(data.status, data.payment_status);

      setLoading(false);
    };

    fetchPedido();
  }, [numeroPedido, locationState, fetchOrderStatus, maybeClearCartOnConfirmed]);

  // Realtime subscription para atualização do status de pagamento
  useEffect(() => {
    if (!numeroPedido) return;

    console.log('[Realtime] Inscrevendo para atualizações do pedido:', numeroPedido);

    const channel = supabase
      .channel(`pedido-${numeroPedido}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pedidos',
          filter: `numero_pedido=eq.${numeroPedido}`,
        },
        (payload) => {
          console.log('[Realtime] Atualização recebida:', payload);
          const newData = payload.new as { payment_status?: string; status?: string; id?: string };

          // Update both status fields
          if (newData.status) {
            setOrderStatus(newData.status);
          }
          if (newData.payment_status) {
            setPaymentStatus(newData.payment_status);
          }
          setLastChecked(new Date());

          maybeClearCartOnConfirmed(newData.status ?? null, newData.payment_status ?? null);

          // Check if payment is now confirmed
          if (isPaymentConfirmed(newData.status, newData.payment_status)) {
            toast({
              title: '🎉 Pagamento Confirmado!',
              description: 'Seu pagamento foi processado com sucesso.',
            });
          }

          if (newData.id) {
            setPedidoId(newData.id);
          }
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Status da subscription:', status);
      });

    return () => {
      console.log('[Realtime] Removendo subscription');
      supabase.removeChannel(channel);
    };
  }, [numeroPedido, toast]);

  // Auto-refresh every 30 seconds while payment is pending
  useEffect(() => {
    const isPending = !isPaymentConfirmed(orderStatus, paymentStatus);
    if (!isPending || !numeroPedido) return;

    console.log('[Auto-refresh] Iniciando polling a cada 30s...');
    
    const interval = setInterval(() => {
      console.log('[Auto-refresh] Verificando status...');
      handleRefreshStatus();
    }, 30000); // 30 seconds

    return () => {
      console.log('[Auto-refresh] Parando polling');
      clearInterval(interval);
    };
  }, [orderStatus, paymentStatus, numeroPedido, handleRefreshStatus]);

  useEffect(() => {
    if (!numeroPedido) navigate('/');
  }, [numeroPedido, navigate]);

  // Usar state da navegação ou dados do backend
  const state = locationState || pedidoData;

  const formatPrice = (price: number) => price.toFixed(2).replace('.', ',');

  const isPix = (state?.metodoPagamento || 'pix') === 'pix';

  // Dados PIX do Mercado Pago
  const pixCopiaECola = locationState?.pixCopiaECola || '';
  const pixQrCodeBase64 = locationState?.pixQrCodeBase64 || '';
  const hasPixFromMercadoPago = !!pixCopiaECola && !!pixQrCodeBase64;

  const handleCopy = async (value: string, onOk: () => void) => {
    try {
      await navigator.clipboard.writeText(value);
      onOk();
      toast({ title: 'Copiado!' });
    } catch {
      toast({
        title: 'Erro ao copiar',
        description: 'Selecione e copie manualmente.',
        variant: 'destructive',
      });
    }
  };

  const handleCopyPix = () =>
    handleCopy(pixCopiaECola, () => {
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 2500);
    });

  const whatsappMessage = `Olá! Segue comprovante do pedido #${numeroPedido}`;
  const whatsappUrl = `https://wa.me/5519998229202?text=${encodeURIComponent(whatsappMessage)}`;

  if (!numeroPedido) return null;

  // Loading state
  if (loading) {
    return (
      <>
        <Helmet>
          <title>Carregando... | Elatho Semijoias</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="min-h-screen bg-background">
          <Navbar />
          <main className="pt-20 md:pt-24">
            <div className="container px-4 py-16 flex flex-col items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Carregando dados do pedido...</p>
            </div>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  // Not found state
  if (notFound) {
    return (
      <>
        <Helmet>
          <title>Pedido não encontrado | Elatho Semijoias</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="min-h-screen bg-background">
          <Navbar />
          <main className="pt-20 md:pt-24">
            <div className="container px-4 py-16 text-center">
              <h1 className="text-2xl font-display font-bold mb-4">Pedido não encontrado</h1>
              <p className="text-muted-foreground mb-6">
                O pedido <strong>#{numeroPedido}</strong> não foi encontrado ou você não tem permissão para visualizá-lo.
              </p>
              <Link to="/">
                <Button>Voltar para a loja</Button>
              </Link>
            </div>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Pedido Confirmado | Elatho Semijoias</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="pt-20 md:pt-24">
          <div className="container px-4 py-8 md:py-14">
            <div className="max-w-3xl mx-auto space-y-8">
              <header className="text-center animate-fade-in">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-success/10 flex items-center justify-center animate-scale-in">
                  <CheckCircle className="h-10 w-10 text-success" />
                </div>

                <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
                  Pedido Realizado com Sucesso!
                </h1>

                <p className="text-xl font-display font-semibold text-foreground">
                  Pedido <span className="text-primary">#{numeroPedido}</span>
                </p>
              </header>

              {/* Status do Pagamento em tempo real */}
              {isPix && isPaymentConfirmed(orderStatus, paymentStatus) && (
                <section className="card-elegant p-6 border-2 border-success/50 bg-success/10 animate-fade-in-up">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                      <BadgeCheck className="h-7 w-7 text-success" />
                    </div>
                    <div>
                      <h2 className="text-xl font-display font-bold text-success">Pagamento Confirmado!</h2>
                      <p className="text-muted-foreground">Seu pagamento foi aprovado com sucesso.</p>
                    </div>
                  </div>
                </section>
              )}

              {/* Pagamento PIX - Aguardando (com QR Code do Mercado Pago) */}
              {isPix && !isPaymentConfirmed(orderStatus, paymentStatus) && hasPixFromMercadoPago && (
                <section className="card-elegant p-6 border-2 border-primary/30 bg-primary/5 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <QrCode className="h-5 w-5" />
                      </span>
                      <h2 className="text-xl font-display font-bold">Pague via PIX</h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-sm font-medium text-amber-600">Aguardando pagamento</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleRefreshStatus} 
                        disabled={isRefreshing}
                        className="gap-2"
                      >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Verificar
                      </Button>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mb-4">
                    Última verificação: {lastChecked.toLocaleTimeString('pt-BR')} (atualiza a cada 30s)
                  </p>

                  <div className="grid md:grid-cols-[280px_1fr] gap-5 items-start">
                    {/* QR Code do Mercado Pago */}
                    <div className="bg-card rounded-xl border border-border p-4 flex items-center justify-center">
                      <img 
                        src={`data:image/png;base64,${pixQrCodeBase64}`}
                        alt="QR Code PIX"
                        className="w-[232px] h-[232px]"
                      />
                    </div>

                    <div className="space-y-4">
                      {typeof state?.total === 'number' && (
                        <div className="p-4 bg-background rounded-lg border border-border">
                          <p className="text-sm text-muted-foreground mb-1">Valor a pagar</p>
                          <p className="text-2xl font-bold text-primary">R$ {formatPrice(state.total)}</p>
                        </div>
                      )}

                      <div className="p-4 bg-background rounded-lg border border-border">
                        <div className="flex items-center gap-2 mb-2">
                          <Timer className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            O QR Code expira em 30 minutos
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Após o pagamento, a confirmação é automática via Mercado Pago.
                        </p>
                      </div>

                      <div className="p-4 bg-background rounded-lg border border-border">
                        <p className="text-sm text-muted-foreground mb-2">
                          Ou copie o código PIX:
                        </p>

                        <div className="flex gap-2">
                          <input
                            value={pixCopiaECola}
                            readOnly
                            aria-label="Código PIX copia e cola"
                            className="flex-1 px-3 py-2 bg-muted text-xs rounded border border-border font-mono truncate"
                          />
                          <Button onClick={handleCopyPix} className="gap-2">
                            {copiedPix ? (
                              <>
                                <Check className="h-4 w-4" />
                                Copiado
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4" />
                                Copiar
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        O pagamento é processado automaticamente. Você receberá a confirmação na tela.
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {/* Fallback: PIX sem QR Code automático (erro na API) */}
              {isPix && !isPaymentConfirmed(orderStatus, paymentStatus) && !hasPixFromMercadoPago && (
                <section className="card-elegant p-6 border-2 border-amber-500/30 bg-amber-500/5 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <Clock className="h-6 w-6 text-amber-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-display font-bold">Pagamento Pendente</h2>
                        <p className="text-muted-foreground">Entre em contato para finalizar o pagamento</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRefreshStatus} 
                      disabled={isRefreshing}
                      className="gap-2"
                    >
                      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                      Verificar Status
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground mb-4">
                    Última verificação: {lastChecked.toLocaleTimeString('pt-BR')} (atualiza a cada 30s)
                  </p>

                  {typeof state?.total === 'number' && (
                    <div className="p-4 bg-background rounded-lg border border-border mb-4">
                      <p className="text-sm text-muted-foreground mb-1">Valor do pedido</p>
                      <p className="text-2xl font-bold text-primary">R$ {formatPrice(state.total)}</p>
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground mb-4">
                    Houve um problema ao gerar o QR Code PIX automático. 
                    Por favor, entre em contato pelo WhatsApp para receber os dados de pagamento.
                  </p>

                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full gap-2">
                      <MessageCircle className="h-5 w-5" />
                      Solicitar dados de pagamento via WhatsApp
                    </Button>
                  </a>
                </section>
              )}

              {/* Pagamento Cartão */}
              {!isPix && (
                <section className="card-elegant p-6 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
                  <h2 className="text-xl font-display font-bold mb-2">Pagamento por Cartão</h2>
                  <p className="text-muted-foreground">
                    Você será redirecionado para o Mercado Pago para finalizar o pagamento.
                  </p>
                </section>
              )}

              {/* Resumo do pedido (só se tiver state) */}
              <section className="card-elegant p-6 animate-fade-in-up" style={{ animationDelay: '160ms' }}>
                <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Informações do Pedido
                </h2>

                {!state ? (
                  <p className="text-muted-foreground">
                    Pedido registrado com sucesso. Se você fechou a página, use o número do pedido acima ao falar conosco.
                  </p>
                ) : (
                  <div className="space-y-6">
                    {/* Itens */}
                    <div className="space-y-3">
                      {state.itens.map((item, index) => (
                        <article key={index} className="flex justify-between items-start py-2 border-b border-border last:border-0">
                          <div>
                            <p className="font-medium">{item.nome}</p>
                            {item.variacao && (
                              <p className="text-sm text-muted-foreground">{item.variacao}</p>
                            )}
                            <p className="text-sm text-muted-foreground">Qtd: {item.quantidade}</p>
                          </div>
                          <p className="font-semibold">R$ {formatPrice(item.preco * item.quantidade)}</p>
                        </article>
                      ))}
                    </div>

                    {/* Totais */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>R$ {formatPrice(state.subtotal)}</span>
                      </div>
                      {(state.desconto ?? 0) > 0 && (
                        <div className="flex justify-between text-success">
                          <span>Desconto</span>
                          <span>- R$ {formatPrice(state.desconto!)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Frete</span>
                        <span>{state.frete > 0 ? `R$ ${formatPrice(state.frete)}` : 'Grátis'}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                        <span>Total</span>
                        <span className="text-primary">R$ {formatPrice(state.total)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Endereço de entrega */}
              {state?.endereco && (
                <section className="card-elegant p-6 animate-fade-in-up" style={{ animationDelay: '240ms' }}>
                  <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Endereço de Entrega
                  </h2>
                  <address className="not-italic text-muted-foreground">
                    <p>{state.endereco.rua}, {state.endereco.numero}</p>
                    {state.endereco.complemento && <p>{state.endereco.complemento}</p>}
                    <p>{state.endereco.bairro}</p>
                    <p>{state.endereco.cidade} - {state.endereco.estado}</p>
                    <p>CEP: {state.endereco.cep}</p>
                  </address>
                  <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Prazo de entrega: {PRAZO_ENTREGA}</span>
                  </div>
                </section>
              )}

              {/* Próximos passos */}
              {isPix && paymentStatus !== 'approved' && (
                <section className="card-elegant p-6 animate-fade-in-up" style={{ animationDelay: '320ms' }}>
                  <h2 className="text-lg font-display font-bold mb-4">Próximos Passos</h2>
                  <ol className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-medium">
                        1
                      </span>
                      <span>Escaneie o QR Code ou copie o código PIX acima</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-medium">
                        2
                      </span>
                      <span>Realize o pagamento no app do seu banco</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-medium">
                        3
                      </span>
                      <span>A confirmação é automática - você receberá um aviso aqui na tela</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-medium">
                        4
                      </span>
                      <span>Seu pedido será preparado e enviado</span>
                    </li>
                  </ol>
                </section>
              )}

              {/* Ações */}
              <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button variant="outline" className="w-full gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Falar no WhatsApp
                  </Button>
                </a>
                <Link to="/" className="flex-1">
                  <Button className="w-full gap-2">
                    <Home className="h-5 w-5" />
                    Continuar Comprando
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
