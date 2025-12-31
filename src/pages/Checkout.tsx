import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, User, MapPin, CreditCard, Loader2, Ticket, X } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

// Validation schemas
const dadosPessoaisSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(100),
  email: z.string().email('Email inválido').max(255),
  whatsapp: z.string().min(14, 'WhatsApp inválido').max(15),
  cpf: z.string().min(14, 'CPF inválido').max(14),
});

const enderecoSchema = z.object({
  cep: z.string().min(9, 'CEP inválido').max(9),
  rua: z.string().min(3, 'Rua é obrigatória').max(200),
  numero: z.string().min(1, 'Número é obrigatório').max(10),
  complemento: z.string().max(100).optional(),
  bairro: z.string().min(2, 'Bairro é obrigatório').max(100),
  cidade: z.string().min(2, 'Cidade é obrigatória').max(100),
  estado: z.string().min(2, 'Estado é obrigatório').max(2),
});

interface Endereco {
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
}

interface DadosPessoais {
  nome: string;
  email: string;
  whatsapp: string;
  cpf: string;
}

interface CupomAplicado {
  codigo: string;
  tipo: string;
  valor: number;
  desconto: number;
}

const FRETE_REGIOES: Record<string, number> = {
  SP: 15.90, RJ: 15.90, MG: 15.90, ES: 15.90, // Sudeste
  PR: 19.90, SC: 19.90, RS: 19.90, // Sul
  GO: 19.90, MT: 19.90, MS: 19.90, DF: 19.90, // Centro-Oeste
  BA: 24.90, SE: 24.90, AL: 24.90, PE: 24.90, PB: 24.90, RN: 24.90, CE: 24.90, PI: 24.90, MA: 24.90, // Nordeste
  PA: 24.90, AM: 24.90, AP: 24.90, RR: 24.90, AC: 24.90, RO: 24.90, TO: 24.90, // Norte
};

export default function Checkout() {
  const [step, setStep] = useState(1);
  const [loadingPix, setLoadingPix] = useState(false);
  const [loadingCartao, setLoadingCartao] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Cupom states
  const [cupomCodigo, setCupomCodigo] = useState('');
  const [cupomLoading, setCupomLoading] = useState(false);
  const [cupomAplicado, setCupomAplicado] = useState<CupomAplicado | null>(null);
  
  const [dadosPessoais, setDadosPessoais] = useState<DadosPessoais>({
    nome: '',
    email: '',
    whatsapp: '',
    cpf: '',
  });
  
  const [endereco, setEndereco] = useState<Endereco>({
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
  });

  const { items, getSubtotal, clearCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  const subtotal = getSubtotal();
  const desconto = cupomAplicado?.desconto || 0;
  // Frete grátis: somente se subtotal > 299 OU se cupom de frete grátis foi aplicado
  const freteGratisPorCupom = cupomAplicado?.tipo === 'frete_gratis';
  const freteGratisPorValor = subtotal > 299;
  const temCepValido = endereco.estado && FRETE_REGIOES[endereco.estado] !== undefined;
  const frete = temCepValido 
    ? ((freteGratisPorValor || freteGratisPorCupom) ? 0 : (FRETE_REGIOES[endereco.estado] || 0))
    : 0;
  const total = Math.max(0, subtotal - desconto + frete);

  const isLoading = loadingPix || loadingCartao;
  
  useEffect(() => {
    // Evita redirecionar para Home quando o carrinho é limpo após o pedido ser criado
    if (items.length === 0 && !orderPlaced && !isLoading) {
      navigate('/');
    }
  }, [items.length, orderPlaced, isLoading, navigate]);

  const formatPrice = (price: number) => {
    return price.toFixed(2).replace('.', ',');
  };

  // Máscaras
  const formatWhatsapp = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 8);
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
  };

  const validateCPF = (cpf: string): boolean => {
    const numbers = cpf.replace(/\D/g, '');
    if (numbers.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(numbers)) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(numbers[i]) * (10 - i);
    }
    let digit = (sum * 10) % 11;
    if (digit === 10) digit = 0;
    if (digit !== parseInt(numbers[9])) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(numbers[i]) * (11 - i);
    }
    digit = (sum * 10) % 11;
    if (digit === 10) digit = 0;
    return digit === parseInt(numbers[10]);
  };

  const buscarCEP = async (cep: string) => {
    const cepNumbers = cep.replace(/\D/g, '');
    if (cepNumbers.length !== 8) return;

    setCepLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepNumbers}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        toast({
          title: 'CEP não encontrado',
          description: 'Verifique o CEP digitado.',
          variant: 'destructive',
        });
        return;
      }

      setEndereco(prev => ({
        ...prev,
        rua: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        estado: data.uf || '',
      }));
      
      setErrors(prev => ({ ...prev, cep: '' }));
    } catch {
      toast({
        title: 'Erro ao buscar CEP',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setCepLoading(false);
    }
  };

  const handleDadosPessoaisChange = (field: keyof DadosPessoais, value: string) => {
    let formattedValue = value;
    
    if (field === 'whatsapp') {
      formattedValue = formatWhatsapp(value);
    } else if (field === 'cpf') {
      formattedValue = formatCPF(value);
    }
    
    setDadosPessoais(prev => ({ ...prev, [field]: formattedValue }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleEnderecoChange = (field: keyof Endereco, value: string) => {
    let formattedValue = value;
    
    if (field === 'cep') {
      formattedValue = formatCEP(value);
      if (formattedValue.length === 9) {
        buscarCEP(formattedValue);
      }
    } else if (field === 'estado') {
      formattedValue = value.toUpperCase().slice(0, 2);
    }
    
    setEndereco(prev => ({ ...prev, [field]: formattedValue }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateStep1 = (): boolean => {
    try {
      dadosPessoaisSchema.parse(dadosPessoais);
      
      if (!validateCPF(dadosPessoais.cpf)) {
        setErrors({ cpf: 'CPF inválido' });
        return false;
      }
      
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach(e => {
          if (e.path[0]) {
            newErrors[e.path[0] as string] = e.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const validateStep2 = (): boolean => {
    try {
      enderecoSchema.parse(endereco);
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach(e => {
          if (e.path[0]) {
            newErrors[e.path[0] as string] = e.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const aplicarCupom = async () => {
    if (!cupomCodigo.trim()) {
      toast({
        title: 'Digite um código',
        description: 'Insira o código do cupom.',
        variant: 'destructive',
      });
      return;
    }

    setCupomLoading(true);
    try {
      const { data: cupom, error } = await supabase
        .from('cupons')
        .select('*')
        .eq('codigo', cupomCodigo.toUpperCase().trim())
        .eq('ativo', true)
        .maybeSingle();

      if (error) throw error;

      if (!cupom) {
        toast({
          title: 'Cupom inválido',
          description: 'Este cupom não existe ou está inativo.',
          variant: 'destructive',
        });
        return;
      }

      // Check expiration
      if (cupom.validade && new Date(cupom.validade) < new Date()) {
        toast({
          title: 'Cupom expirado',
          description: 'Este cupom já expirou.',
          variant: 'destructive',
        });
        return;
      }

      // Check usage limit
      if (cupom.uso_maximo && cupom.uso_atual >= cupom.uso_maximo) {
        toast({
          title: 'Cupom esgotado',
          description: 'Este cupom atingiu o limite de uso.',
          variant: 'destructive',
        });
        return;
      }

      // Check minimum value
      if (cupom.valor_minimo && subtotal < Number(cupom.valor_minimo)) {
        toast({
          title: 'Valor mínimo não atingido',
          description: `Este cupom requer um pedido mínimo de R$ ${Number(cupom.valor_minimo).toFixed(2).replace('.', ',')}.`,
          variant: 'destructive',
        });
        return;
      }

      // Calculate discount
      let descontoCalculado = 0;
      if (cupom.tipo === 'percentual') {
        descontoCalculado = subtotal * (Number(cupom.valor) / 100);
      } else if (cupom.tipo === 'frete_gratis') {
        descontoCalculado = 0; // Frete grátis não dá desconto no subtotal, zera o frete
      } else {
        descontoCalculado = Math.min(Number(cupom.valor), subtotal);
      }

      setCupomAplicado({
        codigo: cupom.codigo,
        tipo: cupom.tipo,
        valor: Number(cupom.valor),
        desconto: descontoCalculado,
      });

      const mensagem = cupom.tipo === 'frete_gratis' 
        ? 'Frete grátis aplicado!'
        : `Desconto de R$ ${descontoCalculado.toFixed(2).replace('.', ',')} aplicado.`;

      toast({
        title: 'Cupom aplicado!',
        description: mensagem,
      });

      setCupomCodigo('');
    } catch (error) {
      toast({
        title: 'Erro ao aplicar cupom',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setCupomLoading(false);
    }
  };

  const removerCupom = () => {
    setCupomAplicado(null);
    toast({ title: 'Cupom removido' });
  };

  const generateOrderNumber = () => {
    const now = new Date();
    const date = now.toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.floor(Math.random() * 999).toString().padStart(3, '0');
    return `ELA-${date}-${random}`;
  };

  const handleFinalizarPedido = async (metodoPagamento: 'pix' | 'cartao') => {
    if (!aceitouTermos) {
      toast({
        title: 'Aceite os termos',
        description: 'Você precisa aceitar os termos para continuar.',
        variant: 'destructive',
      });
      return;
    }

    if (metodoPagamento === 'pix') {
      setLoadingPix(true);
    } else {
      setLoadingCartao(true);
    }
    
    try {
      const numeroPedido = generateOrderNumber();

      const enderecoJson = {
        cep: endereco.cep,
        rua: endereco.rua,
        numero: endereco.numero,
        complemento: endereco.complemento,
        bairro: endereco.bairro,
        cidade: endereco.cidade,
        estado: endereco.estado,
      };

      const itensJson = items.map(item => ({
        produto_id: item.id,
        nome: item.nome,
        variacao: item.variacao,
        quantidade: item.quantidade,
        preco: item.preco_promocional ?? item.preco,
      }));

      let paymentId: string | undefined;
      let pixData: { paymentId?: string; qrCode?: string; qrCodeBase64?: string; ticketUrl?: string; expirationDate?: string; success?: boolean; error?: string } | null = null;

      // Para PIX, gerar o pagamento ANTES de criar o pedido para ter o paymentId
      if (metodoPagamento === 'pix') {
        const { data, error: pixError } = await supabase.functions.invoke('create-pix-payment', {
          body: {
            numeroPedido,
            clienteNome: dadosPessoais.nome,
            clienteEmail: dadosPessoais.email,
            clienteCpf: dadosPessoais.cpf,
            total,
            descricao: `Pedido ${numeroPedido} - Elatho Semijoias`,
          },
        });

        if (pixError || !data?.success) {
          // Fallback: continuar sem QR automático (PIX manual)
          console.warn('PIX automático falhou, usando fallback manual:', data?.error || pixError);
        } else {
          pixData = data;
          paymentId = data.paymentId;
        }
      }

      // Registrar pedido no backend
      const { data: orderData, error: orderError } = await supabase.functions.invoke('create-order', {
        body: {
          numeroPedido,
          cliente: {
            nome: dadosPessoais.nome,
            email: dadosPessoais.email,
            whatsapp: dadosPessoais.whatsapp,
            cpf: dadosPessoais.cpf,
          },
          endereco: enderecoJson,
          itens: itensJson,
          subtotal,
          frete,
          total,
          cupomCodigo: cupomAplicado?.codigo,
          metodoPagamento,
          paymentId,
        },
      });

      if (orderError || !orderData?.success) {
        throw new Error(orderData?.error || 'Erro ao registrar pedido');
      }

      // Enviar email de confirmação (não bloqueia o checkout se falhar)
      void supabase.functions.invoke('send-order-email', {
        body: {
          numeroPedido,
          clienteNome: dadosPessoais.nome,
          clienteEmail: dadosPessoais.email,
          clienteWhatsapp: dadosPessoais.whatsapp,
          endereco: {
            rua: endereco.rua,
            numero: endereco.numero,
            complemento: endereco.complemento,
            bairro: endereco.bairro,
            cidade: endereco.cidade,
            estado: endereco.estado,
            cep: endereco.cep,
          },
          itens: items.map(item => ({
            nome: item.nome,
            variacao: item.variacao,
            quantidade: item.quantidade,
            preco: item.preco_promocional ?? item.preco,
          })),
          subtotal,
          desconto: desconto || undefined,
          cupom: cupomAplicado?.codigo || undefined,
          frete,
          total,
        },
      });

      if (metodoPagamento === 'pix') {
        setOrderPlaced(true);
        clearCart();

        // Sempre redirecionar para confirmação (mesmo se o PIX automático falhar)
        navigate(`/pedido-confirmado?numero=${encodeURIComponent(numeroPedido)}`, {
          replace: true,
          state: {
            numeroPedido,
            total,
            subtotal,
            frete,
            desconto,
            metodoPagamento: 'pix',
            itens: itensJson,
            endereco: enderecoJson,
            clienteNome: dadosPessoais.nome,
            // PIX (quando existir)
            pixCopiaECola: pixData?.qrCode,
            pixQrCodeBase64: pixData?.qrCodeBase64,
            pixPaymentId: pixData?.paymentId,
          },
        });
      } else {
        // Cartão parcelado via Mercado Pago
        const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('create-checkout-link', {
          body: {
            numeroPedido,
            clienteNome: dadosPessoais.nome,
            clienteEmail: dadosPessoais.email,
            total,
            itens: items.map(item => ({
              nome: item.nome,
              quantidade: item.quantidade,
              preco: item.preco_promocional ?? item.preco,
            })),
          },
        });

        if (checkoutError || !checkoutData?.success) {
          throw new Error(checkoutData?.details || 'Erro ao gerar link de pagamento');
        }

        clearCart();
        
        // Redirect to Mercado Pago checkout
        window.location.href = checkoutData.checkoutUrl;
      }

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Erro ao finalizar pedido',
        description: error instanceof Error ? error.message : 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setLoadingPix(false);
      setLoadingCartao(false);
    }
  };

  const steps = [
    { number: 1, title: 'Dados Pessoais', icon: User },
    { number: 2, title: 'Endereço', icon: MapPin },
    { number: 3, title: 'Revisão', icon: CreditCard },
  ];

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 md:pt-24">
        <div className="container px-4 py-8">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6"
          >
            <ChevronLeft className="h-4 w-4" />
            Continuar comprando
          </Link>

          <h1 className="text-3xl font-display font-bold mb-8">Finalizar Compra</h1>

          {/* Steps indicator */}
          <div className="flex items-center justify-center mb-12">
            {steps.map((s, index) => {
              const Icon = s.icon;
              const isActive = step === s.number;
              const isCompleted = step > s.number;
              
              return (
                <div key={s.number} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        isCompleted
                          ? 'bg-gradient-gold text-primary-foreground'
                          : isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-accent text-muted-foreground'
                      }`}
                    >
                      {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <span className={`text-sm mt-2 ${isActive ? 'font-medium text-primary' : 'text-muted-foreground'}`}>
                      {s.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 md:w-24 h-0.5 mx-2 ${step > s.number ? 'bg-primary' : 'bg-border'}`} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2">
              <div className="card-elegant p-6 md:p-8">
                {/* Step 1: Dados Pessoais */}
                {step === 1 && (
                  <div className="space-y-6 animate-fade-in">
                    <h2 className="text-xl font-display font-semibold">Dados Pessoais</h2>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <Label htmlFor="nome">Nome completo *</Label>
                        <Input
                          id="nome"
                          value={dadosPessoais.nome}
                          onChange={(e) => handleDadosPessoaisChange('nome', e.target.value)}
                          placeholder="Seu nome completo"
                          className={`input-elegant mt-1 ${errors.nome ? 'border-destructive' : ''}`}
                        />
                        {errors.nome && <p className="text-sm text-destructive mt-1">{errors.nome}</p>}
                      </div>
                      
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={dadosPessoais.email}
                          onChange={(e) => handleDadosPessoaisChange('email', e.target.value)}
                          placeholder="seu@email.com"
                          className={`input-elegant mt-1 ${errors.email ? 'border-destructive' : ''}`}
                        />
                        {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                      </div>
                      
                      <div>
                        <Label htmlFor="whatsapp">WhatsApp *</Label>
                        <Input
                          id="whatsapp"
                          value={dadosPessoais.whatsapp}
                          onChange={(e) => handleDadosPessoaisChange('whatsapp', e.target.value)}
                          placeholder="(11) 99999-9999"
                          className={`input-elegant mt-1 ${errors.whatsapp ? 'border-destructive' : ''}`}
                        />
                        {errors.whatsapp && <p className="text-sm text-destructive mt-1">{errors.whatsapp}</p>}
                      </div>
                      
                      <div>
                        <Label htmlFor="cpf">CPF *</Label>
                        <Input
                          id="cpf"
                          value={dadosPessoais.cpf}
                          onChange={(e) => handleDadosPessoaisChange('cpf', e.target.value)}
                          placeholder="000.000.000-00"
                          className={`input-elegant mt-1 ${errors.cpf ? 'border-destructive' : ''}`}
                        />
                        {errors.cpf && <p className="text-sm text-destructive mt-1">{errors.cpf}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Endereço */}
                {step === 2 && (
                  <div className="space-y-6 animate-fade-in">
                    <h2 className="text-xl font-display font-semibold">Endereço de Entrega</h2>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="relative">
                        <Label htmlFor="cep">CEP *</Label>
                        <Input
                          id="cep"
                          value={endereco.cep}
                          onChange={(e) => handleEnderecoChange('cep', e.target.value)}
                          placeholder="00000-000"
                          className={`input-elegant mt-1 ${errors.cep ? 'border-destructive' : ''}`}
                        />
                        {cepLoading && (
                          <Loader2 className="absolute right-3 top-9 h-4 w-4 animate-spin text-primary" />
                        )}
                        {errors.cep && <p className="text-sm text-destructive mt-1">{errors.cep}</p>}
                      </div>
                      
                      <div className="sm:col-span-2">
                        <Label htmlFor="rua">Rua *</Label>
                        <Input
                          id="rua"
                          value={endereco.rua}
                          onChange={(e) => handleEnderecoChange('rua', e.target.value)}
                          placeholder="Nome da rua"
                          className={`input-elegant mt-1 ${errors.rua ? 'border-destructive' : ''}`}
                        />
                        {errors.rua && <p className="text-sm text-destructive mt-1">{errors.rua}</p>}
                      </div>
                      
                      <div>
                        <Label htmlFor="numero">Número *</Label>
                        <Input
                          id="numero"
                          value={endereco.numero}
                          onChange={(e) => handleEnderecoChange('numero', e.target.value)}
                          placeholder="123"
                          className={`input-elegant mt-1 ${errors.numero ? 'border-destructive' : ''}`}
                        />
                        {errors.numero && <p className="text-sm text-destructive mt-1">{errors.numero}</p>}
                      </div>
                      
                      <div>
                        <Label htmlFor="complemento">Complemento</Label>
                        <Input
                          id="complemento"
                          value={endereco.complemento}
                          onChange={(e) => handleEnderecoChange('complemento', e.target.value)}
                          placeholder="Apto, bloco, etc."
                          className="input-elegant mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="bairro">Bairro *</Label>
                        <Input
                          id="bairro"
                          value={endereco.bairro}
                          onChange={(e) => handleEnderecoChange('bairro', e.target.value)}
                          placeholder="Nome do bairro"
                          className={`input-elegant mt-1 ${errors.bairro ? 'border-destructive' : ''}`}
                        />
                        {errors.bairro && <p className="text-sm text-destructive mt-1">{errors.bairro}</p>}
                      </div>
                      
                      <div>
                        <Label htmlFor="cidade">Cidade *</Label>
                        <Input
                          id="cidade"
                          value={endereco.cidade}
                          onChange={(e) => handleEnderecoChange('cidade', e.target.value)}
                          placeholder="Nome da cidade"
                          className={`input-elegant mt-1 ${errors.cidade ? 'border-destructive' : ''}`}
                        />
                        {errors.cidade && <p className="text-sm text-destructive mt-1">{errors.cidade}</p>}
                      </div>
                      
                      <div>
                        <Label htmlFor="estado">Estado *</Label>
                        <Input
                          id="estado"
                          value={endereco.estado}
                          onChange={(e) => handleEnderecoChange('estado', e.target.value)}
                          placeholder="SP"
                          maxLength={2}
                          className={`input-elegant mt-1 ${errors.estado ? 'border-destructive' : ''}`}
                        />
                        {errors.estado && <p className="text-sm text-destructive mt-1">{errors.estado}</p>}
                      </div>
                    </div>

                    {/* Frete info */}
                    {endereco.estado && (
                      <div className="p-4 rounded-xl bg-accent/50 border border-border">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Frete para {endereco.estado}:</span>
                          <span className="font-semibold text-primary">
                            {frete === 0 ? 'Grátis!' : `R$ ${formatPrice(frete)}`}
                          </span>
                        </div>
                        {subtotal < 299 && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Faltam R$ {formatPrice(299 - subtotal)} para frete grátis!
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Revisão */}
                {step === 3 && (
                  <div className="space-y-6 animate-fade-in">
                    <h2 className="text-xl font-display font-semibold">Revisão do Pedido</h2>
                    
                    {/* Dados do cliente */}
                    <div className="p-4 rounded-xl bg-accent/30 space-y-2">
                      <h3 className="font-medium flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        Dados Pessoais
                      </h3>
                      <p className="text-sm text-muted-foreground">{dadosPessoais.nome}</p>
                      <p className="text-sm text-muted-foreground">{dadosPessoais.email}</p>
                      <p className="text-sm text-muted-foreground">{dadosPessoais.whatsapp}</p>
                    </div>
                    
                    {/* Endereço */}
                    <div className="p-4 rounded-xl bg-accent/30 space-y-2">
                      <h3 className="font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        Endereço de Entrega
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {endereco.rua}, {endereco.numero}
                        {endereco.complemento && `, ${endereco.complemento}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {endereco.bairro} - {endereco.cidade}/{endereco.estado}
                      </p>
                      <p className="text-sm text-muted-foreground">CEP: {endereco.cep}</p>
                    </div>

                    {/* Itens */}
                    <div className="space-y-3">
                      <h3 className="font-medium">Itens do Pedido</h3>
                      {items.map((item) => (
                        <div 
                          key={`${item.id}-${item.variacao}`}
                          className="flex items-center gap-3 p-3 rounded-xl bg-accent/30"
                        >
                          <img
                            src={item.imagem_url || '/placeholder.svg'}
                            alt={item.nome}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <p className="font-medium">{item.nome}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.variacao} • Qtd: {item.quantidade}
                            </p>
                          </div>
                          <p className="font-semibold text-primary">
                            R$ {formatPrice((item.preco_promocional ?? item.preco) * item.quantidade)}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Pagamento */}
                    <div className="p-4 rounded-xl bg-champagne/30 border border-primary/20">
                      <h3 className="font-medium text-primary mb-3">💳 Formas de Pagamento</h3>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p><strong>PIX:</strong> Pagamento instantâneo com QR Code</p>
                        <p><strong>Cartão:</strong> Parcele em até 10x no cartão via Mercado Pago</p>
                      </div>
                    </div>

                    {/* Termos */}
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="termos"
                        checked={aceitouTermos}
                        onCheckedChange={(checked) => setAceitouTermos(checked === true)}
                      />
                      <label htmlFor="termos" className="text-sm text-muted-foreground cursor-pointer">
                        Li e aceito os{' '}
                        <Link to="/trocas" className="text-primary hover:underline">
                          termos de uso
                        </Link>{' '}
                        e{' '}
                        <Link to="/privacidade" className="text-primary hover:underline">
                          política de privacidade
                        </Link>
                      </label>
                    </div>
                  </div>
                )}

                {/* Navigation buttons */}
                <div className="flex flex-col gap-4 mt-8 pt-6 border-t border-border">
                  {step < 3 ? (
                    <div className="flex justify-between">
                      {step > 1 ? (
                        <Button variant="outline" onClick={handleBack} className="gap-2">
                          <ChevronLeft className="h-4 w-4" />
                          Voltar
                        </Button>
                      ) : (
                        <div />
                      )}
                      <Button onClick={handleNext} className="btn-gold gap-2">
                        Continuar
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <Button 
                          onClick={() => handleFinalizarPedido('pix')} 
                          className="btn-gold gap-2"
                          disabled={isLoading || !aceitouTermos}
                        >
                          {loadingPix ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CreditCard className="h-4 w-4" />
                              Pagar com PIX
                            </>
                          )}
                        </Button>
                        <Button 
                          onClick={() => handleFinalizarPedido('cartao')} 
                          variant="outline"
                          className="gap-2 border-primary text-primary hover:bg-primary/5"
                          disabled={isLoading || !aceitouTermos}
                        >
                          {loadingCartao ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CreditCard className="h-4 w-4" />
                              Cartão (até 10x)
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="flex justify-start">
                        <Button variant="outline" onClick={handleBack} className="gap-2">
                          <ChevronLeft className="h-4 w-4" />
                          Voltar
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="card-elegant p-6 sticky top-24">
                <h3 className="font-display font-semibold text-lg mb-4">Resumo do Pedido</h3>
                
                <div className="space-y-3 mb-4">
                  {items.map((item) => (
                    <div key={`${item.id}-${item.variacao}`} className="flex items-center gap-3">
                      <img
                        src={item.imagem_url || '/placeholder.svg'}
                        alt={item.nome}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.variacao} × {item.quantidade}
                        </p>
                      </div>
                      <p className="text-sm font-semibold">
                        R$ {formatPrice((item.preco_promocional ?? item.preco) * item.quantidade)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Cupom input */}
                <div className="border-t border-border pt-4 mb-4">
                  <Label htmlFor="cupom" className="text-sm font-medium mb-2 block">Cupom de desconto</Label>
                  {cupomAplicado ? (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Ticket className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">{cupomAplicado.codigo}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-green-600">-R$ {formatPrice(desconto)}</span>
                        <button onClick={removerCupom} className="text-red-500 hover:text-red-700">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        id="cupom"
                        value={cupomCodigo}
                        onChange={(e) => setCupomCodigo(e.target.value.toUpperCase())}
                        placeholder="CÓDIGO"
                        className="flex-1 uppercase"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={aplicarCupom}
                        disabled={cupomLoading}
                      >
                        {cupomLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Aplicar'}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>R$ {formatPrice(subtotal)}</span>
                  </div>
                  {cupomAplicado && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Desconto ({cupomAplicado.codigo})</span>
                      <span>-R$ {formatPrice(desconto)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Frete</span>
                    <span className={frete === 0 && temCepValido ? 'text-green-600 font-medium' : ''}>
                      {!temCepValido
                        ? 'Aguardando CEP'
                        : frete === 0 
                          ? (freteGratisPorCupom ? 'R$ 0,00 (cupom)' : 'Grátis') 
                          : `R$ ${formatPrice(frete)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-display font-bold pt-2 border-t border-border">
                    <span>Total</span>
                    <span className="text-primary">R$ {formatPrice(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
