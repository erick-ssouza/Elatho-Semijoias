import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Package, ExternalLink, MessageCircle } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Rastreio() {
  const [codigoRastreio, setCodigoRastreio] = useState("");

  const handleRastrear = () => {
    const url = codigoRastreio.trim()
      ? `https://rastreamento.correios.com.br/app/index.php?objetos=${codigoRastreio.trim()}`
      : "https://rastreamento.correios.com.br/app/index.php";
    window.open(url, "_blank");
  };

  return (
    <>
      <Helmet>
        <title>Rastrear Pedido | Elatho Semijoias</title>
        <meta name="description" content="Rastreie seu pedido Elatho Semijoias. Acompanhe a entrega pelos Correios." />
      </Helmet>

      <Navbar />
      
      <main className="pt-24 pb-16 min-h-screen">
        <div className="container mx-auto px-6">
          <Breadcrumbs items={[{ label: "Rastrear Pedido" }]} />

          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-display mb-3">
              Rastrear Pedido
            </h1>
            <p className="text-muted-foreground">
              Acompanhe sua entrega pelos Correios
            </p>
          </div>

          {/* Main Section */}
          <div className="max-w-md mx-auto">
            <div className="p-8 border border-border bg-card rounded-lg">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Package className="h-8 w-8 text-primary" />
                </div>
              </div>

              <div className="space-y-4">
                <Input
                  type="text"
                  value={codigoRastreio}
                  onChange={(e) => setCodigoRastreio(e.target.value.toUpperCase())}
                  placeholder="Digite seu código (ex: BR123456789BR)"
                  className="text-center"
                />
                
                <Button
                  onClick={handleRastrear}
                  className="w-full"
                >
                  Rastrear nos Correios
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center mt-4">
                O código foi enviado para você via WhatsApp após a postagem
              </p>
            </div>

            {/* Support Section */}
            <div className="mt-8 p-6 border border-border bg-muted/30 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Não recebeu o código ou tem dúvidas?
              </p>
              <Button
                variant="outline"
                asChild
              >
                <a
                  href="https://wa.me/5519998229202"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Falar no WhatsApp
                </a>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
