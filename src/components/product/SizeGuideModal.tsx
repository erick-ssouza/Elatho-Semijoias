import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle, MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "5511999999999"; // Replace with actual number

export function SizeGuideModal() {
  const handleWhatsApp = () => {
    const message = encodeURIComponent("Olá! Preciso de ajuda para descobrir meu tamanho de anel.");
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline">
          <HelpCircle className="w-3.5 h-3.5" />
          Como descobrir meu tamanho?
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Guia de Tamanhos</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {/* How to measure */}
          <section className="space-y-3">
            <h3 className="font-medium text-sm uppercase tracking-wide">Como medir</h3>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="font-medium text-foreground">1.</span>
                Pegue um barbante ou fita métrica flexível
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-foreground">2.</span>
                Enrole ao redor do dedo onde usará o anel
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-foreground">3.</span>
                Marque onde o barbante se encontra
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-foreground">4.</span>
                Meça o comprimento com uma régua (em mm)
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-foreground">5.</span>
                Consulte a tabela abaixo
              </li>
            </ol>
          </section>

          {/* Conversion table */}
          <section className="space-y-3">
            <h3 className="font-medium text-sm uppercase tracking-wide">Tabela de Conversão</h3>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Circunf. (mm)</th>
                    <th className="px-3 py-2 text-left font-medium">Nº Anel</th>
                    <th className="px-3 py-2 text-left font-medium">Tamanho</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-3 py-2 text-muted-foreground">44-46</td>
                    <td className="px-3 py-2">12</td>
                    <td className="px-3 py-2 font-medium">P</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-muted-foreground">47-49</td>
                    <td className="px-3 py-2">14</td>
                    <td className="px-3 py-2 font-medium">P</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-muted-foreground">50-52</td>
                    <td className="px-3 py-2">16</td>
                    <td className="px-3 py-2 font-medium">M</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-muted-foreground">53-55</td>
                    <td className="px-3 py-2">18</td>
                    <td className="px-3 py-2 font-medium">M</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-muted-foreground">56-58</td>
                    <td className="px-3 py-2">20</td>
                    <td className="px-3 py-2 font-medium">G</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-muted-foreground">59-61</td>
                    <td className="px-3 py-2">22</td>
                    <td className="px-3 py-2 font-medium">G</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* P/M/G reference */}
          <section className="space-y-3">
            <h3 className="font-medium text-sm uppercase tracking-wide">Referência P/M/G</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="border border-border rounded-lg p-3 text-center">
                <span className="block font-medium text-lg">P</span>
                <span className="text-xs text-muted-foreground">Nº 12-14</span>
              </div>
              <div className="border border-border rounded-lg p-3 text-center">
                <span className="block font-medium text-lg">M</span>
                <span className="text-xs text-muted-foreground">Nº 16-18</span>
              </div>
              <div className="border border-border rounded-lg p-3 text-center">
                <span className="block font-medium text-lg">G</span>
                <span className="text-xs text-muted-foreground">Nº 20-22</span>
              </div>
            </div>
          </section>

          {/* WhatsApp help */}
          <div className="pt-4 border-t border-border">
            <Button 
              variant="outline" 
              className="w-full gap-2"
              onClick={handleWhatsApp}
            >
              <MessageCircle className="w-4 h-4" />
              Ainda tenho dúvidas
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
