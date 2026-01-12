import { motion, Variants, Easing } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { ShoppingBag, MessageCircle, Instagram, Music } from 'lucide-react';
import logo from '@/assets/logo-elatho-horizontal.png';
import { trackEvent } from '@/components/seo/GoogleAnalytics';

const links = [
  {
    name: 'Nossa Loja',
    url: 'https://elathosemijoias.com.br/loja',
    icon: ShoppingBag,
    emoji: '🛒',
  },
  {
    name: 'WhatsApp',
    url: 'https://wa.me/5519998229202',
    icon: MessageCircle,
    emoji: '💬',
  },
  {
    name: 'Instagram',
    url: 'https://instagram.com/elathosemijoias',
    icon: Instagram,
    emoji: '📸',
  },
  {
    name: 'TikTok',
    url: 'https://tiktok.com/@elatho',
    icon: Music,
    emoji: '🎵',
  },
];

const easeOut: Easing = [0.33, 1, 0.68, 1];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: easeOut,
    },
  },
};

export default function Links() {
  const handleLinkClick = (linkName: string) => {
    trackEvent('link_click', {
      link_name: linkName.toLowerCase().replace(' ', '_'),
      page: 'links',
    });
  };

  return (
    <>
      <Helmet>
        <title>Links | Elatho Semijoias</title>
        <meta
          name="description"
          content="Acesse nossa loja, WhatsApp e redes sociais. Elatho Semijoias - Elegância que você merece."
        />
        <meta name="robots" content="noindex, nofollow" />
        <meta property="og:title" content="Elatho Semijoias" />
        <meta property="og:description" content="Acesse nossa loja e redes sociais" />
        <meta property="og:image" content="/og-image.jpg" />
      </Helmet>

      <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10 bg-gradient-to-br from-background to-secondary/30">
        <motion.div
          className="flex flex-col items-center text-center w-full max-w-sm"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Logo */}
          <motion.img
            src={logo}
            alt="Elatho Semijoias"
            className="w-48 h-auto object-contain mb-4"
            variants={itemVariants}
          />

          {/* Título */}
          <motion.h1
            className="font-display text-2xl text-foreground mb-1"
            variants={itemVariants}
          >
            Elatho Semijoias
          </motion.h1>

          {/* Tagline */}
          <motion.p
            className="text-sm text-muted-foreground mb-8"
            variants={itemVariants}
          >
            Elegância que você merece ✨
          </motion.p>

          {/* Links */}
          <motion.div
            className="flex flex-col gap-3 w-full max-w-xs"
            variants={containerVariants}
          >
            {links.map((link) => (
              <motion.a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleLinkClick(link.name)}
                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-card border-2 border-primary rounded-full text-foreground text-[15px] font-medium no-underline shadow-sm transition-all duration-300 hover:bg-primary hover:text-primary-foreground hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20"
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>{link.emoji}</span>
                <span>{link.name}</span>
              </motion.a>
            ))}
          </motion.div>

          {/* Footer */}
          <motion.p
            className="mt-8 text-sm text-muted-foreground"
            variants={itemVariants}
          >
            @elathosemijoias
          </motion.p>

          <motion.p
            className="mt-2 text-xs text-primary font-medium"
            variants={itemVariants}
          >
            💰 5% OFF no PIX • 4x sem juros
          </motion.p>
        </motion.div>
      </div>
    </>
  );
}
