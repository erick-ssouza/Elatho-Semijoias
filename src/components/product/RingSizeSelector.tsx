import { Badge } from "@/components/ui/badge";
import { SizeGuideModal } from "./SizeGuideModal";

interface RingSizeSelectorProps {
  tipoTamanho: string | null;
  faixaTamanho: string | null;
  tamanhosDisponiveis: string[] | null;
  selectedTamanho: string;
  onTamanhoChange: (tamanho: string) => void;
}

const TAMANHOS = [
  { id: "P", label: "P", descricao: "Nº 12-14" },
  { id: "M", label: "M", descricao: "Nº 16-18" },
  { id: "G", label: "G", descricao: "Nº 20-22" },
];

export function RingSizeSelector({
  tipoTamanho,
  faixaTamanho,
  tamanhosDisponiveis,
  selectedTamanho,
  onTamanhoChange,
}: RingSizeSelectorProps) {
  // If no size type defined or not a ring, don't render
  if (!tipoTamanho) return null;

  // Tamanho Único / Regulável
  if (tipoTamanho === "unico") {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Tamanho:</p>
        <Badge variant="secondary" className="text-sm font-normal px-3 py-1">
          {faixaTamanho || "Tamanho Único"}
        </Badge>
      </div>
    );
  }

  // Tamanhos P/M/G - show ONLY available sizes
  if (tipoTamanho === "pmg") {
    const disponiveis = tamanhosDisponiveis || [];
    
    // Filter to show only available sizes
    const tamanhosVisiveis = TAMANHOS.filter(tamanho => disponiveis.includes(tamanho.id));
    
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
          P (Nº 12-14) | M (Nº 16-18) | G (Nº 20-22)
        </p>
      </div>
    );
  }

  return null;
}
