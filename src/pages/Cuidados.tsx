import { Droplets, Box, Sparkles, Moon, FlaskConical, Wind } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const cuidados = [
  {
    icon: Droplets,
    titulo: 'Evite contato com água',
    descricao: 'Retire suas joias antes de banho, piscina ou praia. A água, especialmente salgada ou clorada, pode danificar o banho de ouro.',
    cor: 'from-blue-500 to-blue-600'
  },
  {
    icon: Box,
    titulo: 'Guarde separadamente',
    descricao: 'Armazene cada peça em local separado para evitar arranhões. Use saquinhos de veludo ou a caixinha original.',
    cor: 'from-amber-500 to-amber-600'
  },
  {
    icon: FlaskConical,
    titulo: 'Evite perfumes e cremes',
    descricao: 'Aplique perfumes e cremes antes de colocar suas joias. Produtos químicos podem oxidar e manchar as peças.',
    cor: 'from-pink-500 to-pink-600'
  },
  {
    icon: Sparkles,
    titulo: 'Limpe com flanela macia',
    descricao: 'Para manter o brilho, limpe suas peças regularmente com uma flanela macia e seca. Evite produtos abrasivos.',
    cor: 'from-purple-500 to-purple-600'
  },
  {
    icon: Moon,
    titulo: 'Retire para dormir',
    descricao: 'Evite dormir com suas joias para prevenir danos causados por movimentos durante o sono e contato com travesseiros.',
    cor: 'from-indigo-500 to-indigo-600'
  },
  {
    icon: Wind,
    titulo: 'Evite produtos químicos',
    descricao: 'Retire suas joias ao manusear produtos de limpeza, alvejantes ou qualquer substância química.',
    cor: 'from-green-500 to-green-600'
  }
];

export default function Cuidados() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 md:pt-24">
        {/* Hero */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-champagne/30 to-background">
          <div className="container px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-6 animate-fade-in">
              Cuidados com suas <span className="text-gradient-gold">Joias</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in-up">
              Mantenha suas semijoias sempre lindas e brilhantes seguindo nossas dicas de conservação.
            </p>
          </div>
        </section>

        {/* Grid de Cuidados */}
        <section className="py-16 md:py-20">
          <div className="container px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cuidados.map((cuidado, index) => {
                const Icon = cuidado.icon;
                return (
                  <div 
                    key={index}
                    className="card-elegant p-8 hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${cuidado.cor} flex items-center justify-center mb-6`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-display text-xl font-semibold mb-3">
                      {cuidado.titulo}
                    </h3>
                    <p className="text-muted-foreground">
                      {cuidado.descricao}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Dicas Extras */}
        <section className="py-16 md:py-20 bg-background-secondary">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-display font-bold text-center mb-12">
                Dicas <span className="text-gradient-gold">Extras</span>
              </h2>

              <div className="space-y-6">
                <div className="card-elegant p-6">
                  <h3 className="font-semibold mb-2">🏋️ Atividades Físicas</h3>
                  <p className="text-muted-foreground">
                    Retire suas joias antes de praticar exercícios. O suor pode acelerar o 
                    desgaste do banho e movimentos bruscos podem danificar as peças.
                  </p>
                </div>

                <div className="card-elegant p-6">
                  <h3 className="font-semibold mb-2">🌡️ Temperatura</h3>
                  <p className="text-muted-foreground">
                    Evite expor suas joias a temperaturas extremas. Não deixe ao sol direto 
                    por longos períodos e evite locais muito úmidos.
                  </p>
                </div>

                <div className="card-elegant p-6">
                  <h3 className="font-semibold mb-2">👗 Ordem de Vestir</h3>
                  <p className="text-muted-foreground">
                    Coloque suas joias por último, após se vestir e aplicar maquiagem. 
                    Ao tirar a roupa, retire as joias primeiro para evitar puxões.
                  </p>
                </div>

                <div className="card-elegant p-6">
                  <h3 className="font-semibold mb-2">✨ Renovação do Banho</h3>
                  <p className="text-muted-foreground">
                    Com o tempo, é natural que o banho de ouro vá desgastando. Você pode 
                    renovar suas peças favoritas em joalherias especializadas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-20">
          <div className="container px-4 text-center">
            <h2 className="text-2xl font-display font-bold mb-4">
              Dúvidas sobre conservação?
            </h2>
            <p className="text-muted-foreground mb-6">
              Nossa equipe está pronta para ajudar você a cuidar das suas peças.
            </p>
            <a 
              href="https://wa.me/5519998229202" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-gold inline-flex"
            >
              Fale com a Elatho
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
