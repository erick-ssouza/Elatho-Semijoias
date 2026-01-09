import { Badge } from "@/components/ui/badge";
import { SizeGuideModal } from "./SizeGuideModal";

interface RingSizeSelectorProps {
  tipoTamanho: string | null;
  faixaTamanho: string | null;
  tamanhosDisponiveis: string[] | null;
  selectedTamanho: string;
  onTamanhoChange: (tamanho: string) => void;
}

const TAMANHOS_PMG = [
  { id: "P", label: "P", descricao: "Nº 14-18" },
  { id: "M", label: "M", descricao: "Nº 19-23" },
  { id: "G", label: "G", descricao: "Nº 24-30" },
];

// All ring sizes from 12 to 30
const ALL_NUMERACOES = Array.from({ length: 19 }, (_, i) => String(12 + i)); // ["12", "13", ..., "30"]

export function RingSizeSelector({
  tipoTamanho,
  faixaTamanho,
  tamanhosDisponiveis,
  selectedTamanho,
  onTamanhoChange,
}: RingSizeSelectorProps) {
  // If no size type defined or not a ring, don't render
  if (!tipoTamanho) return null;

  // Tamanho Único
  if (tipoTamanho === "unico") {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Tamanho:</p>
        <Badge variant="secondary" className="text-sm font-normal px-3 py-1">
          Tamanho Único
        </Badge>
      </div>
    );
  }

  // Regulável
  if (tipoTamanho === "regulavel") {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Tamanho:</p>
        <Badge variant="secondary" className="text-sm font-normal px-3 py-1">
          Regulável{faixaTamanho ? ` (${faixaTamanho})` : ""}
        </Badge>
      </div>
    );
  }

  // Numeração (12-30) - show ONLY available sizes
  if (tipoTamanho === "numeracao") {
    const disponiveis = tamanhosDisponiveis || [];
    
    // Filter to show only available sizes (sorted) - now includes all numbers 12-30
    const numerosVisiveis = disponiveis
      .filter(n => ALL_NUMERACOES.includes(n))
      .sort((a, b) => parseInt(a) - parseInt(b));
    
    // If no sizes available, show message
    if (numerosVisiveis.length === 0) {
      return (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Tamanho:</p>
          <p className="text-sm text-muted-foreground italic">
            Sem tamanhos disponíveis no momento
          </p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm">
            Tamanho: <span className="font-medium">{selectedTamanho || "Selecione"}</span>
          </p>
          <SizeGuideModal />
        </div>
        
        <div className="flex flex-wrap gap-2">
          {numerosVisiveis.map((numero) => {
            const isSelected = selectedTamanho === numero;
            
            return (
              <button
                key={numero}
                onClick={() => onTamanhoChange(numero)}
                className={`flex items-center justify-center min-w-[48px] h-12 border rounded-lg transition-all ${
                  isSelected
                    ? "border-foreground bg-foreground text-background"
                    : "border-border hover:border-foreground"
                }`}
              >
                <span className="text-sm font-medium">{numero}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Tamanhos P/M/G - show ONLY available sizes
  if (tipoTamanho === "pmg") {
    const disponiveis = tamanhosDisponiveis || [];
    
    // Filter to show only available sizes
    const tamanhosVisiveis = TAMANHOS_PMG.filter(tamanho => disponiveis.includes(tamanho.id));
    
    // If no sizes available, show message
    if (tamanhosVisiveis.length === 0) {
      return (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Tamanho:</p>
          <p className="text-sm text-muted-foreground italic">
            Sem tamanhos disponíveis no momento
          </p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm">
            Tamanho: <span className="font-medium">{selectedTamanho || "Selecione"}</span>
          </p>
          <SizeGuideModal />
        </div>
        
        <div className="flex flex-wrap gap-3">
          {tamanhosVisiveis.map((tamanho) => {
            const isSelected = selectedTamanho === tamanho.id;
            
            return (
              <button
                key={tamanho.id}
                onClick={() => onTamanhoChange(tamanho.id)}
                className={`relative flex flex-col items-center justify-center min-w-[70px] h-16 border rounded-lg transition-all ${
                  isSelected
                    ? "border-foreground bg-foreground text-background"
                    : "border-border hover:border-foreground"
                }`}
              >
                <span className="text-lg font-medium">
                  {tamanho.label}
                </span>
                <span className={`text-[10px] ${isSelected ? "text-background/70" : "text-muted-foreground"}`}>
                  {tamanho.descricao}
                </span>
              </button>
            );
          })}
        </div>
        
        <p className="text-xs text-muted-foreground">
          P (Nº 14-18) | M (Nº 19-23) | G (Nº 24-30)
        </p>
      </div>
    );
  }

  return null;
}
