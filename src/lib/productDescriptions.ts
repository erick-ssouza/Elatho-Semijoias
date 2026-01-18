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

// Frases destaque para produtos (selecionável no admin)
export const FRASES_DESTAQUE: string[] = [
  "Qualidade premium que cabe no seu bolso, com acabamento refinado e brilho que acompanha você por muito mais tempo.",
  "Mais brilho, mais cuidado no acabamento e mais valor real para quem escolhe bem o que usa.",
  "Feita para durar, pensada em cada detalhe para encantar desde o primeiro olhar até o uso no dia a dia.",
  "Um investimento inteligente em beleza, estilo e qualidade — sem exageros no preço.",
  "Você paga um valor justo e recebe uma peça que supera expectativas em acabamento, brilho e conforto.",
  "Acabamento refinado e cuidadoso para mulheres que não abrem mão de qualidade e elegância.",
  "Uma peça versátil e sofisticada, feita para acompanhar você em todos os momentos da sua rotina.",
  "Perfeita para presentear — uma semijoia que transmite cuidado, bom gosto e atenção aos detalhes.",
  "Pequenos detalhes de acabamento e design que elevam qualquer look instantaneamente.",
  "Semijoia de alto padrão para quem valoriza design, qualidade e bom gosto em cada escolha.",
];

/**
 * Obtém frase destaque por ID (1-10) ou sorteia uma aleatória se null/0
 */
export function getFraseDestaque(id: number | null | undefined): string {
  if (!id || id <= 0 || id > FRASES_DESTAQUE.length) {
    // Sorteia uma frase aleatória
    const index = Math.floor(Math.random() * FRASES_DESTAQUE.length);
    return FRASES_DESTAQUE[index];
  }
  return FRASES_DESTAQUE[id - 1];
}

// Definição dos materiais base e complementos para checkboxes
export interface MaterialBase {
  id: string;
  label: string;
  descricaoMaterial: string;
}

export interface MaterialComplemento {
  id: string;
  label: string;
  descricaoComplemento: string;
}

export const MATERIAIS_BASE: MaterialBase[] = [
  { id: "ouro", label: "Ouro (Dourado)", descricaoMaterial: "Banho de Ouro 18k" },
  { id: "ouro_branco", label: "Ouro Branco", descricaoMaterial: "Banho de Ouro Branco" },
  { id: "rodio", label: "Ródio", descricaoMaterial: "Banho de Ródio" },
  { id: "rose", label: "Rosé", descricaoMaterial: "Banho de Rosé" },
];

export const MATERIAIS_COMPLEMENTO: MaterialComplemento[] = [
  { id: "zirconia", label: "Zircônia", descricaoComplemento: "com Zircônias" },
  { id: "perolas", label: "Pérolas", descricaoComplemento: "com Pérolas" },
];

/**
 * Gera a string de tipo de material a partir dos checkboxes selecionados
 * Exemplo: ["ouro", "rodio"] + ["zirconia"] = "Banho de Ouro 18k e Ródio com Zircônias"
 */
export function gerarTipoMaterialString(
  materiaisBase: string[],
  materiaisComplemento: string[]
): string {
  if (materiaisBase.length === 0) return "";

  // Mapear os materiais base selecionados
  const basesDescricao = materiaisBase
    .map(id => MATERIAIS_BASE.find(m => m.id === id)?.descricaoMaterial)
    .filter(Boolean);

  if (basesDescricao.length === 0) return "";

  // Construir a parte base
  let resultado = "";
  if (basesDescricao.length === 1) {
    resultado = basesDescricao[0]!;
  } else if (basesDescricao.length === 2) {
    // Remover "Banho de" do segundo para evitar repetição
    const primeiro = basesDescricao[0]!;
    const segundo = basesDescricao[1]!.replace("Banho de ", "");
    resultado = `${primeiro} e ${segundo}`;
  } else {
    // 3+ materiais
    const primeiro = basesDescricao[0]!;
    const meios = basesDescricao.slice(1, -1).map(m => m!.replace("Banho de ", ""));
    const ultimo = basesDescricao[basesDescricao.length - 1]!.replace("Banho de ", "");
    resultado = `${primeiro}, ${meios.join(", ")} e ${ultimo}`;
  }

  // Adicionar complementos se houver
  if (materiaisComplemento.length > 0) {
    const complementosDescricao = materiaisComplemento
      .map(id => MATERIAIS_COMPLEMENTO.find(m => m.id === id)?.descricaoComplemento)
      .filter(Boolean);

    if (complementosDescricao.length === 1) {
      resultado += ` ${complementosDescricao[0]}`;
    } else if (complementosDescricao.length === 2) {
      // "com Zircônias e Pérolas"
      const primeiro = complementosDescricao[0]!;
      const segundo = complementosDescricao[1]!.replace("com ", "");
      resultado += ` ${primeiro} e ${segundo}`;
    }
  }

  return resultado;
}

/**
 * Parseia uma string de tipo de material de volta para os IDs de checkboxes
 * Para carregar produtos existentes no editor
 */
export function parseTipoMaterialString(tipoMaterial: string | null): {
  materiaisBase: string[];
  materiaisComplemento: string[];
} {
  if (!tipoMaterial) return { materiaisBase: [], materiaisComplemento: [] };

  const materiaisBase: string[] = [];
  const materiaisComplemento: string[] = [];
  const lower = tipoMaterial.toLowerCase();

  // Detectar materiais base
  if (lower.includes("ouro 18k") || (lower.includes("ouro") && !lower.includes("ouro branco"))) {
    materiaisBase.push("ouro");
  }
  if (lower.includes("ouro branco")) {
    materiaisBase.push("ouro_branco");
  }
  if (lower.includes("ródio") || lower.includes("rodio")) {
    materiaisBase.push("rodio");
  }
  if (lower.includes("rosé") || lower.includes("rose")) {
    materiaisBase.push("rose");
  }

  // Detectar complementos
  if (lower.includes("zircônia") || lower.includes("zirconia")) {
    materiaisComplemento.push("zirconia");
  }
  if (lower.includes("pérola") || lower.includes("perola")) {
    materiaisComplemento.push("perolas");
  }

  return { materiaisBase, materiaisComplemento };
}

export interface TipoMaterial {
  value: string;
  label: string;
  ehOuro: boolean;
  ehRodio: boolean;
  temZirconias: boolean;
  temPerolas: boolean;
}

// Manter compatibilidade com sistema antigo (dropdown)
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
 * Detecta características do material a partir da string gerada
 */
function detectarCaracteristicasMaterial(tipoMaterial: string): {
  ehOuro: boolean;
  ehRodio: boolean;
  ehRose: boolean;
  temZirconias: boolean;
  temPerolas: boolean;
} {
  const lower = tipoMaterial.toLowerCase();
  return {
    ehOuro: lower.includes("ouro") && !lower.includes("ouro branco"),
    ehRodio: lower.includes("ródio") || lower.includes("rodio"),
    ehRose: lower.includes("rosé") || lower.includes("rose"),
    temZirconias: lower.includes("zircônia") || lower.includes("zirconia"),
    temPerolas: lower.includes("pérola") || lower.includes("perola"),
  };
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
    
    // Primeiro tenta o sistema antigo (dropdown com values como "ouro18k")
    const material = getTipoMaterial(tipoMaterialValue);
    
    let ehOuro = false;
    let ehRodio = false;
    let ehRose = false;
    let temZirconias = false;
    let temPerolas = false;

    if (material) {
      // Sistema antigo
      ehOuro = material.ehOuro;
      ehRodio = material.ehRodio;
      temZirconias = material.temZirconias;
      temPerolas = material.temPerolas;
    } else if (tipoMaterialValue) {
      // Sistema novo - detectar a partir da string gerada
      const caracteristicas = detectarCaracteristicasMaterial(tipoMaterialValue);
      ehOuro = caracteristicas.ehOuro;
      ehRodio = caracteristicas.ehRodio;
      ehRose = caracteristicas.ehRose;
      temZirconias = caracteristicas.temZirconias;
      temPerolas = caracteristicas.temPerolas;
    } else {
      return frase || "Semijoia de alta qualidade com acabamento antialérgico e camada de paládio. Garantia: 12 meses contra defeitos.";
    }
    
    let descricao = `${frase}\n\n**Especificações:**\n`;
    
    // Material - usar a string direta se for do sistema novo
    if (material) {
      if (ehOuro) {
        descricao += `• Material: Liga metálica com banho de ouro 18k\n`;
      } else if (ehRodio) {
        descricao += `• Material: Liga metálica com banho de ródio\n`;
      }
    } else {
      // Sistema novo - usar a string completa
      descricao += `• Material: Liga metálica com ${tipoMaterialValue.replace("Banho de ", "").toLowerCase()}\n`;
    }
    
    // Milésimos
    descricao += `• Espessura do banho: ${milesimos} milésimos\n`;
    
    // Pedras/Detalhes (se aplicável)
    if (temZirconias) {
      descricao += `• Pedras: Zircônias de alta qualidade\n`;
    }
    if (temPerolas) {
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
  // Se não encontrar no sistema antigo, retorna a própria string (sistema novo)
  return material?.label || value;
}
