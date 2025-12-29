import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import CartDrawer from '@/components/cart/CartDrawer';

interface Produto {
  id: string;
  nome: string;
  preco: number;
  imagem_url: string | null;
}

const navLinks = [
  { to: '/#produtos', label: 'SHOP' },
  { to: '/sobre', label: 'SOBRE' },
  { to: '/contato', label: 'CONTATO' },
];

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

      const { data } = await supabase
        .from('produtos')
        .select('id, nome, preco, imagem_url')
        .ilike('nome', `%${searchQuery}%`)
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
            {/* Logo - Text Only */}
            <Link to="/" className="flex-shrink-0">
              <span className="font-display text-2xl tracking-wide text-foreground">
                Elatho
              </span>
            </Link>

            {/* Desktop Navigation - Right */}
            <div className="hidden lg:flex items-center gap-10">
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

              {/* Search Toggle */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="text-[11px] uppercase tracking-[0.2em] text-foreground/80 hover:text-foreground transition-colors duration-300"
              >
                {searchOpen ? 'FECHAR' : 'BUSCAR'}
              </button>

              {/* Cart */}
              <button
                onClick={() => setCartOpen(true)}
                className="text-[11px] uppercase tracking-[0.2em] text-foreground/80 hover:text-foreground transition-colors duration-300"
              >
                CARRINHO {itemCount > 0 && `(${itemCount})`}
              </button>
            </div>

            {/* Mobile - Right */}
            <div className="flex lg:hidden items-center gap-6">
              {/* Cart */}
              <button
                onClick={() => setCartOpen(true)}
                className="text-[11px] uppercase tracking-[0.2em] text-foreground/80"
              >
                ({itemCount})
              </button>

              {/* Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-1"
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
                        <p className="text-xs text-muted-foreground">
                          R$ {produto.preco.toFixed(2).replace('.', ',')}
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
              <span className="font-display text-xl">Elatho</span>
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
                  <button
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left py-4 text-sm uppercase tracking-[0.2em] text-foreground border-b border-border"
                  >
                    SAIR
                  </button>
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