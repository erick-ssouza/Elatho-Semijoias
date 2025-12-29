import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import BackgroundLayout from "@/components/layout/BackgroundLayout";
import Index from "./pages/Index";
import Produto from "./pages/Produto";
import Checkout from "./pages/Checkout";
import PedidoConfirmado from "./pages/PedidoConfirmado";
import PagamentoPix from "./pages/PagamentoPix";
import Sobre from "./pages/Sobre";
import FAQ from "./pages/FAQ";
import Trocas from "./pages/Trocas";
import Privacidade from "./pages/Privacidade";
import Cuidados from "./pages/Cuidados";
import Contato from "./pages/Contato";
import Auth from "./pages/Auth";
import Favoritos from "./pages/Favoritos";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ResetPassword from "./pages/admin/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <BackgroundLayout>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/produto/:id" element={<Produto />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/pedido-confirmado" element={<PedidoConfirmado />} />
                <Route path="/pagamento-pix" element={<PagamentoPix />} />
                <Route path="/sobre" element={<Sobre />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/trocas" element={<Trocas />} />
                <Route path="/privacidade" element={<Privacidade />} />
                <Route path="/cuidados" element={<Cuidados />} />
                <Route path="/contato" element={<Contato />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/favoritos" element={<Favoritos />} />
                <Route path="/painel-elatho-2025" element={<AdminLogin />} />
                <Route path="/painel-elatho-2025/dashboard" element={<AdminDashboard />} />
                <Route path="/painel-elatho-2025/reset-password" element={<ResetPassword />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BackgroundLayout>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
