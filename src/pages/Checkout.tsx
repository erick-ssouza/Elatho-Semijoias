import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

interface DadosCartao {
  numero: string;
  nome: string;
  validade: string;
  cvv: string;
}

const FRETE_REGIOES: Record<string, number> = {
  SP: 15.90, RJ: 15.90, MG: 15.90, ES: 15.90, // Sudeste
  PR: 19.90, SC: 19.90, RS: 19.90, // Sul
  GO: 19.90, MT: 19.90, MS: 19.90, DF: 19.90, // Centro-Oeste
  BA: 24.90, SE: 24.90, AL: 24.90, PE: 24.90, PB: 24.90, RN: 24.90, CE: 24.90, PI: 24.90, MA: 24.90, // Nordeste
  PA: 24.90, AM: 24.90, AP: 24.90, RR: 24.90, AC: 24.90, RO: 24.90, TO: 24.90, // Norte
};

const CHECKOUT_STORAGE_KEY = 'elatho_checkout_data';

type CheckoutStepKey = 'personal' | 'address' | 'review' | 'payment';

interface CheckoutStorageDataV2 {
  version: 2;
  step: CheckoutStepKey;
  dadosPessoais: DadosPessoais;
  endereco: Endereco;
  paymentMethod?: 'pix' | 'cartao';
  numeroPedido?: string;
  updatedAt: string;
}

const stepNumberToKey = (n: number): CheckoutStepKey =>
  n === 2 ? 'address' : n === 3 ? 'review' : n === 4 ? 'payment' : 'personal';

const stepKeyToNumber = (k?: string | null): number =>
  k === 'address' ? 2 : k === 'review' ? 3 : k === 'payment' ? 4 : 1;

const readCheckoutStorage = (): CheckoutStorageDataV2 | null => {
  try {
    const stored = localStorage.getItem(CHECKOUT_STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as any;

    if (typeof parsed?.step === 'number') {
      return {
        version: 2,
        step: stepNumberToKey(parsed.step),
        dadosPessoais: parsed.dadosPessoais ?? { nome: '', email: '', whatsapp: '', cpf: '' },
        endereco:
          parsed.endereco ??
          ({
            cep: '',
            rua: '',
            numero: '',
            complemento: '',
            bairro: '',
            cidade: '',
            estado: '',
          } as Endereco),
        paymentMethod: parsed.paymentMethod,
        numeroPedido: parsed.numeroPedido,
        updatedAt: new Date().toISOString(),
      };
    }

    if (parsed?.version === 2) return parsed as CheckoutStorageDataV2;
    return null;
  } catch {
    return null;
  }
};

// Calculate installment values with interest
function calculateInstallments(total: number): Array<{ parcelas: number; valor: number; total: number; temJuros: boolean }> {
  const result: Array<{ parcelas: number; valor: number; total: number; temJuros: boolean }> = [];
  
  for (let p = 1; p <= 10; p++) {
    if (p <= 4) {
      // Sem juros
      const valorParcela = Math.round((total / p) * 100) / 100;
      result.push({ parcelas: p, valor: valorParcela, total, temJuros: false });
    } else {
      // Com juros de 2% a.m.
      const taxa = 0.02;
      const fator = (taxa * Math.pow(1 + taxa, p)) / (Math.pow(1 + taxa, p) - 1);
      const valorParcela = Math.round((total * fator) * 100) / 100;
      const totalComJuros = Math.round(valorParcela * p * 100) / 100;
      result.push({ parcelas: p, valor: valorParcela, total: totalComJuros, temJuros: true });
    }
  }
  
  return result;
}

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
  
  // Card payment states
  const [showCardForm, setShowCardForm] = useState(false);
  const [parcelas, setParcelas] = useState(1);
  const [dadosCartao, setDadosCartao] = useState<DadosCartao>({
    numero: '',
    nome: '',
    validade: '',
    cvv: '',
  });
  
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

  const { items, getSubtotal } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'cartao' | null>(null);

  // Restaurar dados do checkout do localStorage
  useEffect(() => {
    const stored = readCheckoutStorage();
    if (stored) {
      if (stored.dadosPessoais) setDadosPessoais(stored.dadosPessoais);
      if (stored.endereco) setEndereco(stored.endereco);
      if (stored.paymentMethod) setPaymentMethod(stored.paymentMethod);
      setStep(stepKeyToNumber(stored.step));
    }

    const params = new URLSearchParams(location.search);
    const stepParam = params.get('step');
    if (stepParam) {
      setStep(stepKeyToNumber(stepParam));
    }
  }, [location.search]);

  // Salvar dados do checkout no localStorage quando mudarem
  useEffect(() => {
    const hasData = dadosPessoais.nome || dadosPessoais.email || endereco.cep;
    if (!hasData) return;

    const data: CheckoutStorageDataV2 = {
      version: 2,
      step: stepNumberToKey(step),
      dadosPessoais,
      endereco,
      paymentMethod: paymentMethod ?? undefined,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(data));
  }, [dadosPessoais, endereco, step, paymentMethod]);

  const subtotal = getSubtotal();
  const descontoCupom = cupomAplicado?.desconto || 0;
  const freteGratisPorCupom = cupomAplicado?.tipo === 'frete_gratis';
  const freteGratisPorValor = subtotal > 299;
  const temCepValido = endereco.estado && FRETE_REGIOES[endereco.estado] !== undefined;
  const frete = temCepValido 
    ? ((freteGratisPorValor || freteGratisPorCupom) ? 0 : (FRETE_REGIOES[endereco.estado] || 0))
    : 0;
  
  const totalBase = Math.max(0, subtotal - descontoCupom + frete);
  const descontoPix = totalBase * 0.05;
  const totalComPix = totalBase - descontoPix;
  const total = totalBase;

  // Calculate installments for card payment
  const parcelasOptions = calculateInstallments(totalBase);

  const isLoading = loadingPix || loadingCartao;
  
  useEffect(() => {
    if (items.length === 0 && !orderPlaced && !isLoading) {
      navigate('/');
    }
  }, [items.length, orderPlaced, isLoading, navigate]);

  const persistCheckoutData = (overrides: Partial<CheckoutStorageDataV2> = {}) => {
    const payload: CheckoutStorageDataV2 = {
      version: 2,
      step: stepNumberToKey(step),
      dadosPessoais,
      endereco,
      paymentMethod: paymentMethod ?? undefined,
      updatedAt: new Date().toISOString(),
      ...overrides,
    };

    localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(payload));
  };

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

  const formatCardNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 16);
    return numbers.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  };

  const formatCardExpiry = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 4);
    if (numbers.length <= 2) return numbers;
    return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
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

  const viaCepSchema = z.object({
    cep: z.string().optional(),
    logradouro: z.string().optional(),
    bairro: z.string().optional(),
    localidade: z.string().optional(),
    uf: z.string().length(2).optional(),
    erro: z.boolean().optional(),
  });

  const buscarCEP = async (cep: string) => {
    const cepNumbers = cep.replace(/\D/g, '');
    if (cepNumbers.length !== 8) return;

    setCepLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepNumbers}/json/`);
      const rawData = await response.json();
      
      const parseResult = viaCepSchema.safeParse(rawData);
      if (!parseResult.success) {
        toast({
          title: 'Erro ao buscar CEP',
          description: 'Resposta inválida do serviço de CEP.',
          variant: 'destructive',
        });
        return;
      }
      
      const data = parseResult.data;
      
      if (data.erro) {
        toast({
          title: 'CEP não encontrado',
          description: 'Verifique o CEP digitado.',
          variant: 'destructive',
        });
        return;
      }

      const validUFs = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
      const uf = data.uf?.toUpperCase() || '';
      
      if (uf && !validUFs.includes(uf)) {
        toast({
          title: 'Estado inválido',
          description: 'O estado retornado pelo CEP é inválido.',
          variant: 'destructive',
        });
        return;
      }

      setEndereco(prev => ({
        ...prev,
        rua: (data.logradouro || '').slice(0, 200),
        bairro: (data.bairro || '').slice(0, 100),
        cidade: (data.localidade || '').slice(0, 100),
        estado: uf.slice(0, 2),
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

  const handleCardChange = (field: keyof DadosCartao, value: string) => {
    let formattedValue = value;
    
    if (field === 'numero') {
      formattedValue = formatCardNumber(value);
    } else if (field === 'validade') {
      formattedValue = formatCardExpiry(value);
    } else if (field === 'cvv') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    }
    
    setDadosCartao(prev => ({ ...prev, [field]: formattedValue }));
    setErrors(prev => ({ ...prev, [`card_${field}`]: '' }));
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

  const validateCard = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    const cardNumbers = dadosCartao.numero.replace(/\s/g, '');
    if (cardNumbers.length < 13 || cardNumbers.length > 16) {
      newErrors.card_numero = 'Número do cartão inválido';
    }
    
    if (!dadosCartao.nome.trim() || dadosCartao.nome.length < 3) {
      newErrors.card_nome = 'Nome no cartão é obrigatório';
    }
    
    const validadeNumbers = dadosCartao.validade.replace(/\D/g, '');
    if (validadeNumbers.length !== 4) {
      newErrors.card_validade = 'Validade inválida';
    } else {
      const month = parseInt(validadeNumbers.slice(0, 2));
      const year = parseInt('20' + validadeNumbers.slice(2));
      const now = new Date();
      const cardDate = new Date(year, month - 1);
      if (month < 1 || month > 12 || cardDate < now) {
        newErrors.card_validade = 'Cartão expirado ou validade inválida';
      }
    }
    
    if (dadosCartao.cvv.length < 3) {
      newErrors.card_cvv = 'CVV inválido';
    }
    
    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (showCardForm) {
      setShowCardForm(false);
    } else if (step > 1) {
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

      if (cupom.validade && new Date(cupom.validade) < new Date()) {
        toast({
          title: 'Cupom expirado',
          description: 'Este cupom já expirou.',
          variant: 'destructive',
        });
        return;
      }

      if (cupom.uso_maximo && cupom.uso_atual >= cupom.uso_maximo) {
        toast({
          title: 'Cupom esgotado',
          description: 'Este cupom atingiu o limite de uso.',
          variant: 'destructive',
        });
        return;
      }

      if (cupom.valor_minimo && subtotal < Number(cupom.valor_minimo)) {
        toast({
          title: 'Valor mínimo não atingido',
          description: `Este cupom requer um pedido mínimo de R$ ${Number(cupom.valor_minimo).toFixed(2).replace('.', ',')}.`,
          variant: 'destructive',
        });
        return;
      }

      let descontoCalculado = 0;
      if (cupom.tipo === 'percentual') {
        descontoCalculado = subtotal * (Number(cupom.valor) / 100);
      } else if (cupom.tipo === 'frete_gratis') {
        descontoCalculado = 0;
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

    // For card, show card form first
    if (metodoPagamento === 'cartao' && !showCardForm) {
      setShowCardForm(true);
      setPaymentMethod('cartao');
      return;
    }

    // Validate card if card payment
    if (metodoPagamento === 'cartao' && !validateCard()) {
      return;
    }

    setPaymentMethod(metodoPagamento);

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

      // Step 1: Create customer in Asaas
      const { data: customerData, error: customerError } = await supabase.functions.invoke('create-asaas-customer', {
        body: {
          nome: dadosPessoais.nome,
          email: dadosPessoais.email,
          telefone: dadosPessoais.whatsapp,
          cpf: dadosPessoais.cpf,
        },
      });

      if (customerError || !customerData?.success) {
        throw new Error(customerData?.error || 'Erro ao criar cliente');
      }

      const customerId = customerData.customerId;
      let paymentId: string | undefined;
      let pixData: { paymentId?: string; pixCopiaECola?: string; qrCodeBase64?: string; expirationDate?: string } | null = null;

      const totalFinal = metodoPagamento === 'pix' ? totalComPix : totalBase;

      if (metodoPagamento === 'pix') {
        // Step 2a: Create PIX payment
        const { data: pixPaymentData, error: pixError } = await supabase.functions.invoke('create-asaas-pix-payment', {
          body: {
            customerId,
            valor: totalFinal,
            numeroPedido,
            descricao: `Pedido ${numeroPedido} - Elatho Semijoias`,
          },
        });

        if (pixError || !pixPaymentData?.success) {
          throw new Error(pixPaymentData?.error || 'Erro ao criar pagamento PIX');
        }

        pixData = pixPaymentData;
        paymentId = pixPaymentData.paymentId;
      } else {
        // Step 2b: Create card payment
        const validadeNumbers = dadosCartao.validade.replace(/\D/g, '');
        
        const { data: cardPaymentData, error: cardError } = await supabase.functions.invoke('create-asaas-card-payment', {
          body: {
            customerId,
            valor: totalFinal,
            parcelas,
            numeroPedido,
            descricao: `Pedido ${numeroPedido} - Elatho Semijoias`,
            cartao: {
              holderName: dadosCartao.nome,
              number: dadosCartao.numero.replace(/\s/g, ''),
              expiryMonth: validadeNumbers.slice(0, 2),
              expiryYear: validadeNumbers.slice(2),
              ccv: dadosCartao.cvv,
            },
            holderInfo: {
              name: dadosPessoais.nome,
              email: dadosPessoais.email,
              cpf: dadosPessoais.cpf,
              cep: endereco.cep,
              addressNumber: endereco.numero,
              phone: dadosPessoais.whatsapp,
            },
          },
        });

        if (cardError || !cardPaymentData?.success) {
          throw new Error(cardPaymentData?.error || 'Erro ao processar pagamento com cartão');
        }

        paymentId = cardPaymentData.paymentId;

        // If card payment was rejected
        if (!cardPaymentData.isApproved && cardPaymentData.status !== 'PENDING') {
          throw new Error('Pagamento recusado. Verifique os dados do cartão e tente novamente.');
        }
      }

      // Step 3: Register order in database
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
          total: totalFinal,
          cupomCodigo: cupomAplicado?.codigo,
          metodoPagamento,
          paymentId,
        },
      });

      if (orderError || !orderData?.success) {
        throw new Error(orderData?.error || 'Erro ao registrar pedido');
      }

      persistCheckoutData({
        step: 'review',
        paymentMethod: metodoPagamento,
        numeroPedido,
      });

      setOrderPlaced(true);

      if (metodoPagamento === 'pix') {
        navigate(`/pedido-confirmado?numero=${encodeURIComponent(numeroPedido)}`, {
          replace: false,
          state: {
            numeroPedido,
            total: totalFinal,
            subtotal,
            frete,
            desconto: descontoCupom,
            descontoPix: descontoPix,
            metodoPagamento: 'pix',
            itens: itensJson,
            endereco: enderecoJson,
            clienteNome: dadosPessoais.nome,
            pixCopiaECola: pixData?.pixCopiaECola,
            pixQrCodeBase64: pixData?.qrCodeBase64,
            pixPaymentId: pixData?.paymentId,
          },
        });
      } else {
        // Card payment - navigate to confirmation
        navigate(`/pedido-confirmado?numero=${encodeURIComponent(numeroPedido)}`, {
          replace: false,
          state: {
            numeroPedido,
            total: totalFinal,
            subtotal,
            frete,
            desconto: descontoCupom,
            metodoPagamento: 'cartao',
            itens: itensJson,
            endereco: enderecoJson,
            clienteNome: dadosPessoais.nome,
          },
        });
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
                {step === 3 && !showCardForm && (
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
                        <p><strong>PIX (5% de desconto):</strong> Pagamento instantâneo com QR Code - <span className="text-green-600 font-medium">R$ {formatPrice(totalComPix)}</span></p>
                        <p><strong>Cartão:</strong> Parcele em até 10x (sem juros até 4x) - R$ {formatPrice(totalBase)}</p>
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

                {/* Card Form */}
                {step === 3 && showCardForm && (
                  <div className="space-y-6 animate-fade-in">
                    <h2 className="text-xl font-display font-semibold">Dados do Cartão</h2>
                    
                    <div className="grid gap-4">
                      <div>
                        <Label htmlFor="cardNumber">Número do Cartão *</Label>
                        <Input
                          id="cardNumber"
                          value={dadosCartao.numero}
                          onChange={(e) => handleCardChange('numero', e.target.value)}
                          placeholder="0000 0000 0000 0000"
                          className={`input-elegant mt-1 ${errors.card_numero ? 'border-destructive' : ''}`}
                        />
                        {errors.card_numero && <p className="text-sm text-destructive mt-1">{errors.card_numero}</p>}
                      </div>
                      
                      <div>
                        <Label htmlFor="cardName">Nome no Cartão *</Label>
                        <Input
                          id="cardName"
                          value={dadosCartao.nome}
                          onChange={(e) => handleCardChange('nome', e.target.value.toUpperCase())}
                          placeholder="NOME COMO ESTÁ NO CARTÃO"
                          className={`input-elegant mt-1 uppercase ${errors.card_nome ? 'border-destructive' : ''}`}
                        />
                        {errors.card_nome && <p className="text-sm text-destructive mt-1">{errors.card_nome}</p>}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="cardExpiry">Validade *</Label>
                          <Input
                            id="cardExpiry"
                            value={dadosCartao.validade}
                            onChange={(e) => handleCardChange('validade', e.target.value)}
                            placeholder="MM/AA"
                            className={`input-elegant mt-1 ${errors.card_validade ? 'border-destructive' : ''}`}
                          />
                          {errors.card_validade && <p className="text-sm text-destructive mt-1">{errors.card_validade}</p>}
                        </div>
                        
                        <div>
                          <Label htmlFor="cardCvv">CVV *</Label>
                          <Input
                            id="cardCvv"
                            value={dadosCartao.cvv}
                            onChange={(e) => handleCardChange('cvv', e.target.value)}
                            placeholder="123"
                            className={`input-elegant mt-1 ${errors.card_cvv ? 'border-destructive' : ''}`}
                          />
                          {errors.card_cvv && <p className="text-sm text-destructive mt-1">{errors.card_cvv}</p>}
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="parcelas">Parcelas *</Label>
                        <Select value={parcelas.toString()} onValueChange={(v) => setParcelas(parseInt(v))}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Selecione as parcelas" />
                          </SelectTrigger>
                          <SelectContent>
                            {parcelasOptions.map((opt) => (
                              <SelectItem key={opt.parcelas} value={opt.parcelas.toString()}>
                                {opt.parcelas}x de R$ {formatPrice(opt.valor)} 
                                {opt.temJuros ? ` (R$ ${formatPrice(opt.total)})` : ' (sem juros)'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-accent/50 border border-border">
                      <p className="text-sm text-muted-foreground">
                        🔒 Seus dados são protegidos e criptografados
                      </p>
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
                  ) : showCardForm ? (
                    <>
                      <Button 
                        onClick={() => handleFinalizarPedido('cartao')} 
                        className="w-full btn-gold gap-2"
                        disabled={isLoading}
                      >
                        {loadingCartao ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CreditCard className="h-4 w-4" />
                            Pagar R$ {formatPrice(parcelasOptions.find(p => p.parcelas === parcelas)?.total || totalBase)}
                          </>
                        )}
                      </Button>
                      <Button variant="outline" onClick={handleBack} className="gap-2">
                        <ChevronLeft className="h-4 w-4" />
                        Voltar
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-col gap-3">
                        <Button 
                          onClick={() => handleFinalizarPedido('pix')} 
                          className="w-full btn-gold gap-2 flex-col h-auto py-3"
                          disabled={isLoading || !aceitouTermos}
                        >
                          {loadingPix ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4" />
                                Pagar com PIX (5% off)
                              </div>
                              <span className="text-xs opacity-90">R$ {formatPrice(totalComPix)}</span>
                            </>
                          )}
                        </Button>
                        <Button 
                          onClick={() => handleFinalizarPedido('cartao')} 
                          variant="outline"
                          className="w-full gap-2"
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
                        <span className="text-sm text-green-600">-R$ {formatPrice(descontoCupom)}</span>
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
                      <span>-R$ {formatPrice(descontoCupom)}</span>
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
                  {step === 3 && !showCardForm && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Desconto PIX (5%)</span>
                      <span>-R$ {formatPrice(descontoPix)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-display font-bold pt-2 border-t border-border">
                    <span>Total</span>
                    <span className="text-primary">R$ {formatPrice(total)}</span>
                  </div>
                  {step === 3 && !showCardForm && (
                    <div className="flex justify-between text-sm text-green-600 bg-green-50 p-2 rounded-lg -mx-2">
                      <span className="font-medium">Total no PIX</span>
                      <span className="font-bold">R$ {formatPrice(totalComPix)}</span>
                    </div>
                  )}
                  {showCardForm && parcelas > 1 && (
                    <div className="text-sm text-muted-foreground bg-accent/50 p-2 rounded-lg -mx-2">
                      <span>{parcelas}x de R$ {formatPrice(parcelasOptions.find(p => p.parcelas === parcelas)?.valor || 0)}</span>
                      {parcelas > 4 && (
                        <span className="text-xs block mt-1">
                          Total: R$ {formatPrice(parcelasOptions.find(p => p.parcelas === parcelas)?.total || 0)}
                        </span>
                      )}
                    </div>
                  )}
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
