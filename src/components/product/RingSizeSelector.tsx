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

  // Tamanhos P/M/G
  if (tipoTamanho === "pmg") {
    const disponiveis = tamanhosDisponiveis || [];
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm">
            Tamanho: <span className="font-medium">{selectedTamanho || "Selecione"}</span>
          </p>
          <SizeGuideModal />
        </div>
        
        <div className="flex flex-wrap gap-3">
          {TAMANHOS.map((tamanho) => {
            const isDisponivel = disponiveis.includes(tamanho.id);
            const isSelected = selectedTamanho === tamanho.id;
            
            return (
              <button
                key={tamanho.id}
                onClick={() => isDisponivel && onTamanhoChange(tamanho.id)}
                disabled={!isDisponivel}
                className={`relative flex flex-col items-center justify-center min-w-[70px] h-16 border rounded-lg transition-all ${
                  isSelected
                    ? "border-foreground bg-foreground text-background"
                    : isDisponivel
                    ? "border-border hover:border-foreground"
                    : "border-border/50 bg-muted/50 cursor-not-allowed"
                }`}
              >
                <span className={`text-lg font-medium ${!isDisponivel ? "text-muted-foreground line-through" : ""}`}>
                  {tamanho.label}
                </span>
                <span className={`text-[10px] ${isSelected ? "text-background/70" : "text-muted-foreground"}`}>
                  {tamanho.descricao}
                </span>
                {!isDisponivel && (
                  <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-[9px] px-1.5 py-0.5 rounded">
                    Esgotado
                  </span>
                )}
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
