import { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { CheckCircle, MessageCircle, Home } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';

interface LocationState {
  numeroPedido: string;
  whatsappUrl: string;
  total: number;
}

export default function PedidoConfirmado() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

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

  return (
    <>
      <Helmet>
        <title>Pedido Confirmado | Elatho Semijoias</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 md:pt-24">
        <div className="container px-4 py-16">
          <div className="max-w-lg mx-auto text-center">
            {/* Success Icon */}
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-gold flex items-center justify-center animate-scale-in">
              <CheckCircle className="h-12 w-12 text-primary-foreground" />
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-4 animate-fade-in-up">
              Pedido Realizado!
            </h1>

            <p className="text-muted-foreground mb-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              Seu pedido foi registrado com sucesso. Agora é só enviar via WhatsApp para confirmar o pagamento.
            </p>

            {/* Order Info Card */}
            <div 
              className="card-elegant p-6 mb-8 text-left animate-fade-in-up" 
              style={{ animationDelay: '200ms' }}
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-border">
                  <span className="text-muted-foreground">Número do Pedido</span>
                  <span className="font-display font-bold text-primary text-lg">
                    {state.numeroPedido}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-display font-bold text-xl">
                    R$ {formatPrice(state.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div 
              className="space-y-3 animate-fade-in-up" 
              style={{ animationDelay: '300ms' }}
            >
              <a href={state.whatsappUrl} target="_blank" rel="noopener noreferrer">
                <Button className="w-full btn-gold gap-2 text-lg py-6">
                  <MessageCircle className="h-5 w-5" />
                  Enviar Pedido via WhatsApp
                </Button>
              </a>
              
              <Link to="/">
                <Button variant="outline" className="w-full gap-2">
                  <Home className="h-4 w-4" />
                  Voltar à Loja
                </Button>
              </Link>
            </div>

            {/* Info */}
            <p 
              className="text-sm text-muted-foreground mt-8 animate-fade-in-up"
              style={{ animationDelay: '400ms' }}
            >
              Após enviar o pedido via WhatsApp, você receberá as instruções de pagamento (PIX ou Link de Pagamento).
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
    </>
  );
}
