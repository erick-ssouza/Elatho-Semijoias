import { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { CheckCircle, MessageCircle, Home, Copy, Check, Package, MapPin, Clock } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ItemPedido {
  nome: string;
  variacao?: string;
  quantidade: number;
  preco: number;
}

interface EnderecoPedido {
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
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
  // Dados PIX (quando aplicável)
  pixKey?: string;
  pixKeyFormatted?: string;
  pixBeneficiario?: string;
}

// Chave PIX da loja
const PIX_KEY = "33764535865";
const PIX_KEY_FORMATTED = "337.645.358-65";
const PIX_BENEFICIARIO = "Erica C. M. Bortolin";

export default function PedidoConfirmado() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const state = location.state as LocationState | null;
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    if (!state?.numeroPedido) {
      navigate('/');
    }
  }, [state, navigate]);

  if (!state?.numeroPedido) {
    return null;
  }

  const formatPrice = (price: number) => {
    return price.toFixed(2).replace('.', ',');
  };

  const handleCopyPixKey = async () => {
    try {
      await navigator.clipboard.writeText(PIX_KEY);
      setCopiedKey(true);
      toast({ title: 'Chave PIX copiada!' });
      setTimeout(() => setCopiedKey(false), 3000);
    } catch {
      toast({
        title: 'Erro ao copiar',
        description: 'Selecione e copie manualmente.',
        variant: 'destructive',
      });
    }
  };

  const whatsappMessage = `Olá! Segue comprovante do pedido *${state.numeroPedido}*`;
  const whatsappUrl = `https://wa.me/5519998229202?text=${encodeURIComponent(whatsappMessage)}`;

  const isPix = state.metodoPagamento === 'pix';

  return (
    <>
      <Helmet>
        <title>Pedido Confirmado | Elatho Semijoias</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 md:pt-24">
          <div className="container px-4 py-8 md:py-16">
            <div className="max-w-2xl mx-auto space-y-8">
              {/* Header */}
              <div className="text-center animate-fade-in">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center animate-scale-in">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>

                <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
                  Pedido Realizado com Sucesso!
                </h1>

                <p className="text-xl text-primary font-display font-semibold">
                  Pedido {state.numeroPedido}
                </p>
              </div>

              {/* Card de Pagamento PIX */}
              {isPix && (
                <div className="card-elegant p-6 border-2 border-primary/30 bg-primary/5 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                  <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm">💰</span>
                    Pague via PIX
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-background rounded-lg border border-border">
                      <p className="text-sm text-muted-foreground mb-1">Chave PIX (CPF):</p>
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-mono font-bold text-lg">{PIX_KEY_FORMATTED}</p>
                        <Button
                          onClick={handleCopyPixKey}
                          variant="outline"
                          size="sm"
                          className="gap-2"
                        >
                          {copiedKey ? (
                            <>
                              <Check className="h-4 w-4" />
                              Copiado!
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

                    <div className="p-4 bg-background rounded-lg border border-border">
                      <p className="text-sm text-muted-foreground mb-1">Beneficiário:</p>
                      <p className="font-semibold">{PIX_BENEFICIARIO}</p>
                    </div>

                    <div className="p-4 bg-background rounded-lg border border-border">
                      <p className="text-sm text-muted-foreground mb-1">Valor:</p>
                      <p className="text-2xl font-bold text-primary">R$ {formatPrice(state.total)}</p>
                    </div>

                    <p className="text-sm text-muted-foreground text-center">
                      Após o pagamento, envie o comprovante pelo WhatsApp
                    </p>
                  </div>
                </div>
              )}

              {/* Card de Pagamento Cartão */}
              {!isPix && (
                <div className="card-elegant p-6 border-2 border-blue-300/30 bg-blue-50 dark:bg-blue-900/10 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                  <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm">💳</span>
                    Pagamento por Cartão
                  </h2>
                  <p className="text-muted-foreground">
                    Você será redirecionado para o Mercado Pago para finalizar o pagamento de forma segura.
                  </p>
                </div>
              )}

              {/* Resumo do Pedido */}
              <div className="card-elegant p-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Resumo do Pedido
                </h2>
                
                <div className="space-y-3 mb-4">
                  {state.itens.map((item, index) => (
                    <div key={index} className="flex justify-between items-start py-2 border-b border-border last:border-0">
                      <div>
                        <p className="font-medium">{item.nome}</p>
                        {item.variacao && (
                          <p className="text-sm text-muted-foreground">{item.variacao}</p>
                        )}
                        <p className="text-sm text-muted-foreground">Qtd: {item.quantidade}</p>
                      </div>
                      <p className="font-semibold">R$ {formatPrice(item.preco * item.quantidade)}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-4 border-t border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>R$ {formatPrice(state.subtotal)}</span>
                  </div>
                  {state.desconto && state.desconto > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
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
              </div>

              {/* Endereço de Entrega */}
              <div className="card-elegant p-6 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Endereço de Entrega
                </h2>
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
                  <span className="text-sm text-muted-foreground">
                    Prazo estimado: 7 a 15 dias úteis
                  </span>
                </div>
              </div>

              {/* Próximos Passos */}
              {isPix && (
                <div className="card-elegant p-6 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                  <h2 className="text-lg font-display font-bold mb-4">Próximos Passos</h2>
                  <ol className="space-y-4">
                    <li className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                      <span>Efetue o pagamento via PIX usando a chave acima</span>
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
                </div>
              )}

              {/* Botões de Ação */}
              <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
                {isPix && (
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="block">
                    <Button className="w-full bg-green-600 hover:bg-green-700 gap-2 text-lg py-6">
                      <MessageCircle className="h-5 w-5" />
                      Enviar Comprovante no WhatsApp
                    </Button>
                  </a>
                )}
                
                <Link to="/" className="block">
                  <Button variant="outline" className="w-full gap-2">
                    <Home className="h-4 w-4" />
                    Voltar para a Loja
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
