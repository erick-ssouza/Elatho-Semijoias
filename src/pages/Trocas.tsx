import { CheckCircle, XCircle, AlertCircle, Package } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function Trocas() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 md:pt-24">
        {/* Hero */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-champagne/30 to-background">
          <div className="container px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-6 animate-fade-in">
              Trocas e <span className="text-gradient-gold">Devoluções</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in-up">
              Sua satisfação é nossa prioridade. Conheça nossa política de trocas e devoluções.
            </p>
          </div>
        </section>

        {/* Conteúdo */}
        <section className="py-16 md:py-20">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto space-y-12">
              
              {/* Prazo */}
              <div className="card-elegant p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center flex-shrink-0">
                    <Package className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-semibold mb-3">Prazo para Solicitação</h2>
                    <p className="text-muted-foreground">
                      Você tem até <strong>7 dias corridos</strong> após o recebimento do produto 
                      para solicitar troca ou devolução, conforme o Código de Defesa do Consumidor.
                    </p>
                  </div>
                </div>
              </div>

              {/* Condições Aceitas */}
              <div>
                <h2 className="font-display text-2xl font-semibold mb-6 flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  Condições Aceitas
                </h2>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                    Produto em perfeito estado, sem sinais de uso
                  </li>
                  <li className="flex items-start gap-3 text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                    Embalagem original intacta
                  </li>
                  <li className="flex items-start gap-3 text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                    Todos os acessórios e manuais incluídos
                  </li>
                  <li className="flex items-start gap-3 text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                    Produto com defeito de fabricação (garantia de 12 meses)
                  </li>
                  <li className="flex items-start gap-3 text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                    Produto diferente do anunciado
                  </li>
                </ul>
              </div>

              {/* Condições Não Aceitas */}
              <div>
                <h2 className="font-display text-2xl font-semibold mb-6 flex items-center gap-3">
                  <XCircle className="h-6 w-6 text-destructive" />
                  Condições Não Aceitas
                </h2>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2 flex-shrink-0" />
                    Produto com sinais de uso (arranhões, manchas, oxidação)
                  </li>
                  <li className="flex items-start gap-3 text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2 flex-shrink-0" />
                    Embalagem violada ou danificada
                  </li>
                  <li className="flex items-start gap-3 text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2 flex-shrink-0" />
                    Danos causados por mau uso ou negligência
                  </li>
                  <li className="flex items-start gap-3 text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2 flex-shrink-0" />
                    Desgaste natural do banho por uso prolongado
                  </li>
                  <li className="flex items-start gap-3 text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2 flex-shrink-0" />
                    Solicitação fora do prazo de 7 dias
                  </li>
                </ul>
              </div>

              {/* Processo */}
              <div>
                <h2 className="font-display text-2xl font-semibold mb-6">Como Solicitar</h2>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="card-elegant p-6 text-center">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 font-bold">
                      1
                    </div>
                    <h3 className="font-semibold mb-2">Entre em Contato</h3>
                    <p className="text-sm text-muted-foreground">
                      Envie uma mensagem via WhatsApp informando o número do pedido
                    </p>
                  </div>
                  <div className="card-elegant p-6 text-center">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 font-bold">
                      2
                    </div>
                    <h3 className="font-semibold mb-2">Envie o Produto</h3>
                    <p className="text-sm text-muted-foreground">
                      Após aprovação, envie o produto para nosso endereço
                    </p>
                  </div>
                  <div className="card-elegant p-6 text-center">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 font-bold">
                      3
                    </div>
                    <h3 className="font-semibold mb-2">Receba</h3>
                    <p className="text-sm text-muted-foreground">
                      Troca: novo produto enviado. Devolução: reembolso em até 10 dias
                    </p>
                  </div>
                </div>
              </div>

              {/* Importante */}
              <div className="p-6 rounded-xl bg-champagne/30 border border-primary/20">
                <div className="flex items-start gap-4">
                  <AlertCircle className="h-6 w-6 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-2">Importante</h3>
                    <p className="text-sm text-muted-foreground">
                      O frete de devolução é por conta do cliente, exceto em casos de defeito 
                      de fabricação ou produto diferente do anunciado. Nestes casos, fornecemos 
                      a etiqueta de postagem gratuita.
                    </p>
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
