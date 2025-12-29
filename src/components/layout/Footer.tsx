import { Link } from 'react-router-dom';
import { Instagram, Mail, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-foreground text-background py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {/* Institucional */}
          <div>
            <h3 className="font-display text-lg font-semibold mb-4 text-primary">
              Institucional
            </h3>
            <nav className="flex flex-col gap-2">
              <Link to="/sobre" className="text-background/70 hover:text-primary transition-colors">
                Sobre Nós
              </Link>
              <Link to="/trocas" className="text-background/70 hover:text-primary transition-colors">
                Trocas e Devoluções
              </Link>
              <Link to="/privacidade" className="text-background/70 hover:text-primary transition-colors">
                Política de Privacidade
              </Link>
              <Link to="/faq" className="text-background/70 hover:text-primary transition-colors">
                FAQ
              </Link>
            </nav>
          </div>

          {/* Ajuda */}
          <div>
            <h3 className="font-display text-lg font-semibold mb-4 text-primary">
              Ajuda
            </h3>
            <nav className="flex flex-col gap-2">
              <Link to="/cuidados" className="text-background/70 hover:text-primary transition-colors">
                Cuidados com as Joias
              </Link>
              <Link to="/contato" className="text-background/70 hover:text-primary transition-colors">
                Contato
              </Link>
              <a
                href="https://rastreamento.correios.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="text-background/70 hover:text-primary transition-colors"
              >
                Rastreio de Pedido
              </a>
            </nav>
          </div>

          {/* Contato */}
          <div>
            <h3 className="font-display text-lg font-semibold mb-4 text-primary">
              Contato
            </h3>
            <div className="flex flex-col gap-3">
              <a
                href="https://wa.me/5519998229202"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-background/70 hover:text-primary transition-colors"
              >
                <Phone className="h-4 w-4" />
                (19) 99822-9202
              </a>
              <a
                href="mailto:elathosemijoias@gmail.com"
                className="flex items-center gap-2 text-background/70 hover:text-primary transition-colors"
              >
                <Mail className="h-4 w-4" />
                elathosemijoias@gmail.com
              </a>
              <a
                href="https://instagram.com/elathosemijoias"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-background/70 hover:text-primary transition-colors"
              >
                <Instagram className="h-4 w-4" />
                @elathosemijoias
              </a>
            </div>
          </div>

          {/* Pagamento */}
          <div>
            <h3 className="font-display text-lg font-semibold mb-4 text-primary">
              Formas de Pagamento
            </h3>
            <div className="flex flex-wrap gap-3">
              <div className="bg-background/10 rounded-lg px-3 py-2 text-sm font-medium">
                PIX
              </div>
              <div className="bg-background/10 rounded-lg px-3 py-2 text-sm font-medium">
                Visa
              </div>
              <div className="bg-background/10 rounded-lg px-3 py-2 text-sm font-medium">
                Mastercard
              </div>
              <div className="bg-background/10 rounded-lg px-3 py-2 text-sm font-medium">
                Elo
              </div>
            </div>
            <p className="text-sm text-background/50 mt-4">
              Parcelamos em até 3x sem juros
            </p>
          </div>
        </div>

        <div className="border-t border-background/10 mt-12 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-background/50">
              © 2025 Elatho Semijoias. Todos os direitos reservados.
            </p>
            <p className="text-sm text-background/50">
              Erica C. M. Bortolin - CPF: 337.645.358-65
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
