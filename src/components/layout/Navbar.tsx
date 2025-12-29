import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Menu, X, Instagram, Heart, User, LogOut } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/hooks/useFavorites';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import CartDrawer from '@/components/cart/CartDrawer';
import logoElatho from '@/assets/logo-elatho.png';

interface Produto {
  id: string;
  nome: string;
  preco: number;
  imagem_url: string | null;
}

const navLinks = [
  { to: '/sobre', label: 'SOBRE' },
  { to: '/#produtos', label: 'COLEÇÃO' },
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
  const { favorites } = useFavorites();
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
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled 
            ? 'bg-background/95 backdrop-blur-md border-b border-border/50' 
            : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-20 lg:h-24">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0">
              <img 
                src={logoElatho} 
                alt="Elatho Semijoias" 
                className="h-14 lg:h-16 w-auto object-contain"
              />
            </Link>

            {/* Desktop Navigation - Center */}
            <nav className="hidden lg:flex items-center gap-10">
              {navLinks.map((link) => (
                <button
                  key={link.to}
                  onClick={() => handleNavClick(link.to)}
                  className="text-sm tracking-[0.2em] font-medium text-foreground/80 hover:text-primary transition-colors duration-300"
                >
                  {link.label}
                </button>
              ))}
            </nav>

            {/* Right Icons */}
            <div className="flex items-center gap-2 lg:gap-4">
              {/* Desktop Search Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:flex h-10 w-10"
                onClick={() => setSearchOpen(!searchOpen)}
              >
                {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
              </Button>

              {/* Social Links - Desktop */}
              <a
                href="https://instagram.com/elathosemijoias"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:flex"
              >
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <Instagram className="h-5 w-5" />
                </Button>
              </a>

              {/* Favorites */}
              <Link to={user ? "/favoritos" : "/auth"}>
                <Button variant="ghost" size="icon" className="relative h-10 w-10">
                  <Heart className="h-5 w-5" />
                  {favorites.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center">
                      {favorites.length}
                    </span>
                  )}
                </Button>
              </Link>

              {/* User Menu */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link to="/favoritos" className="flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        Meus Favoritos
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="flex items-center gap-2 text-destructive">
                      <LogOut className="h-4 w-4" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/auth" className="hidden lg:block">
                  <Button variant="ghost" size="icon" className="h-10 w-10">
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
              )}

              {/* Cart */}
              <Button
                variant="ghost"
                size="icon"
                className="relative h-10 w-10"
                onClick={() => setCartOpen(true)}
              >
                <ShoppingBag className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Button>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-10 w-10"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Desktop Search Bar - Expandable */}
          <div className={`hidden lg:block overflow-hidden transition-all duration-500 ${searchOpen ? 'max-h-24 pb-6' : 'max-h-0'}`}>
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar produtos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 border-border/50 bg-card/50 rounded-none focus:ring-0 focus:border-primary"
                autoFocus={searchOpen}
              />
              
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border shadow-lg z-50">
                  {searchResults.map((produto) => (
                    <button
                      key={produto.id}
                      onClick={() => handleProductClick(produto.id)}
                      className="flex items-center gap-4 w-full p-4 hover:bg-accent/50 transition-colors text-left border-b border-border/50 last:border-b-0"
                    >
                      <img
                        src={produto.imagem_url || '/placeholder.svg'}
                        alt={produto.nome}
                        className="w-12 h-12 object-cover"
                      />
                      <div>
                        <p className="font-medium text-sm">{produto.nome}</p>
                        <p className="text-xs text-primary font-semibold">
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
        <SheetContent side="right" className="w-full max-w-sm bg-background border-l border-border/50 p-0">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <img src={logoElatho} alt="Elatho Semijoias" className="h-10 w-auto" />
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Mobile Search */}
            <div className="p-6 border-b border-border/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 border-border/50 rounded-none"
                />
              </div>
              {searchResults.length > 0 && (
                <div className="mt-2 bg-card border border-border">
                  {searchResults.map((produto) => (
                    <button
                      key={produto.id}
                      onClick={() => handleProductClick(produto.id)}
                      className="flex items-center gap-3 w-full p-3 hover:bg-accent/50 transition-colors text-left border-b border-border/50 last:border-b-0"
                    >
                      <img
                        src={produto.imagem_url || '/placeholder.svg'}
                        alt={produto.nome}
                        className="w-10 h-10 object-cover"
                      />
                      <div>
                        <p className="font-medium text-sm">{produto.nome}</p>
                        <p className="text-xs text-primary font-semibold">
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
              <div className="space-y-1">
                {navLinks.map((link) => (
                  <button
                    key={link.to}
                    onClick={() => handleNavClick(link.to)}
                    className="block w-full text-left py-4 text-lg tracking-[0.15em] font-medium text-foreground/80 hover:text-primary transition-colors border-b border-border/30"
                  >
                    {link.label}
                  </button>
                ))}
                <Link
                  to="/faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-left py-4 text-lg tracking-[0.15em] font-medium text-foreground/80 hover:text-primary transition-colors border-b border-border/30"
                >
                  FAQ
                </Link>
                {!user && (
                  <Link
                    to="/auth"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-left py-4 text-lg tracking-[0.15em] font-medium text-foreground/80 hover:text-primary transition-colors border-b border-border/30"
                  >
                    ENTRAR
                  </Link>
                )}
              </div>
            </nav>

            {/* Footer */}
            <div className="p-6 border-t border-border/50">
              <div className="flex items-center gap-4">
                <a
                  href="https://instagram.com/elathosemijoias"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="icon" className="rounded-none border-border/50">
                    <Instagram className="h-5 w-5" />
                  </Button>
                </a>
                <a
                  href="https://wa.me/5511999999999"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="icon" className="rounded-none border-border/50">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </Button>
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
