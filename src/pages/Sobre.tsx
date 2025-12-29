import { Heart, Target, Eye, Sparkles } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function Sobre() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 md:pt-24">
        {/* Hero */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-champagne/30 to-background">
          <div className="container px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-6 animate-fade-in">
              Sobre a <span className="text-gradient-gold">Elatho</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in-up">
              Nascemos do desejo de oferecer semijoias de alta qualidade com preços acessíveis, 
              para que toda mulher possa se sentir especial todos os dias.
            </p>
          </div>
        </section>

        {/* História */}
        <section className="py-16 md:py-20">
          <div className="container px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-display font-bold mb-6">
                  Nossa <span className="text-gradient-gold">História</span>
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    A Elatho Semijoias nasceu em 2020, fruto da paixão por joias e do sonho de 
                    democratizar o acesso a peças de qualidade. Começamos como uma pequena loja 
                    online e hoje atendemos clientes em todo o Brasil.
                  </p>
                  <p>
                    Nosso nome, Elatho, vem da fusão de "Ela" - representando todas as mulheres 
                    que queremos empoderar - e "tho" de "tesouro". Porque acreditamos que cada 
                    mulher merece ter seus próprios tesouros.
                  </p>
                  <p>
                    Cada peça é cuidadosamente selecionada e passa por rigoroso controle de 
                    qualidade. Trabalhamos apenas com fornecedores certificados e utilizamos 
                    banhos de ouro 18k de alta durabilidade.
                  </p>
                </div>
              </div>
              <div className="bg-accent/30 rounded-3xl aspect-square flex items-center justify-center">
                <div className="text-center">
                  <Sparkles className="h-20 w-20 text-primary mx-auto mb-4" />
                  <p className="font-display text-2xl font-bold text-gradient-gold">Desde 2020</p>
                  <p className="text-muted-foreground">Encantando mulheres</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Missão, Visão, Valores */}
        <section className="py-16 md:py-20 bg-background-secondary">
          <div className="container px-4">
            <h2 className="text-3xl font-display font-bold text-center mb-12">
              Nossos <span className="text-gradient-gold">Pilares</span>
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="card-elegant p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-gold flex items-center justify-center">
                  <Target className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-4">Missão</h3>
                <p className="text-muted-foreground">
                  Oferecer semijoias de alta qualidade com preços justos, proporcionando 
                  elegância e autoestima para todas as mulheres.
                </p>
              </div>

              <div className="card-elegant p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-gold flex items-center justify-center">
                  <Eye className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-4">Visão</h3>
                <p className="text-muted-foreground">
                  Ser a marca de semijoias mais amada do Brasil, reconhecida pela qualidade, 
                  atendimento e compromisso com nossas clientes.
                </p>
              </div>

              <div className="card-elegant p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-gold flex items-center justify-center">
                  <Heart className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-4">Valores</h3>
                <p className="text-muted-foreground">
                  Qualidade em primeiro lugar, transparência nas relações, respeito às clientes 
                  e compromisso com a satisfação.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Números */}
        <section className="py-16 md:py-20">
          <div className="container px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <p className="text-4xl md:text-5xl font-display font-bold text-gradient-gold">5k+</p>
                <p className="text-muted-foreground mt-2">Clientes Felizes</p>
              </div>
              <div>
                <p className="text-4xl md:text-5xl font-display font-bold text-gradient-gold">500+</p>
                <p className="text-muted-foreground mt-2">Modelos Exclusivos</p>
              </div>
              <div>
                <p className="text-4xl md:text-5xl font-display font-bold text-gradient-gold">4.9</p>
                <p className="text-muted-foreground mt-2">Avaliação Média</p>
              </div>
              <div>
                <p className="text-4xl md:text-5xl font-display font-bold text-gradient-gold">27</p>
                <p className="text-muted-foreground mt-2">Estados Atendidos</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
