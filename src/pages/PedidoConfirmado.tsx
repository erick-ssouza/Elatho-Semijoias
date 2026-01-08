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

  // PIX do Asaas
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
  const numeroFromQuery = (searchParams.get('numero') || searchParams.get('pedido') || '').trim();
  const numeroPedido = (locationState?.numeroPedido || numeroFromQuery || '').trim();

  const [copiedPix, setCopiedPix] = useState(false);
  const [loading, setLoading] = useState(!locationState && !!numeroPedido);
  const [pedidoData, setPedidoData] = useState<PedidoData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [pedidoId, setPedidoId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [pageLoadTime] = useState<Date>(new Date());
  const [pollCount, setPollCount] = useState(0);

  const { items: cartItems, clearCart } = useCart();
  const cartClearedRef = useRef(false);
  const refreshStatusRef = useRef<(source: string) => void>(() => {});

  const maybeClearCartOnConfirmed = useCallback(
    (status?: string | null, paymentStatusArg?: string | null) => {
      if (cartClearedRef.current) return;
      if (!isPaymentConfirmed(status, paymentStatusArg)) return;

      // Limpar dados persistidos do checkout somente quando o pagamento estiver confirmado
      try {
        localStorage.removeItem('elatho_checkout_data');
      } catch {
        // ignore
      }

      if (cartItems.length > 0) {
        clearCart();
      }

      cartClearedRef.current = true;
    },
    [cartItems.length, clearCart]
  );

  // Function to fetch order status from edge function (bypasses RLS for all users)
  const fetchOrderStatusFromEdge = useCallback(async (source: string = 'manual') => {
    if (!numeroPedido) return null;

    const timestamp = new Date().toISOString();
    console.log(`[DEBUG ${timestamp}] fetchOrderStatusFromEdge chamado - fonte: ${source}, pedido: ${numeroPedido}, browser: ${navigator.userAgent.slice(0, 50)}`);

    try {
      const { data, error } = await supabase.functions.invoke('get-order-status', {
        body: { numeroPedido },
      });

      if (error) {
        console.error(`[DEBUG ${timestamp}] Edge function error:`, error);
        return null;
      }

      if (!data || !data.found) {
        console.log(`[DEBUG ${timestamp}] Pedido não encontrado via edge function`);
        return null;
      }

      console.log(`[DEBUG ${timestamp}] Resultado da edge function:`, {
        status: data.status,
        paymentStatus: data.paymentStatus,
        id: data.id,
        serverTimestamp: data.timestamp
      });

      return {
        id: data.id,
        numero_pedido: data.numeroPedido,
        status: data.status,
        payment_status: data.paymentStatus,
      };
    } catch (err) {
      console.error(`[DEBUG ${timestamp}] Erro inesperado na edge function:`, err);
      return null;
    }
  }, [numeroPedido]);

  // Fallback: fetch directly from database (for initial load with full data)
  const fetchOrderStatus = useCallback(async (source: string = 'manual') => {
    if (!numeroPedido) return null;

    const timestamp = new Date().toISOString();
    console.log(`[DEBUG ${timestamp}] fetchOrderStatus chamado - fonte: ${source}, pedido: ${numeroPedido}`);

    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select('id, numero_pedido, status, payment_status, itens, total, subtotal, frete, endereco, metodo_pagamento, cliente_nome')
        .eq('numero_pedido', numeroPedido)
        .maybeSingle();

      if (error) {
        console.error(`[DEBUG ${timestamp}] Erro ao buscar pedido:`, error);
        return null;
      }
      
      if (!data) {
        console.log(`[DEBUG ${timestamp}] Pedido não encontrado`);
        return null;
      }

      console.log(`[DEBUG ${timestamp}] Resultado da consulta:`, {
        status: data.status,
        payment_status: data.payment_status,
        id: data.id
      });

      return data;
    } catch (err) {
      console.error(`[DEBUG ${timestamp}] Erro inesperado:`, err);
      return null;
    }
  }, [numeroPedido]);

  // Manual refresh function - uses edge function for reliable status check
  const handleRefreshStatus = useCallback(async (source: string = 'manual') => {
    const timestamp = new Date().toISOString();
    console.log(`[DEBUG ${timestamp}] handleRefreshStatus iniciado - fonte: ${source}`);

    setIsRefreshing(true);
    setPollCount((prev) => prev + 1);

    // Use edge function for polling (bypasses RLS)
    const data = await fetchOrderStatusFromEdge(source);

    if (data) {
      console.log(`[DEBUG ${timestamp}] Atualizando estado com dados frescos via edge function`);
      setOrderStatus(data.status);
      setPaymentStatus(data.payment_status);
      setLastChecked(new Date());
      setPedidoId(data.id);

      // Update pedidoData with fresh data
      setPedidoData((prev) =>
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
        console.log(`[DEBUG ${timestamp}] Pagamento confirmado!`);
        toast({
          title: '🎉 Pagamento Confirmado!',
          description: 'Seu pagamento foi processado com sucesso.',
        });
      }
    } else {
      console.log(`[DEBUG ${timestamp}] Nenhum dado retornado da edge function`);

      // Só notificar o usuário quando for uma ação manual
      if (source.startsWith('button')) {
        toast({
          title: 'Não foi possível verificar agora',
          description: 'Tente novamente em alguns instantes (a confirmação também é automática).',
          variant: 'destructive',
        });
      }
    }

    setIsRefreshing(false);
  }, [fetchOrderStatusFromEdge, maybeClearCartOnConfirmed, toast]);

  useEffect(() => {
    refreshStatusRef.current = (source: string) => {
      void handleRefreshStatus(source);
    };
  }, [handleRefreshStatus]);

  // Buscar dados do pedido no backend se não tiver state
  useEffect(() => {
    const fetchPedido = async () => {
      console.log('[DEBUG] useEffect inicial: buscando dados do pedido...');
      
      // If we have locationState, still fetch fresh status from edge function
      if (locationState) {
        const freshData = await fetchOrderStatusFromEdge('initial-with-state');
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

      // For initial full data load, use direct query
      const data = await fetchOrderStatus('initial-no-state');

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
  }, [numeroPedido, locationState, fetchOrderStatus, fetchOrderStatusFromEdge, maybeClearCartOnConfirmed]);

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

  // Auto-refresh every 10 seconds while payment is pending (uses edge function)
  useEffect(() => {
    const isPending = !isPaymentConfirmed(orderStatus, paymentStatus);
    if (!isPending || !numeroPedido) return;

    const timestamp = new Date().toISOString();
    console.log(
      `[DEBUG ${timestamp}] Auto-refresh: Iniciando polling a cada 10s... Browser: ${navigator.userAgent}`
    );

    const run = (src: string) => {
      try {
        refreshStatusRef.current(src);
      } catch (err) {
        console.error('[DEBUG] Auto-refresh: erro ao executar refreshStatusRef', err);
      }
    };

    // Initial check after 3 seconds
    const initialTimeout = setTimeout(() => {
      console.log(`[DEBUG] Auto-refresh: Verificação inicial após 3s`);
      run('polling-initial');
    }, 3000);

    // Poll every 10 seconds
    const interval = setInterval(() => {
      const now = new Date().toISOString();
      console.log(`[DEBUG ${now}] Auto-refresh: Executando verificação periódica via edge function`);
      run('polling-interval');
    }, 10000);

    return () => {
      console.log('[DEBUG] Auto-refresh: Parando polling e limpando timers');
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [orderStatus, paymentStatus, numeroPedido]);

  // Calculate time on page for fallback message
  const getTimeOnPage = useCallback(() => {
    return Math.floor((new Date().getTime() - pageLoadTime.getTime()) / 1000);
  }, [pageLoadTime]);

  const [showFallbackMessage, setShowFallbackMessage] = useState(false);

  // Show fallback message after 2 minutes
  useEffect(() => {
    const isPending = !isPaymentConfirmed(orderStatus, paymentStatus);
    if (!isPending) {
      setShowFallbackMessage(false);
      return;
    }

    const timeout = setTimeout(() => {
      console.log('[DEBUG] 2 minutos na página sem confirmação - mostrando mensagem de fallback');
      setShowFallbackMessage(true);
    }, 120000); // 2 minutes

    return () => clearTimeout(timeout);
  }, [orderStatus, paymentStatus]);

  useEffect(() => {
    if (!numeroPedido) navigate('/');
  }, [numeroPedido, navigate]);

  // Usar state da navegação ou dados do backend
  const state = locationState || pedidoData;

  const formatPrice = (price: number) => price.toFixed(2).replace('.', ',');

  const isPix = (state?.metodoPagamento || 'pix') === 'pix';

  // Dados PIX do Asaas
  const pixCopiaECola = locationState?.pixCopiaECola || '';
  const pixQrCodeBase64 = locationState?.pixQrCodeBase64 || '';
  const hasPixData = !!pixCopiaECola && !!pixQrCodeBase64;

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

  // Build detailed WhatsApp message for sending payment proof
  const buildWhatsAppMessage = () => {
    if (!state) {
      return `Olá! 😊\n\nAcabei de fazer um pedido na Elatho.\n\n📦 Pedido: #${numeroPedido}\n\nAguardo a confirmação! 💛`;
    }

    const metodoPagamentoLabel = isPix ? "PIX" : "Cartão";
    
    // Format items
    const itensFormatted = state.itens
      .map((item) => {
        const variacao = item.variacao ? ` - ${item.variacao}` : "";
        return `• ${item.nome}${variacao} - Qtd: ${item.quantidade}`;
      })
      .join("\n");

    // Format address
    const endereco = state.endereco;
    const enderecoFormatted = endereco
      ? [
          `${endereco.rua}, ${endereco.numero}`,
          endereco.complemento || null,
          `${endereco.bairro}`,
          `${endereco.cidade} - ${endereco.estado}`,
          `CEP: ${endereco.cep}`,
        ]
          .filter(Boolean)
          .join("\n")
      : "";

    return `Olá! 😊

Acabei de fazer um pedido na Elatho e estou enviando o comprovante de pagamento.

📦 Pedido: #${numeroPedido}
💰 Valor: R$ ${formatPrice(state.total)}
💳 Pagamento: ${metodoPagamentoLabel}

Itens:
${itensFormatted}

Dados para entrega:
${state.clienteNome}
${enderecoFormatted}

Aguardo a confirmação! 💛`;
  };

  const whatsappMessage = buildWhatsAppMessage();
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

              {/* Pagamento PIX - Aguardando */}
              {isPix && !isPaymentConfirmed(orderStatus, paymentStatus) && hasPixData && (
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
                        variant="default" 
                        size="default" 
                        onClick={() => handleRefreshStatus('button-click')} 
                        disabled={isRefreshing}
                        className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md"
                      >
                        {isRefreshing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        {isRefreshing ? 'Verificando...' : 'Verificar Pagamento'}
                      </Button>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mb-2">
                    Última verificação: {lastChecked.toLocaleTimeString('pt-BR')} • Verificações: {pollCount} • Atualiza a cada 10s
                  </p>

                  {/* Fallback message after 2 minutes */}
                  {showFallbackMessage && (
                    <div className="mb-4 p-4 rounded-lg bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-400 dark:border-amber-600">
                      <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                        ⏰ Já realizou o pagamento?
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                        Clique no botão <strong>"Verificar Pagamento"</strong> acima ou aguarde alguns instantes para a confirmação automática.
                        Se o problema persistir, entre em contato pelo WhatsApp.
                      </p>
                    </div>
                  )}

                  <div className="grid md:grid-cols-[280px_1fr] gap-5 items-start">
                    {/* QR Code PIX */}
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
                          Após o pagamento, a confirmação é automática.
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
              {isPix && !isPaymentConfirmed(orderStatus, paymentStatus) && !hasPixData && (
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
                      variant="default" 
                      size="default" 
                      onClick={() => handleRefreshStatus('button-click-fallback')} 
                      disabled={isRefreshing}
                      className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md"
                    >
                      {isRefreshing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      {isRefreshing ? 'Verificando...' : 'Verificar Status'}
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground mb-2">
                    Última verificação: {lastChecked.toLocaleTimeString('pt-BR')} • Verificações: {pollCount} • Atualiza a cada 10s
                  </p>

                  {/* Fallback message after 2 minutes */}
                  {showFallbackMessage && (
                    <div className="mb-4 p-4 rounded-lg bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-400 dark:border-amber-600">
                      <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                        ⏰ Já realizou o pagamento?
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                        Clique no botão <strong>"Verificar Status"</strong> acima ou entre em contato pelo WhatsApp abaixo.
                      </p>
                    </div>
                  )}

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

              {/* Pagamento Cartão - Confirmado */}
              {!isPix && (
                <section className="card-elegant p-6 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
                  <h2 className="text-xl font-display font-bold mb-2 flex items-center gap-2">
                    <BadgeCheck className="h-5 w-5 text-green-600" />
                    Pagamento Confirmado!
                  </h2>
                  <p className="text-muted-foreground">
                    Obrigado pela sua compra na Elatho Semijoias. Você receberá o código de rastreamento por e-mail assim que seu pedido for enviado.
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
                {isPix && !isPaymentConfirmed(orderStatus, paymentStatus) && (
                  <Link to="/checkout?step=review&return=pix" className="flex-1">
                    <Button variant="secondary" className="w-full gap-2">
                      <Package className="h-5 w-5" />
                      Voltar para revisão
                    </Button>
                  </Link>
                )}
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
