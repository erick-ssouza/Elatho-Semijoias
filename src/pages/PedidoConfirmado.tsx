import { useEffect, useMemo, useState } from 'react';
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
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { QRCodeCanvas } from 'qrcode.react';
import { generatePixEmvPayload } from '@/lib/pix';
import { supabase } from '@/integrations/supabase/client';

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

  // PIX (opcional)
  pixCopiaECola?: string;
  pixQrCodeBase64?: string;
  pixPaymentId?: string;
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

const PIX_KEY = '33764535865';
const PIX_KEY_FORMATTED = '337.645.358-65';
const PIX_BENEFICIARIO = 'Erica C. M. Bortolin';
const PIX_BANCO = 'Banco do Brasil';
const PRAZO_ENTREGA = '7 a 15 dias úteis';

export default function PedidoConfirmado() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const locationState = (location.state as LocationState | null) ?? null;
  const numeroFromQuery = searchParams.get('numero')?.trim() || '';
  const numeroPedido = locationState?.numeroPedido || numeroFromQuery;

  const [copiedPix, setCopiedPix] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [loading, setLoading] = useState(!locationState && !!numeroPedido);
  const [pedidoData, setPedidoData] = useState<PedidoData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [pedidoId, setPedidoId] = useState<string | null>(null);

  // Buscar dados do pedido no backend se não tiver state
  useEffect(() => {
    if (locationState || !numeroPedido) return;

    const fetchPedido = async () => {
      setLoading(true);
      setNotFound(false);

      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('numero_pedido', numeroPedido)
        .maybeSingle();

      if (error || !data) {
        console.error('Erro ao buscar pedido:', error);
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

      setLoading(false);
    };

    fetchPedido();
  }, [numeroPedido, locationState]);

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
          
          if (newData.payment_status) {
            setPaymentStatus(newData.payment_status);
            
            if (newData.payment_status === 'approved') {
              toast({
                title: '🎉 Pagamento Confirmado!',
                description: 'Seu pagamento PIX foi aprovado com sucesso.',
              });
            }
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

  useEffect(() => {
    if (!numeroPedido) navigate('/');
  }, [numeroPedido, navigate]);

  // Usar state da navegação ou dados do backend
  const state = locationState || pedidoData;

  const formatPrice = (price: number) => price.toFixed(2).replace('.', ',');

  const isPix = (state?.metodoPagamento || 'pix') === 'pix';

  const pixPayload = useMemo(() => {
    // Se Mercado Pago retornou copia-e-cola, preferir.
    if (locationState?.pixCopiaECola) return locationState.pixCopiaECola;

    const amount = state?.total ?? 0;
    // Gera payload EMV (PIX) com valor exato do pedido.
    return generatePixEmvPayload({
      pixKey: PIX_KEY,
      merchantName: PIX_BENEFICIARIO,
      merchantCity: 'SAO PAULO',
      amount,
      txid: numeroPedido || '***',
    });
  }, [numeroPedido, locationState?.pixCopiaECola, state?.total]);

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
    handleCopy(pixPayload, () => {
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 2500);
    });

  const handleCopyKey = () =>
    handleCopy(PIX_KEY_FORMATTED, () => {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2500);
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
              {isPix && paymentStatus === 'approved' && (
                <section className="card-elegant p-6 border-2 border-success/50 bg-success/10 animate-fade-in-up">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                      <BadgeCheck className="h-7 w-7 text-success" />
                    </div>
                    <div>
                      <h2 className="text-xl font-display font-bold text-success">Pagamento Confirmado!</h2>
                      <p className="text-muted-foreground">Seu pagamento PIX foi aprovado com sucesso.</p>
                    </div>
                  </div>
                </section>
              )}

              {/* Pagamento PIX - Aguardando */}
              {isPix && paymentStatus !== 'approved' && (
                <section className="card-elegant p-6 border-2 border-primary/30 bg-primary/5 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <QrCode className="h-5 w-5" />
                      </span>
                      <h2 className="text-xl font-display font-bold">Pague via PIX</h2>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      <span className="text-sm font-medium text-amber-600">Aguardando pagamento</span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-[280px_1fr] gap-5 items-start">
                    <div className="bg-card rounded-xl border border-border p-4 flex items-center justify-center">
                      <QRCodeCanvas
                        value={pixPayload}
                        size={232}
                        includeMargin
                        level="M"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 bg-background rounded-lg border border-border">
                        <p className="text-sm text-muted-foreground mb-1">Chave PIX (CPF)</p>
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-mono font-semibold break-all">{PIX_KEY_FORMATTED}</p>
                          <Button variant="outline" size="sm" onClick={handleCopyKey} className="gap-2">
                            {copiedKey ? (
                              <>
                                <Check className="h-4 w-4" />
                                Copiado
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4" />
                                Copiar chave PIX
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="p-4 bg-background rounded-lg border border-border">
                        <p className="text-sm text-muted-foreground mb-1">Titular</p>
                        <p className="font-semibold">{PIX_BENEFICIARIO}</p>
                        <p className="text-sm text-muted-foreground">{PIX_BANCO}</p>
                      </div>

                      {typeof state?.total === 'number' && (
                        <div className="p-4 bg-background rounded-lg border border-border">
                          <p className="text-sm text-muted-foreground mb-1">Valor</p>
                          <p className="text-2xl font-bold text-primary">R$ {formatPrice(state.total)}</p>
                        </div>
                      )}

                      <div className="p-4 bg-background rounded-lg border border-border">
                        <p className="text-sm text-muted-foreground mb-2">
                          Escaneie o QR Code ou copie o código para pagar no app do seu banco:
                        </p>

                        <div className="flex gap-2">
                          <input
                            value={pixPayload}
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
                                Copiar código
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        Após o pagamento, envie o comprovante pelo WhatsApp.
                      </p>
                    </div>
                  </div>
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
                    <div className="space-y-2 pt-4 border-t border-border">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>R$ {formatPrice(state.subtotal)}</span>
                      </div>
                      {typeof state.desconto === 'number' && state.desconto > 0 && (
                        <div className="flex justify-between text-sm text-success">
                          <span>Desconto</span>
                          <span>-R$ {formatPrice(state.desconto)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Frete</span>
                        <span>{state.frete > 0 ? `R$ ${formatPrice(state.frete)}` : 'Grátis'}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                        <span>Total</span>
                        <span className="text-primary">R$ {formatPrice(state.total)}</span>
                      </div>
                    </div>

                    {/* Endereço */}
                    <div className="pt-4 border-t border-border">
                      <h3 className="text-base font-display font-bold mb-3 flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        Endereço de Entrega
                      </h3>

                      <div className="text-muted-foreground">
                        <p className="font-medium text-foreground">{state.clienteNome}</p>
                        <p>{state.endereco.rua}, {state.endereco.numero}</p>
                        {state.endereco.complemento && <p>{state.endereco.complemento}</p>}
                        <p>{state.endereco.bairro}</p>
                        <p>{state.endereco.cidade} - {state.endereco.estado}</p>
                        <p>CEP: {state.endereco.cep}</p>
                      </div>

                      <div className="mt-4 p-3 bg-muted/50 rounded-lg flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Prazo estimado: {PRAZO_ENTREGA}</span>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Próximos passos (PIX) */}
              {isPix && (
                <aside className="card-elegant p-6 animate-fade-in-up" style={{ animationDelay: '240ms' }}>
                  <h2 className="text-lg font-display font-bold mb-4">Próximos Passos</h2>
                  <ol className="space-y-4">
                    <li className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                      <span>Efetue o pagamento via PIX</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                      <span>Envie o comprovante pelo WhatsApp</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                      <span>Aguarde a confirmação e código de rastreio</span>
                    </li>
                  </ol>
                </aside>
              )}

              {/* Ações */}
              <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: '320ms' }}>
                {isPix && (
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="block">
                    <Button className="w-full bg-success text-success-foreground hover:bg-success/90 gap-2 text-lg py-6">
                      <MessageCircle className="h-5 w-5" />
                      Enviar comprovante no WhatsApp
                    </Button>
                  </a>
                )}

                <Link to="/" className="block">
                  <Button variant="outline" className="w-full gap-2">
                    <Home className="h-4 w-4" />
                    Continuar comprando
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
