import { Shield, Truck, CreditCard, Headphones } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Garantia de 1 ano',
    description: 'Todas as nossas peças possuem garantia contra defeitos de fabricação.',
  },
  {
    icon: Truck,
    title: 'Frete grátis +R$299',
    description: 'Compras acima de R$ 299 têm frete grátis para todo o Brasil.',
  },
  {
    icon: CreditCard,
    title: 'Parcelamos em 3x',
    description: 'Parcele suas compras em até 3x sem juros no cartão.',
  },
  {
    icon: Headphones,
    title: 'Atendimento personalizado',
    description: 'Suporte exclusivo via WhatsApp para tirar suas dúvidas.',
  },
];

export default function Features() {
  return (
    <section className="py-16 md:py-24">
      <div className="container px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-display font-bold">
            Por que escolher a <span className="text-gradient-gold">Elatho</span>?
          </h2>
          <p className="text-muted-foreground mt-2">
            Compromisso com qualidade e satisfação
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="card-elegant p-6 text-center group hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-gold flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
