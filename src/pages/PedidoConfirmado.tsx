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
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { QRCodeCanvas } from 'qrcode.react';
import { generatePixEmvPayload } from '@/lib/pix';

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

const PIX_KEY = 'elathosemijoias@gmail.com';
const PIX_BENEFICIARIO = 'Elatho Semijoias';
const PRAZO_ENTREGA = '7 a 15 dias úteis';

export default function PedidoConfirmado() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const state = (location.state as LocationState | null) ?? null;

  const numeroFromQuery = searchParams.get('numero')?.trim() || '';
  const numeroPedido = state?.numeroPedido || numeroFromQuery;

  const [copiedPix, setCopiedPix] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    if (!numeroPedido) navigate('/');
  }, [numeroPedido, navigate]);

  const formatPrice = (price: number) => price.toFixed(2).replace('.', ',');

  const isPix = (state?.metodoPagamento || 'pix') === 'pix';

  const pixPayload = useMemo(() => {
    // Se Mercado Pago retornou copia-e-cola, preferir.
    if (state?.pixCopiaECola) return state.pixCopiaECola;

    const amount = state?.total ?? 0;
    // Gera payload EMV (PIX) com valor exato do pedido.
    return generatePixEmvPayload({
      pixKey: PIX_KEY,
      merchantName: PIX_BENEFICIARIO,
      merchantCity: 'SAO PAULO',
      amount,
      txid: numeroPedido || '***',
    });
  }, [numeroPedido, state?.pixCopiaECola, state?.total]);

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
    handleCopy(PIX_KEY, () => {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2500);
    });

  const whatsappMessage = `Olá! Segue comprovante do pedido #${numeroPedido}`;
  const whatsappUrl = `https://wa.me/5519998229202?text=${encodeURIComponent(whatsappMessage)}`;

  if (!numeroPedido) return null;

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

              {/* Pagamento PIX */}
              {isPix && (
                <section className="card-elegant p-6 border-2 border-primary/30 bg-primary/5 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <QrCode className="h-5 w-5" />
                    </span>
                    <h2 className="text-xl font-display font-bold">Pague via PIX</h2>
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
                        <p className="text-sm text-muted-foreground mb-1">Chave PIX (Email)</p>
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-mono font-semibold break-all">{PIX_KEY}</p>
                          <Button variant="outline" size="sm" onClick={handleCopyKey} className="gap-2">
                            {copiedKey ? (
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
