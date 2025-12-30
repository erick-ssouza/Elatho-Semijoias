import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Copy, Check, CheckCircle2, Clock, MessageCircle, RefreshCw, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';

interface LocationState {
  numeroPedido: string;
  total: number;
  clienteNome: string;
  paymentId?: string;
  qrCode?: string;
  qrCodeBase64?: string;
  ticketUrl?: string;
  expirationDate?: string;
}

// Fallback para PIX manual caso a API falhe
const PIX_KEY = "33764535865";
const PIX_KEY_FORMATTED = "337.645.358-65";
const PIX_BENEFICIARIO = "Erica C. M. Bortolin";

export default function PagamentoPix() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const state = location.state as LocationState;

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedValue, setCopiedValue] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!state?.numeroPedido) {
      navigate('/');
    }
  }, [state, navigate]);

  // Polling para verificar status do pagamento
  const checkPaymentStatus = useCallback(async () => {
    if (!state?.paymentId) return;
    
    setCheckingStatus(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-payment-status', {
        body: { paymentId: state.paymentId },
      });

      if (error) {
        console.error('Error checking status:', error);
        return;
      }

      setPaymentStatus(data?.status);

      if (data?.status === 'approved') {
        toast({
          title: 'Pagamento confirmado!',
          description: 'Seu pedido foi aprovado com sucesso.',
        });
        // Redirecionar para página de confirmação
        navigate('/pedido-confirmado', {
          state: {
            numeroPedido: state.numeroPedido,
            total: state.total,
            whatsappUrl: `https://wa.me/5519998229202?text=${encodeURIComponent(`Olá! Meu pagamento PIX do pedido ${state.numeroPedido} foi confirmado!`)}`,
          },
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setCheckingStatus(false);
    }
  }, [state, navigate, toast]);

  // Auto-check a cada 10 segundos se tiver paymentId
  useEffect(() => {
    if (!state?.paymentId) return;

    const interval = setInterval(checkPaymentStatus, 10000);
    return () => clearInterval(interval);
  }, [state?.paymentId, checkPaymentStatus]);

  const handleCopyCode = async () => {
    if (!state?.qrCode) return;
    try {
      await navigator.clipboard.writeText(state.qrCode);
      setCopiedCode(true);
      toast({ title: 'Código PIX copiado!' });
      setTimeout(() => setCopiedCode(false), 3000);
    } catch {
      toast({
        title: 'Erro ao copiar',
        description: 'Selecione e copie manualmente.',
        variant: 'destructive',
      });
    }
  };

  const handleCopyKey = async () => {
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

  const handleCopyValue = async () => {
    if (!state?.total) return;
    try {
      await navigator.clipboard.writeText(state.total.toFixed(2));
      setCopiedValue(true);
      toast({ title: 'Valor copiado!' });
      setTimeout(() => setCopiedValue(false), 3000);
    } catch {
      toast({
        title: 'Erro ao copiar',
        variant: 'destructive',
      });
    }
  };

  const formatPrice = (price: number) => {
    return price.toFixed(2).replace('.', ',');
  };

  const whatsappMessage = `Olá! Acabei de fazer o PIX do pedido *${state?.numeroPedido}* no valor de *R$ ${formatPrice(state?.total || 0)}*. Segue comprovante:`;
  const whatsappUrl = `https://wa.me/5519998229202?text=${encodeURIComponent(whatsappMessage)}`;

  if (!state?.numeroPedido) {
    return null;
  }

  // Verifica se tem QR Code automático do Mercado Pago
  const hasAutoQrCode = !!state.qrCodeBase64 || !!state.qrCode;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 md:pt-24">
        <div className="container px-4 py-8 max-w-2xl mx-auto">
          <div className="space-y-8 animate-fade-in">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-3xl font-display font-bold mb-2">
                Pagamento via PIX
              </h1>
              <p className="text-muted-foreground">
                Pedido <strong className="text-foreground">{state.numeroPedido}</strong>
              </p>
            </div>

            {/* Valor */}
            <div className="card-elegant p-6 text-center">
              <p className="text-muted-foreground mb-2">Valor a pagar:</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-4xl font-bold text-primary">
                  R$ {formatPrice(state.total)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyValue}
                  className="gap-1"
                >
                  {copiedValue ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {hasAutoQrCode ? (
              <>
                {/* QR Code Automático */}
                <div className="card-elegant p-6 space-y-4">
                  <h2 className="font-semibold text-center text-lg">Escaneie o QR Code</h2>
                  
                  {state.qrCodeBase64 && (
                    <div className="flex justify-center">
                      <img 
                        src={`data:image/png;base64,${state.qrCodeBase64}`} 
                        alt="QR Code PIX"
                        className="w-64 h-64 rounded-lg border border-border"
                      />
                    </div>
                  )}

                  <p className="text-sm text-center text-muted-foreground">
                    Abra o app do seu banco e escaneie o QR Code acima
                  </p>

                  {/* Código PIX Copia e Cola */}
                  {state.qrCode && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground text-center">
                        Ou copie o código PIX:
                      </p>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={state.qrCode} 
                          readOnly 
                          className="flex-1 px-3 py-2 bg-muted text-xs rounded border border-border font-mono truncate"
                        />
                        <Button
                          onClick={handleCopyCode}
                          className="btn-gold gap-2 shrink-0"
                        >
                          {copiedCode ? (
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
                  )}
                </div>

                {/* Status do Pagamento */}
                <div className="card-elegant p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Status do pagamento:</p>
                      <p className="font-medium">
                        {paymentStatus === 'approved' ? (
                          <span className="text-green-600">Aprovado ✓</span>
                        ) : paymentStatus === 'rejected' ? (
                          <span className="text-destructive">Rejeitado</span>
                        ) : (
                          <span className="text-yellow-600">Aguardando pagamento...</span>
                        )}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={checkPaymentStatus}
                      disabled={checkingStatus}
                      className="gap-2"
                    >
                      {checkingStatus ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      Verificar
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    A página atualiza automaticamente quando o pagamento for confirmado.
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* PIX Manual (fallback) */}
                <div className="card-elegant p-6 space-y-4">
                  <h2 className="font-semibold text-center text-lg">Dados para transferência</h2>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-accent/50 rounded-xl">
                      <p className="text-sm text-muted-foreground mb-1">Tipo de chave:</p>
                      <p className="font-medium">CPF</p>
                    </div>

                    <div className="p-4 bg-accent/50 rounded-xl">
                      <p className="text-sm text-muted-foreground mb-1">Chave PIX:</p>
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-mono font-bold text-lg">{PIX_KEY_FORMATTED}</p>
                        <Button
                          onClick={handleCopyKey}
                          className="btn-gold gap-2"
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

                    <div className="p-4 bg-accent/50 rounded-xl">
                      <p className="text-sm text-muted-foreground mb-1">Beneficiário:</p>
                      <p className="font-medium">{PIX_BENEFICIARIO}</p>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="card-elegant p-6 space-y-4">
                  <h2 className="font-semibold">Como pagar:</h2>
                  <ol className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                      Abra o app do seu banco
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                      Escolha pagar via PIX com CPF
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                      Cole a chave <strong>{PIX_KEY_FORMATTED}</strong>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
                      Digite o valor <strong>R$ {formatPrice(state.total)}</strong>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">5</span>
                      Confirme que o beneficiário é <strong>{PIX_BENEFICIARIO}</strong>
                    </li>
                  </ol>
                </div>
              </>
            )}

            {/* Send Proof */}
            <div className="card-elegant p-6 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900 space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-green-800 dark:text-green-400">Após pagar</h3>
                  <p className="text-sm text-green-700 dark:text-green-500">
                    {hasAutoQrCode 
                      ? 'O pagamento será confirmado automaticamente. Você também pode enviar o comprovante pelo WhatsApp.'
                      : 'Envie o comprovante pelo WhatsApp para confirmarmos seu pedido e iniciarmos a preparação.'}
                  </p>
                </div>
              </div>
              
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="block">
                <Button className="w-full bg-green-600 hover:bg-green-700 gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Enviar Comprovante via WhatsApp
                </Button>
              </a>
            </div>

            {/* Back to store */}
            <div className="text-center">
              <Link to="/" className="text-primary hover:underline text-sm font-medium">
                Voltar para a loja
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
