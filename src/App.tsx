import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import BackgroundLayout from "@/components/layout/BackgroundLayout";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import ScrollToTopButton from "@/components/layout/ScrollToTopButton";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { AnimatedRoutes } from "@/components/layout/AnimatedRoutes";
import { GoogleAnalyticsProvider } from "@/components/seo/GoogleAnalytics";

const queryClient = new QueryClient();

// Wrapper component to conditionally render layout elements
function AppContent() {
  const location = useLocation();
  const isLinksPage = location.pathname === '/links';

  if (isLinksPage) {
    return (
      <>
        <ScrollToTop />
        <AnimatedRoutes />
      </>
    );
  }

  return (
    <>
      <ScrollToTop />
      <BackgroundLayout>
        <AnimatedRoutes />
        <WhatsAppButton />
        <ScrollToTopButton />
      </BackgroundLayout>
    </>
  );
}

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <GoogleAnalyticsProvider>
                <AppContent />
              </GoogleAnalyticsProvider>
            </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;