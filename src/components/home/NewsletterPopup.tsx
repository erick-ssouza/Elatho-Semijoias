import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'elatho_newsletter_shown';

export default function NewsletterPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if popup was already shown
    const wasShown = localStorage.getItem(STORAGE_KEY);
    if (wasShown) return;

    // Show popup after 10 seconds
    const timer = setTimeout(() => {
      setIsOpen(true);
      localStorage.setItem(STORAGE_KEY, 'true');
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('newsletter_inscricoes')
        .insert({ email: email.trim().toLowerCase() });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Email já cadastrado",
            description: "Você já está inscrito na nossa newsletter!",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Inscrição confirmada!",
          description: "Você receberá nossas novidades e ofertas exclusivas.",
        });
      }
      setIsOpen(false);
    } catch (error) {
      console.error('Newsletter error:', error);
      toast({
        title: "Erro ao inscrever",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-md bg-background border border-border p-8 md:p-12"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Content */}
            <div className="text-center">
              <div className="w-12 h-px bg-primary mx-auto mb-6" />
              
              <h2 className="font-display text-2xl md:text-3xl mb-3">
                Novidades Exclusivas
              </h2>
              
              <p className="text-muted-foreground mb-8">
                Receba novidades e ofertas exclusivas diretamente no seu email.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Seu melhor email"
                  required
                  className="w-full px-4 py-3 bg-transparent border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-minimal py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Inscrevendo...' : 'Quero receber'}
                </button>
              </form>

              <p className="text-xs text-muted-foreground mt-6">
                Prometemos não enviar spam. Você pode cancelar a qualquer momento.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
