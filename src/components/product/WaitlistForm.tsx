import { useState } from 'react';
import { Bell, Loader2, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WaitlistFormProps {
  produtoId: string;
  produtoNome: string;
}

export function WaitlistForm({ produtoId, produtoNome }: WaitlistFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "E-mail inválido",
        description: "Por favor, insira um e-mail válido.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('lista_espera')
        .insert({
          produto_id: produtoId,
          email: email.trim().toLowerCase(),
        });

      if (error) {
        // Check for duplicate entry
        if (error.code === '23505') {
          toast({
            title: "Você já está na lista!",
            description: "Este e-mail já está cadastrado para receber avisos deste produto.",
          });
        } else {
          throw error;
        }
      } else {
        setSuccess(true);
        toast({
          title: "✓ Pronto!",
          description: "Vamos te avisar quando este produto estiver disponível.",
        });
      }
    } catch (error) {
      console.error('Error adding to waitlist:', error);
      toast({
        title: "Erro ao cadastrar",
        description: "Não foi possível adicionar você à lista. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-6 border border-primary/20 bg-primary/5 rounded-lg">
        <div className="flex items-center gap-3 text-primary">
          <Check className="w-5 h-5" />
          <span className="font-medium">Você está na lista!</span>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Enviaremos um e-mail para <span className="font-medium">{email}</span> quando o produto estiver disponível.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 border border-amber-500/30 bg-amber-500/5 rounded-lg">
      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 mb-3">
        <Bell className="w-5 h-5" />
        <span className="font-medium uppercase tracking-[0.1em] text-sm">Produto Esgotado</span>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        Quer ser avisado quando chegar?
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          type="email"
          placeholder="Seu e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          className="bg-background"
        />
        <Button 
          type="submit" 
          variant="outline"
          className="w-full"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Bell className="w-4 h-4 mr-2" />
          )}
          Avisar quando disponível
        </Button>
      </form>
    </div>
  );
}
