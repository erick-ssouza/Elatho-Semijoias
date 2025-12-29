import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Copy, Check, Loader2, RefreshCw, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';

interface LocationState {
  numeroPedido: string;
  paymentId: string;
  qrCode: string;
  qrCodeBase64: string;
  total: number;
  expirationDate: string;
}

export default function PagamentoPix() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const state = location.state as LocationState;

  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!state?.numeroPedido) {
      navigate('/');
    }
  }, [state, navigate]);

  // Countdown timer
  useEffect(() => {
    if (!state?.expirationDate) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiration = new Date(state.expirationDate).getTime();
      const difference = expiration - now;

      if (difference <= 0) {
        setTimeLeft('Expirado');
        return;
      }

      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [state?.expirationDate]);

  // Auto-check payment status every 10 seconds
  useEffect(() => {
    if (paymentStatus !== 'pending' || !state?.paymentId) return;

    const checkStatus = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('check-payment-status', {
          body: { paymentId: state.paymentId },
        });

        if (error) throw error;

        if (data.status === 'approved') {
          setPaymentStatus('approved');
          
          // Update order status
          await supabase
            .from('pedidos')
            .update({ status: 'pago' })
            .eq('numero_pedido', state.numeroPedido);

          toast({
            title: 'Pagamento confirmado!',
            description: 'Seu pedido está sendo preparado.',
          });
        } else if (data.status === 'rejected' || data.status === 'cancelled') {
          setPaymentStatus('rejected');
        }
      } catch (error) {
        console.error('Error checking payment:', error);
      }
    };

    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, [paymentStatus, state?.paymentId, state?.numeroPedido, toast]);

  const handleCopyCode = async () => {
    if (!state?.qrCode) return;
    
    try {
      await navigator.clipboard.writeText(state.qrCode);
      setCopied(true);
      toast({ title: 'Código PIX copiado!' });
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast({
        title: 'Erro ao copiar',
        description: 'Selecione e copie o código manualmente.',
        variant: 'destructive',
      });
    }
  };

  const handleCheckStatus = async () => {
    if (!state?.paymentId) return;
    
    setChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-payment-status', {
        body: { paymentId: state.paymentId },
      });

      if (error) throw error;

      if (data.status === 'approved') {
        setPaymentStatus('approved');
        await supabase
          .from('pedidos')
          .update({ status: 'pago' })
          .eq('numero_pedido', state.numeroPedido);
        toast({
          title: 'Pagamento confirmado!',
          description: 'Seu pedido está sendo preparado.',
        });
      } else if (data.status === 'rejected' || data.status === 'cancelled') {
        setPaymentStatus('rejected');
        toast({
          title: 'Pagamento não aprovado',
          description: 'Tente novamente ou entre em contato.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Aguardando pagamento',
          description: 'Ainda não identificamos seu pagamento.',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro ao verificar',
        description: 'Tente novamente em alguns instantes.',
        variant: 'destructive',
      });
    } finally {
      setChecking(false);
    }
  };

  const formatPrice = (price: number) => {
    return price.toFixed(2).replace('.', ',');
  };

  if (!state?.numeroPedido) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 md:pt-24">
        <div className="container px-4 py-8 max-w-2xl mx-auto">
          {paymentStatus === 'approved' ? (
            <div className="text-center space-y-6 animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              
              <h1 className="text-3xl font-display font-bold text-green-600">
                Pagamento Confirmado!
              </h1>
              
              <p className="text-muted-foreground">
                Recebemos seu pagamento. Seu pedido <strong>{state.numeroPedido}</strong> está sendo preparado.
              </p>

              <div className="card-elegant p-6 space-y-4">
                <h2 className="font-semibold">Próximos passos:</h2>
                <ul className="text-left text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 mt-0.5" />
                    Você receberá um email de confirmação
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 mt-0.5" />
                    Quando enviado, receberá o código de rastreio
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 mt-0.5" />
                    Prazo de entrega: 3-10 dias úteis
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/">
                  <Button className="btn-gold">Continuar Comprando</Button>
                </Link>
                <a href="https://wa.me/5519998229202" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline">Falar no WhatsApp</Button>
                </a>
              </div>
            </div>
          ) : paymentStatus === 'rejected' ? (
            <div className="text-center space-y-6 animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <AlertCircle className="h-10 w-10 text-destructive" />
              </div>
              
              <h1 className="text-3xl font-display font-bold text-destructive">
                Pagamento não aprovado
              </h1>
              
              <p className="text-muted-foreground">
                Não foi possível processar seu pagamento. Entre em contato conosco para ajuda.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="https://wa.me/5519998229202" target="_blank" rel="noopener noreferrer">
                  <Button className="btn-gold">Falar no WhatsApp</Button>
                </a>
                <Link to="/">
                  <Button variant="outline">Voltar à Loja</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-fade-in">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-3xl font-display font-bold mb-2">
                  Aguardando Pagamento
                </h1>
                <p className="text-muted-foreground">
                  Pedido <strong className="text-foreground">{state.numeroPedido}</strong>
                </p>
              </div>

              {/* QR Code */}
              <div className="card-elegant p-6 text-center space-y-4">
                <div className="bg-white p-4 rounded-xl inline-block">
                  {state.qrCodeBase64 ? (
                    <img 
                      src={`data:image/png;base64,${state.qrCodeBase64}`} 
                      alt="QR Code PIX" 
                      className="w-48 h-48 mx-auto"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-muted-foreground">
                      QR Code não disponível
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-center gap-2 text-lg font-semibold text-primary">
                  <span>R$ {formatPrice(state.total)}</span>
                </div>

                {timeLeft && timeLeft !== 'Expirado' && (
                  <p className="text-sm text-muted-foreground">
                    Expira em: <span className="font-mono font-medium">{timeLeft}</span>
                  </p>
                )}
              </div>

              {/* Código Copia e Cola */}
              <div className="card-elegant p-6 space-y-4">
                <h2 className="font-semibold text-center">Ou copie o código PIX</h2>
                
                <div className="bg-accent/50 rounded-lg p-3 break-all text-sm font-mono text-muted-foreground max-h-24 overflow-y-auto">
                  {state.qrCode}
                </div>

                <Button 
                  onClick={handleCopyCode} 
                  className="w-full btn-gold gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Código Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copiar Código PIX
                    </>
                  )}
                </Button>
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
                    Escolha pagar via PIX e escaneie o QR Code ou cole o código
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                    Confirme o pagamento no seu app
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
                    A confirmação aparecerá automaticamente aqui
                  </li>
                </ol>
              </div>

              {/* Check Status Button */}
              <Button 
                onClick={handleCheckStatus} 
                variant="outline" 
                className="w-full gap-2"
                disabled={checking}
              >
                {checking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Verificar Pagamento
              </Button>

              {/* Help */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Problemas com o pagamento?
                </p>
                <a 
                  href="https://wa.me/5519998229202" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm font-medium"
                >
                  Fale conosco no WhatsApp
                </a>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}