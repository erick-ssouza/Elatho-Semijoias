import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from './PageTransition';

import Index from '@/pages/Index';
import Produto from '@/pages/Produto';
import Checkout from '@/pages/Checkout';
import PedidoConfirmado from '@/pages/PedidoConfirmado';
import PagamentoPix from '@/pages/PagamentoPix';
import Sobre from '@/pages/Sobre';
import FAQ from '@/pages/FAQ';
import Trocas from '@/pages/Trocas';
import Privacidade from '@/pages/Privacidade';
import Cuidados from '@/pages/Cuidados';
import Contato from '@/pages/Contato';
import Auth from '@/pages/Auth';
import Favoritos from '@/pages/Favoritos';
import Rastreio from '@/pages/Rastreio';
import MeusPedidos from '@/pages/MeusPedidos';
import MinhaConta from '@/pages/MinhaConta';
import AdminLogin from '@/pages/admin/AdminLogin';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import ResetPassword from '@/pages/admin/ResetPassword';
import NotFound from '@/pages/NotFound';

export function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/produto/:id" element={<PageTransition><Produto /></PageTransition>} />
        <Route path="/checkout" element={<PageTransition><Checkout /></PageTransition>} />
        <Route path="/pedido-confirmado" element={<PageTransition><PedidoConfirmado /></PageTransition>} />
        <Route path="/pagamento-pix" element={<PageTransition><PagamentoPix /></PageTransition>} />
        <Route path="/sobre" element={<PageTransition><Sobre /></PageTransition>} />
        <Route path="/faq" element={<PageTransition><FAQ /></PageTransition>} />
        <Route path="/trocas" element={<PageTransition><Trocas /></PageTransition>} />
        <Route path="/privacidade" element={<PageTransition><Privacidade /></PageTransition>} />
        <Route path="/cuidados" element={<PageTransition><Cuidados /></PageTransition>} />
        <Route path="/contato" element={<PageTransition><Contato /></PageTransition>} />
        <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/favoritos" element={<PageTransition><Favoritos /></PageTransition>} />
        <Route path="/rastreio" element={<PageTransition><Rastreio /></PageTransition>} />
        <Route path="/meus-pedidos" element={<PageTransition><MeusPedidos /></PageTransition>} />
        <Route path="/minha-conta" element={<PageTransition><MinhaConta /></PageTransition>} />
        <Route path="/painel-elatho-2025" element={<PageTransition><AdminLogin /></PageTransition>} />
        <Route path="/painel-elatho-2025/dashboard" element={<PageTransition><AdminDashboard /></PageTransition>} />
        <Route path="/painel-elatho-2025/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}