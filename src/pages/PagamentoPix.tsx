import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Copy, Check, CheckCircle2, Clock, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';

interface LocationState {
  numeroPedido: string;
  total: number;
  clienteNome: string;
}

const PIX_KEY = "33764535865"; // CPF sem formatação
const PIX_KEY_FORMATTED = "337.645.358-65";
const PIX_BENEFICIARIO = "Erica C. M. Bortolin";

export default function PagamentoPix() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const state = location.state as LocationState;

  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedValue, setCopiedValue] = useState(false);

  useEffect(() => {
    if (!state?.numeroPedido) {
      navigate('/');
    }
  }, [state, navigate]);

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

            {/* Dados do PIX */}
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

            {/* Send Proof */}
            <div className="card-elegant p-6 bg-green-50 border-green-200 space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-green-800">Após pagar</h3>
                  <p className="text-sm text-green-700">
                    Envie o comprovante pelo WhatsApp para confirmarmos seu pedido e iniciarmos a preparação.
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