// Sistema de descrições automáticas para produtos
// Baseado em categoria + tipo de material
// IMPORTANTE: Descrições são geradas dinamicamente no site, NÃO salvar no banco!

export const FRASES_VALORIZACAO: Record<string, string> = {
  brincos: "Emoldure seu rosto com elegância. Peça criada para realçar sua beleza e expressar sua personalidade única.",
  aneis: "Símbolo de poder e sofisticação em suas mãos. Uma joia que celebra sua força e feminilidade.",
  colares: "Brilhe perto do coração. Peça desenhada para adornar seu colo com elegância atemporal.",
  pulseiras: "Movimento e brilho a cada gesto. Uma extensão da sua elegância que acompanha você em todos os momentos.",
  conjuntos: "Harmonia perfeita em cada detalhe. Um conjunto completo que expressa sua sofisticação e bom gosto.",
};

// Milésimos por categoria (brincos = 5, demais = 10)
export const MILESIMOS: Record<string, number> = {
  brincos: 5,
  aneis: 10,
  colares: 10,
  pulseiras: 10,
  conjuntos: 10,
};

export interface TipoMaterial {
  value: string;
  label: string;
  ehOuro: boolean;
  ehRodio: boolean;
  temZirconias: boolean;
  temPerolas: boolean;
}

export const TIPOS_MATERIAL: TipoMaterial[] = [
  { value: "ouro18k", label: "Banho de Ouro 18k", ehOuro: true, ehRodio: false, temZirconias: false, temPerolas: false },
  { value: "rodio", label: "Banho de Ródio", ehOuro: false, ehRodio: true, temZirconias: false, temPerolas: false },
  { value: "ouro18k_zirconias", label: "Banho de Ouro 18k com Zircônias", ehOuro: true, ehRodio: false, temZirconias: true, temPerolas: false },
  { value: "rodio_zirconias", label: "Banho de Ródio com Zircônias", ehOuro: false, ehRodio: true, temZirconias: true, temPerolas: false },
  { value: "ouro18k_perolas", label: "Banho de Ouro 18k com Pérolas", ehOuro: true, ehRodio: false, temZirconias: false, temPerolas: true },
  { value: "rodio_perolas", label: "Banho de Ródio com Pérolas", ehOuro: false, ehRodio: true, temZirconias: false, temPerolas: true },
];

export function getTipoMaterial(value: string): TipoMaterial | undefined {
  return TIPOS_MATERIAL.find(t => t.value === value);
}

/**
 * Gera descrição automática baseada na categoria e tipo de material
 * IMPORTANTE: Esta função é chamada no frontend para gerar a descrição em tempo real
 * A descrição NÃO é salva no banco de dados
 */
export function gerarDescricaoAutomatica(categoria: string, tipoMaterialValue: string): string {
  try {
    const categoriaKey = categoria.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const milesimos = MILESIMOS[categoriaKey] || 10;
    const frase = FRASES_VALORIZACAO[categoriaKey] || "";
    const material = getTipoMaterial(tipoMaterialValue);
    
    if (!material) return frase || "Semijoia de alta qualidade com acabamento antialérgico e camada de paládio. Garantia: 12 meses contra defeitos.";
    
    let descricao = `${frase}\n\n**Especificações:**\n`;
    
    // Material
    if (material.ehOuro) {
      descricao += `• Material: Liga metálica com banho de ouro 18k\n`;
    } else if (material.ehRodio) {
      descricao += `• Material: Liga metálica com banho de ródio\n`;
    }
    
    // Milésimos
    descricao += `• Espessura do banho: ${milesimos} milésimos\n`;
    
    // Pedras/Detalhes (se aplicável)
    if (material.temZirconias) {
      descricao += `• Pedras: Zircônias de alta qualidade\n`;
    }
    if (material.temPerolas) {
      descricao += `• Detalhes: Pérolas sintéticas de alto brilho\n`;
    }
    
    // Acabamento e garantia (sempre)
    descricao += `• Acabamento: Camada de paládio antialérgica\n`;
    descricao += `• Garantia: 12 meses contra defeitos`;
    
    return descricao;
  } catch (error) {
    console.error('Erro ao gerar descrição:', error);
    // Fallback seguro
    return "Semijoia de alta qualidade com acabamento antialérgico e camada de paládio. Garantia: 12 meses contra defeitos.";
  }
}

/**
 * Combina descrição automática com descrição adicional do admin
 */
export function combinarDescricoes(descricaoAutomatica: string, descricaoAdicional: string | null | undefined): string {
  if (!descricaoAdicional || !descricaoAdicional.trim()) {
    return descricaoAutomatica;
  }
  return `${descricaoAutomatica}\n\n${descricaoAdicional.trim()}`;
}

/**
 * Formata a descrição para exibição no site (converte markdown para HTML básico)
 */
export function formatarDescricaoParaExibicao(descricao: string | null): { frase: string; especificacoes: string[]; adicional: string } {
  if (!descricao) {
    return { frase: '', especificacoes: [], adicional: '' };
  }

  const linhas = descricao.split('\n').filter(l => l.trim());
  
  // Primeira linha é a frase de valorização
  let frase = '';
  const especificacoes: string[] = [];
  let adicional = '';
  let parteAtual: 'frase' | 'especificacoes' | 'adicional' = 'frase';
  
  for (const linha of linhas) {
    const trimmed = linha.trim();
    
    if (trimmed.startsWith('**Especificações:**') || trimmed === '**Especificações:**') {
      parteAtual = 'especificacoes';
      continue;
    }
    
    if (parteAtual === 'frase' && !trimmed.startsWith('•')) {
      frase = trimmed;
    } else if (parteAtual === 'especificacoes' && trimmed.startsWith('•')) {
      especificacoes.push(trimmed.slice(1).trim());
    } else if (!trimmed.startsWith('•') && !trimmed.startsWith('**')) {
      // Qualquer linha que não seja especificação após as especificações é adicional
      if (especificacoes.length > 0 && trimmed) {
        parteAtual = 'adicional';
        adicional += (adicional ? '\n' : '') + trimmed;
      }
    }
  }
  
  return { frase, especificacoes, adicional };
}

/**
 * Obtém o label do tipo de material a partir do value
 */
export function getMaterialLabel(value: string | null | undefined): string {
  if (!value) return '';
  const material = getTipoMaterial(value);
  return material?.label || '';
}
