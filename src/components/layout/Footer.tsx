import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-background-secondary py-16 md:py-24">
      <div className="container px-6 lg:px-12">
        {/* Logo */}
        <div className="text-center mb-16">
          <Link to="/" className="font-display text-3xl md:text-4xl text-foreground">
            Elatho
          </Link>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-12 md:gap-16 max-w-3xl mx-auto mb-16">
          {/* Shop */}
          <div>
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-6">
              Shop
            </h3>
            <nav className="flex flex-col gap-3">
              <Link to="/#produtos" className="text-sm text-foreground hover:underline underline-offset-4">
                Todos os produtos
              </Link>
              <Link to="/#produtos" className="text-sm text-foreground hover:underline underline-offset-4">
                Anéis
              </Link>
              <Link to="/#produtos" className="text-sm text-foreground hover:underline underline-offset-4">
                Brincos
              </Link>
              <Link to="/#produtos" className="text-sm text-foreground hover:underline underline-offset-4">
                Colares
              </Link>
              <Link to="/#produtos" className="text-sm text-foreground hover:underline underline-offset-4">
                Pulseiras
              </Link>
            </nav>
          </div>

          {/* Ajuda */}
          <div>
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-6">
              Ajuda
            </h3>
            <nav className="flex flex-col gap-3">
              <Link to="/faq" className="text-sm text-foreground hover:underline underline-offset-4">
                FAQ
              </Link>
              <Link to="/trocas" className="text-sm text-foreground hover:underline underline-offset-4">
                Trocas e Devoluções
              </Link>
              <Link to="/cuidados" className="text-sm text-foreground hover:underline underline-offset-4">
                Cuidados
              </Link>
              <Link to="/privacidade" className="text-sm text-foreground hover:underline underline-offset-4">
                Privacidade
              </Link>
            </nav>
          </div>

          {/* Contato */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-6">
              Contato
            </h3>
            <nav className="flex flex-col gap-3">
              <a
                href="https://wa.me/5519998229202"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-foreground hover:underline underline-offset-4"
              >
                WhatsApp
              </a>
              <a
                href="https://instagram.com/elathosemijoias"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-foreground hover:underline underline-offset-4"
              >
                Instagram
              </a>
              <a
                href="mailto:elathosemijoias@gmail.com"
                className="text-sm text-foreground hover:underline underline-offset-4"
              >
                Email
              </a>
            </nav>
          </div>
        </div>

        {/* Payment methods - text only */}
        <div className="text-center mb-12">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Pix · Visa · Mastercard · Elo
          </p>
        </div>

        {/* Copyright */}
        <div className="text-center">
          <p className="text-[11px] text-muted-foreground">
            © 2025 Elatho Semijoias. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}