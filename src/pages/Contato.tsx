import { useState } from 'react';
import { Send, Phone, Mail, Instagram, MapPin, Clock, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const contatoSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(100),
  email: z.string().email('Email inválido').max(255),
  assunto: z.string().min(1, 'Selecione um assunto'),
  mensagem: z.string().min(10, 'Mensagem deve ter pelo menos 10 caracteres').max(1000),
});

export default function Contato() {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    assunto: '',
    mensagem: '',
  });
  const { toast } = useToast();

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      contatoSchema.parse(formData);
      setErrors({});
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach(e => {
          if (e.path[0]) {
            newErrors[e.path[0] as string] = e.message;
          }
        });
        setErrors(newErrors);
        return;
      }
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('mensagens')
        .insert({
          nome: formData.nome,
          email: formData.email,
          assunto: formData.assunto,
          mensagem: formData.mensagem,
        });

      if (error) throw error;

      toast({
        title: 'Mensagem enviada!',
        description: 'Retornaremos em até 24 horas úteis.',
      });

      setFormData({ nome: '', email: '', assunto: '', mensagem: '' });
    } catch {
      toast({
        title: 'Erro ao enviar',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 md:pt-24">
        {/* Hero */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-champagne/30 to-background">
          <div className="container px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-6 animate-fade-in">
              Entre em <span className="text-gradient-gold">Contato</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in-up">
              Estamos aqui para ajudar. Envie sua mensagem ou fale conosco pelos nossos canais.
            </p>
          </div>
        </section>

        {/* Conteúdo */}
        <section className="py-16 md:py-20">
          <div className="container px-4">
            <div className="grid lg:grid-cols-2 gap-12">
              
              {/* Formulário */}
              <div>
                <h2 className="text-2xl font-display font-semibold mb-6">Envie sua mensagem</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="nome">Nome completo *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => handleChange('nome', e.target.value)}
                      placeholder="Seu nome"
                      className={`input-elegant mt-1 ${errors.nome ? 'border-destructive' : ''}`}
                    />
                    {errors.nome && <p className="text-sm text-destructive mt-1">{errors.nome}</p>}
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="seu@email.com"
                      className={`input-elegant mt-1 ${errors.email ? 'border-destructive' : ''}`}
                    />
                    {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <Label htmlFor="assunto">Assunto *</Label>
                    <Select value={formData.assunto} onValueChange={(value) => handleChange('assunto', value)}>
                      <SelectTrigger className={`input-elegant mt-1 ${errors.assunto ? 'border-destructive' : ''}`}>
                        <SelectValue placeholder="Selecione um assunto" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="duvida">Dúvida sobre produtos</SelectItem>
                        <SelectItem value="pedido">Informações sobre pedido</SelectItem>
                        <SelectItem value="troca">Troca ou devolução</SelectItem>
                        <SelectItem value="parceria">Proposta de parceria</SelectItem>
                        <SelectItem value="elogio">Elogio ou sugestão</SelectItem>
                        <SelectItem value="outro">Outro assunto</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.assunto && <p className="text-sm text-destructive mt-1">{errors.assunto}</p>}
                  </div>

                  <div>
                    <Label htmlFor="mensagem">Mensagem *</Label>
                    <Textarea
                      id="mensagem"
                      value={formData.mensagem}
                      onChange={(e) => handleChange('mensagem', e.target.value)}
                      placeholder="Escreva sua mensagem aqui..."
                      rows={5}
                      className={`input-elegant mt-1 resize-none ${errors.mensagem ? 'border-destructive' : ''}`}
                    />
                    {errors.mensagem && <p className="text-sm text-destructive mt-1">{errors.mensagem}</p>}
                  </div>

                  <Button type="submit" className="w-full btn-gold" disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Enviar Mensagem
                      </>
                    )}
                  </Button>
                </form>
              </div>

              {/* Informações de Contato */}
              <div className="space-y-8">
                <h2 className="text-2xl font-display font-semibold mb-6">Nossos canais</h2>

                <div className="space-y-6">
                  <a 
                    href="https://wa.me/5511999999999" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="card-elegant p-6 flex items-start gap-4 hover:border-primary/30 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0">
                      <Phone className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">WhatsApp</h3>
                      <p className="text-muted-foreground">(11) 99999-9999</p>
                      <p className="text-sm text-primary mt-1">Resposta rápida!</p>
                    </div>
                  </a>

                  <a 
                    href="mailto:contato@elathosemijoias.com.br"
                    className="card-elegant p-6 flex items-start gap-4 hover:border-primary/30 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                      <Mail className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Email</h3>
                      <p className="text-muted-foreground">contato@elathosemijoias.com.br</p>
                      <p className="text-sm text-muted-foreground mt-1">Resposta em até 24h</p>
                    </div>
                  </a>

                  <a 
                    href="https://instagram.com/elathosemijoias" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="card-elegant p-6 flex items-start gap-4 hover:border-primary/30 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                      <Instagram className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Instagram</h3>
                      <p className="text-muted-foreground">@elathosemijoias</p>
                      <p className="text-sm text-muted-foreground mt-1">Novidades e promoções</p>
                    </div>
                  </a>
                </div>

                {/* Horário */}
                <div className="card-elegant p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Horário de Atendimento</h3>
                      <p className="text-muted-foreground">Segunda a Sexta: 9h às 18h</p>
                      <p className="text-muted-foreground">Sábado: 9h às 13h</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Fora do horário? Deixe sua mensagem que retornaremos assim que possível.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Localização */}
                <div className="card-elegant p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Localização</h3>
                      <p className="text-muted-foreground">São Paulo - SP</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Trabalhamos exclusivamente online, atendendo todo o Brasil.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
