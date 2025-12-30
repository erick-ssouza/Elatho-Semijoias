import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/home/Hero';
import Categories from '@/components/home/Categories';
import ProductGrid from '@/components/home/ProductGrid';
import Testimonials from '@/components/home/Testimonials';
import Features from '@/components/home/Features';

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
        <title>Elatho Semijoias | Elegância que você merece</title>
        <meta name="description" content="Semijoias femininas com acabamento em ouro 18k. Anéis, brincos, colares e pulseiras. Frete grátis acima de R$299. Garantia de 12 meses." />
        <link rel="canonical" href="https://elathosemijoias.com.br" />
        <meta property="og:title" content="Elatho Semijoias | Elegância que você merece" />
        <meta property="og:description" content="Semijoias femininas com acabamento em ouro 18k. Anéis, brincos, colares e pulseiras. Frete grátis acima de R$299." />
        <meta property="og:url" content="https://elathosemijoias.com.br" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://elathosemijoias.com.br/og-image.jpg" />
        <meta property="og:site_name" content="Elatho Semijoias" />
        <meta property="og:locale" content="pt_BR" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Elatho Semijoias | Elegância que você merece" />
        <meta name="twitter:description" content="Semijoias femininas com acabamento em ouro 18k. Frete grátis acima de R$299." />
        <meta name="twitter:image" content="https://elathosemijoias.com.br/og-image.jpg" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-16 md:pt-20">
          <Hero />
          <Categories 
            selectedCategory={selectedCategory} 
            onSelectCategory={setSelectedCategory} 
          />
          <ProductGrid selectedCategory={selectedCategory} />
          <Testimonials />
          <Features />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
