import { Heart, Target, Eye, Sparkles } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function Sobre() {
  return (
    <>
      <Helmet>
        <title>Sobre a Elatho | Nossa História e Valores</title>
        <meta name="description" content="Conheça a Elatho Semijoias. Nascemos do desejo de oferecer semijoias de alta qualidade com preços acessíveis. Desde 2020 encantando mulheres em todo o Brasil." />
        <link rel="canonical" href="https://elathosemijoias.com.br/sobre" />
        <meta property="og:title" content="Sobre a Elatho | Nossa História e Valores" />
        <meta property="og:description" content="Conheça a Elatho Semijoias. Desde 2020 oferecendo elegância e qualidade." />
        <meta property="og:url" content="https://elathosemijoias.com.br/sobre" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://elathosemijoias.com.br/og-image.jpg" />
        <meta property="og:site_name" content="Elatho Semijoias" />
        <meta property="og:locale" content="pt_BR" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Sobre a Elatho Semijoias" />
        <meta name="twitter:description" content="Conheça nossa história e valores." />
        <meta name="twitter:image" content="https://elathosemijoias.com.br/og-image.jpg" />
      </Helmet>

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
                    A <strong className="text-foreground">Elatho Semijoias</strong> nasceu do amor por peças que combinam elegância e acessibilidade.
                  </p>
                  <p>
                    Nosso nome vem do grego <em>"Elatho"</em>, que significa <strong className="text-foreground">"eu brilho"</strong> — e é exatamente isso que queremos: fazer você brilhar em cada momento especial.
                  </p>
                  <p>
                    Trabalhamos com semijoias de alta qualidade, com acabamento em <strong className="text-foreground">ouro 18k</strong>, <strong className="text-foreground">prata 925</strong> e <strong className="text-foreground">banho rosé</strong>, todas com garantia de 12 meses.
                  </p>
                  <p>
                    Cada peça é cuidadosamente selecionada para oferecer o melhor em design, durabilidade e preço justo.
                  </p>
                  <p className="text-primary font-display text-lg italic mt-6">
                    Bem-vinda à Elatho. Elegância que você merece.
                  </p>
                </div>
              </div>
              <div className="bg-accent/30 rounded-3xl aspect-square flex items-center justify-center">
                <div className="text-center">
                  <Sparkles className="h-20 w-20 text-primary mx-auto mb-4" />
                  <p className="font-display text-2xl font-bold text-gradient-gold">"Eu brilho"</p>
                  <p className="text-muted-foreground">Do grego antigo</p>
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
                <p className="text-4xl md:text-5xl font-display font-bold text-gradient-gold">1k+</p>
                <p className="text-muted-foreground mt-2">Clientes Felizes</p>
              </div>
              <div>
                <p className="text-4xl md:text-5xl font-display font-bold text-gradient-gold">200+</p>
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
    </>
  );
}
