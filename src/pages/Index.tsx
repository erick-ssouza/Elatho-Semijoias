import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/home/Hero';
import Categories from '@/components/home/Categories';
import ProductGrid from '@/components/home/ProductGrid';
import CollectionCTA from '@/components/home/CollectionCTA';
import Testimonials from '@/components/home/Testimonials';
import Features from '@/components/home/Features';
import NewsletterPopup from '@/components/home/NewsletterPopup';
import BenefitsBar from '@/components/layout/BenefitsBar';

const Index = () => {
  const [searchParams] = useSearchParams();
  const categoriaFromUrl = searchParams.get('categoria');
  const [selectedCategory, setSelectedCategory] = useState(categoriaFromUrl || 'todos');

  useEffect(() => {
    if (categoriaFromUrl) {
      setSelectedCategory(categoriaFromUrl);
    }
  }, [categoriaFromUrl]);

  return (
    <>
      <Helmet>
        <title>Elatho Semijoias | Joias Banhadas a Ouro com Garantia</title>
        <meta name="description" content="Semijoias diferenciadas para momentos inesquecíveis. Tecnologia antialérgica, banhada a ouro 18k. Entrega para todo Brasil. 5% OFF no PIX." />
        <meta name="keywords" content="semijoias, joias banhadas a ouro, brincos, anéis, colares, pulseiras, antialérgico, ouro 18k, ródio" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://elathosemijoias.com.br" />
        <meta property="og:title" content="Elatho Semijoias | Joias Banhadas a Ouro" />
        <meta property="og:description" content="Semijoias diferenciadas para momentos inesquecíveis. Tecnologia antialérgica e banhada a ouro." />
        <meta property="og:url" content="https://elathosemijoias.com.br" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://elathosemijoias.com.br/og-image.jpg" />
        <meta property="og:site_name" content="Elatho Semijoias" />
        <meta property="og:locale" content="pt_BR" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Elatho Semijoias" />
        <meta name="twitter:description" content="Semijoias diferenciadas para momentos inesquecíveis." />
        <meta name="twitter:image" content="https://elathosemijoias.com.br/og-image.jpg" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <BenefitsBar />
        <Navbar />
        <main className="pt-16 md:pt-20">
          <Hero />
          <Categories 
            selectedCategory={selectedCategory} 
            onSelectCategory={setSelectedCategory} 
          />
          <ProductGrid selectedCategory={selectedCategory} />
          <CollectionCTA />
          <Testimonials />
          <Features />
        </main>
        <Footer />
      </div>

      {/* Newsletter Popup */}
      <NewsletterPopup />
    </>
  );
};

export default Index;
