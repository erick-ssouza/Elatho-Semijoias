import { Helmet } from 'react-helmet-async';

/**
 * Organization Schema for the homepage
 * Provides structured data about the business for Google rich results
 */
export function OrganizationSchema() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Elatho Semijoias",
    "url": "https://elathosemijoias.com.br",
    "logo": "https://elathosemijoias.com.br/og-image.jpg",
    "description": "Semijoias diferenciadas para momentos inesquecíveis. Tecnologia antialérgica, banhada a ouro 18k.",
    "foundingDate": "2020",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Rio Claro",
      "addressRegion": "SP",
      "addressCountry": "BR"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+55-19-99822-9202",
      "contactType": "customer service",
      "availableLanguage": "Portuguese",
      "areaServed": "BR"
    },
    "sameAs": [
      "https://instagram.com/elathosemijoias",
      "https://wa.me/5519998229202"
    ]
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Elatho Semijoias",
    "url": "https://elathosemijoias.com.br",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://elathosemijoias.com.br/loja?busca={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "JewelryStore",
    "name": "Elatho Semijoias",
    "image": "https://elathosemijoias.com.br/og-image.jpg",
    "url": "https://elathosemijoias.com.br",
    "telephone": "+55-19-99822-9202",
    "email": "elathosemijoias@gmail.com",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Rio Claro",
      "addressRegion": "SP",
      "addressCountry": "BR"
    },
    "priceRange": "$$",
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "09:00",
      "closes": "18:00"
    },
    "paymentAccepted": "Credit Card, Debit Card, PIX",
    "currenciesAccepted": "BRL"
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(websiteSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(localBusinessSchema)}
      </script>
    </Helmet>
  );
}
