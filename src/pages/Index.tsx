import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/home/Hero';
import Categories from '@/components/home/Categories';
import ProductGrid from '@/components/home/ProductGrid';
import Testimonials from '@/components/home/Testimonials';
import Features from '@/components/home/Features';

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState('todos');

  return (
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
  );
};

export default Index;
