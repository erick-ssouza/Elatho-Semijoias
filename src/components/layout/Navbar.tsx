import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X, ShoppingBag, User, Heart, Package, LogOut, UserCircle } from 'lucide-react';
import logoElatho from '@/assets/logo-elatho-navbar.jpg';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import CartDrawer from '@/components/cart/CartDrawer';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Produto {
  id: string;
  nome: string;
  preco: number;
  imagem_url: string | null;
  categoria: string;
  descricao: string | null;
}

const navLinks = [
  { to: '/#produtos', label: 'SHOP' },
  { to: '/sobre', label: 'SOBRE' },
  { to: '/contato', label: 'CONTATO' },
];

// Instagram icon component (thin line style)
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

// WhatsApp icon component (thin line style)
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
  </svg>
);

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Produto[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { itemCount } = useCart();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get first name from user metadata
  const firstName = user?.user_metadata?.nome?.split(' ')[0] || 'Usuário';

  const handleSignOut = async () => {
    await signOut();
    toast({ title: 'Você saiu da sua conta' });
    navigate('/');
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const searchProducts = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      const searchTerm = searchQuery.toLowerCase();
      
      // Search by name, category, or description
      const { data } = await supabase
        .from('produtos')
        .select('id, nome, preco, imagem_url, categoria, descricao')
        .or(`nome.ilike.%${searchTerm}%,categoria.ilike.%${searchTerm}%,descricao.ilike.%${searchTerm}%`)
        .limit(5);

      setSearchResults(data || []);
    };

    const debounce = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleProductClick = (id: string) => {
    navigate(`/produto/${id}`);
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleNavClick = (to: string) => {
    setMobileMenuOpen(false);
    if (to.startsWith('/#')) {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(to.replace('/#', ''));
        element?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      navigate(to);
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-background' 
            : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0">
              <img 
                src={logoElatho} 
                alt="Elatho Semijoias" 
                className="h-12 md:h-14 w-auto"
              />
            </Link>

            {/* Desktop Navigation - Center */}
            <div className="hidden lg:flex items-center gap-8">
              <nav className="flex items-center gap-8">
                {navLinks.map((link) => (
                  <button
                    key={link.to}
                    onClick={() => handleNavClick(link.to)}
                    className="text-[11px] uppercase tracking-[0.2em] text-foreground/80 hover:text-foreground transition-colors duration-300"
                  >
                    {link.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Desktop Right Icons */}
            <div className="hidden lg:flex items-center gap-5">
              {/* Instagram */}
              <a
                href="https://instagram.com/elathosemijoias"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground/80 hover:text-foreground transition-colors duration-300"
                aria-label="Instagram"
              >
                <InstagramIcon className="h-5 w-5" />
              </a>

              {/* Search Toggle */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="text-foreground/80 hover:text-foreground transition-colors duration-300"
                aria-label="Buscar"
              >
                <Search className="h-5 w-5 stroke-[1.5]" />
              </button>

              {/* WhatsApp */}
              <a
                href="https://wa.me/5519998229202"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground/80 hover:text-foreground transition-colors duration-300"
                aria-label="WhatsApp"
              >
                <WhatsAppIcon className="h-5 w-5" />
              </a>

              {/* Favorites */}
              <Link
                to="/favoritos"
                className="text-foreground/80 hover:text-foreground transition-colors duration-300"
                aria-label="Favoritos"
              >
                <Heart className="h-5 w-5 stroke-[1.5]" />
              </Link>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* User Menu */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="text-foreground/80 hover:text-foreground transition-colors duration-300 text-[11px] uppercase tracking-[0.15em] whitespace-nowrap"
                    >
                      Olá, {firstName}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-background border border-border">
                    <DropdownMenuItem asChild>
                      <Link to="/meus-pedidos" className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Meus Pedidos
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/minha-conta" className="flex items-center gap-2">
                        <UserCircle className="h-4 w-4" />
                        Meus Dados
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleSignOut}
                      className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                    >
                      <LogOut className="h-4 w-4" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link
                  to="/auth"
                  className="text-foreground/80 hover:text-foreground transition-colors duration-300"
                  aria-label="Entrar"
                >
                  <User className="h-5 w-5 stroke-[1.5]" />
                </Link>
              )}

              {/* Cart */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative text-foreground/80 hover:text-foreground transition-colors duration-300"
                aria-label="Carrinho"
              >
                <ShoppingBag className="h-5 w-5 stroke-[1.5]" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-foreground text-background text-[9px] w-4 h-4 flex items-center justify-center rounded-full">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>

            {/* Mobile - Right */}
            <div className="flex lg:hidden items-center gap-4">
              {/* Favorites */}
              <Link
                to="/favoritos"
                className="text-foreground/80 hover:text-foreground transition-colors duration-300"
                aria-label="Favoritos"
              >
                <Heart className="h-5 w-5 stroke-[1.5]" />
              </Link>

              {/* User */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="text-foreground/80 hover:text-foreground transition-colors duration-300"
                      aria-label="Minha conta"
                    >
                      <User className="h-5 w-5 stroke-[1.5]" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-background border border-border">
                    <DropdownMenuItem asChild>
                      <Link to="/meus-pedidos" className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Meus Pedidos
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/minha-conta" className="flex items-center gap-2">
                        <UserCircle className="h-4 w-4" />
                        Meus Dados
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => {
                        handleSignOut();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                    >
                      <LogOut className="h-4 w-4" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link
                  to="/auth"
                  className="text-foreground/80 hover:text-foreground transition-colors duration-300"
                  aria-label="Entrar"
                >
                  <User className="h-5 w-5 stroke-[1.5]" />
                </Link>
              )}

              {/* Cart */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative text-foreground/80 hover:text-foreground transition-colors duration-300"
                aria-label="Carrinho"
              >
                <ShoppingBag className="h-5 w-5 stroke-[1.5]" />
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-foreground text-background text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-medium">
                    {itemCount}
                  </span>
                )}
              </button>

              {/* Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="text-foreground/80 hover:text-foreground transition-colors duration-300"
                aria-label="Abrir menu"
              >
                <Menu className="h-5 w-5 stroke-[1.5]" />
              </button>
            </div>
          </div>

          {/* Desktop Search Bar - Expandable */}
          <div className={`hidden lg:block overflow-hidden transition-all duration-300 ${searchOpen ? 'max-h-20 pb-6' : 'max-h-0'}`}>
            <div className="relative max-w-md">
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-minimal w-full text-sm"
                autoFocus={searchOpen}
              />
              
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-4 bg-background border border-border z-50">
              {searchResults.map((produto) => (
                    <button
                      key={produto.id}
                      onClick={() => handleProductClick(produto.id)}
                      className="flex items-center gap-4 w-full p-4 hover:bg-muted transition-colors text-left border-b border-border last:border-b-0"
                    >
                      <img
                        src={produto.imagem_url || '/placeholder.svg'}
                        alt={produto.nome}
                        className="w-12 h-12 object-cover"
                      />
                      <div>
                        <p className="text-sm">{produto.nome}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {produto.categoria} · R$ {produto.preco.toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="right" className="w-full max-w-sm bg-background p-0 border-l border-border">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <img 
                src={logoElatho} 
                alt="Elatho Semijoias" 
                className="h-10 w-auto"
              />
              <button onClick={() => setMobileMenuOpen(false)}>
                <X className="h-5 w-5 stroke-[1.5]" />
              </button>
            </div>

            {/* Mobile Search */}
            <div className="p-6 border-b border-border">
              <input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-minimal w-full text-sm"
              />
              {searchResults.length > 0 && (
                <div className="mt-4">
                  {searchResults.map((produto) => (
                    <button
                      key={produto.id}
                      onClick={() => {
                        handleProductClick(produto.id);
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 w-full py-3 hover:bg-muted transition-colors text-left"
                    >
                      <img
                        src={produto.imagem_url || '/placeholder.svg'}
                        alt={produto.nome}
                        className="w-10 h-10 object-cover"
                      />
                      <div>
                        <p className="text-sm">{produto.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          R$ {produto.preco.toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-6">
              <div className="space-y-0">
                {navLinks.map((link) => (
                  <button
                    key={link.to}
                    onClick={() => handleNavClick(link.to)}
                    className="block w-full text-left py-4 text-sm uppercase tracking-[0.2em] text-foreground border-b border-border"
                  >
                    {link.label}
                  </button>
                ))}
                <Link
                  to="/faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-left py-4 text-sm uppercase tracking-[0.2em] text-foreground border-b border-border"
                >
                  FAQ
                </Link>
                {user ? (
                  <>
                    <Link
                      to="/minha-conta"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full text-left py-4 text-sm uppercase tracking-[0.2em] text-foreground border-b border-border"
                    >
                      MINHA CONTA
                    </Link>
                    <Link
                      to="/meus-pedidos"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full text-left py-4 text-sm uppercase tracking-[0.2em] text-foreground border-b border-border"
                    >
                      MEUS PEDIDOS
                    </Link>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full text-left py-4 text-sm uppercase tracking-[0.2em] text-destructive border-b border-border"
                    >
                      SAIR
                    </button>
                  </>
                ) : (
                  <Link
                    to="/auth"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-left py-4 text-sm uppercase tracking-[0.2em] text-foreground border-b border-border"
                  >
                    ENTRAR
                  </Link>
                )}
              </div>
            </nav>

            {/* Footer */}
            <div className="p-6 border-t border-border">
              <div className="flex items-center gap-6 text-xs uppercase tracking-[0.15em] text-muted-foreground">
                <a
                  href="https://instagram.com/elathosemijoias"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  Instagram
                </a>
                <a
                  href="https://wa.me/5519998229202"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Cart Drawer */}
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </>
  );
}
