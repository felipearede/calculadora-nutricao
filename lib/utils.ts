import { Product, RecipeProduct, PPMCalculation } from './types';

/**
 * Calcula o PPM de um elemento específico
 * Fórmula: (% garantia / 100) × g/L × 1000 = mg/L (ppm)
 *
 * @param percentage - Porcentagem de garantia do elemento (ex: 15 para 15%)
 * @param gramsPerLiter - Gramas por litro do produto
 * @returns PPM do elemento
 */
export function calculatePPM(percentage: number, gramsPerLiter: number): number {
  return (percentage / 100) * gramsPerLiter * 1000;
}

/**
 * Calcula o total de gramas de um produto na receita
 * Fórmula: total_litros × g/L = gramas totais
 *
 * @param totalLiters - Total de litros da receita
 * @param gramsPerLiter - Gramas por litro do produto
 * @returns Total de gramas
 */
export function calculateTotalGrams(totalLiters: number, gramsPerLiter: number): number {
  return totalLiters * gramsPerLiter;
}

/**
 * Calcula o PPM total de todos os elementos na receita
 *
 * @param recipeProducts - Lista de produtos na receita
 * @returns Objeto com PPM de cada elemento
 */
export function calculateTotalPPM(recipeProducts: (RecipeProduct & { product: Product })[]): PPMCalculation {
  const ppm: PPMCalculation = {
    n: 0, p: 0, k: 0, ca: 0, mg: 0, s: 0,
    b: 0, cu: 0, fe: 0, mn: 0, zn: 0, mo: 0
  };

  recipeProducts.forEach(rp => {
    const product = rp.product;
    const gpl = rp.grams_per_liter;

    ppm.n += calculatePPM(product.n, gpl);
    ppm.p += calculatePPM(product.p, gpl) * 0.4364; // Converter P₂O₅ para P elementar
    ppm.k += calculatePPM(product.k, gpl) * 0.8302; // Converter K₂O para K elementar
    ppm.ca += calculatePPM(product.ca, gpl);
    ppm.mg += calculatePPM(product.mg, gpl);
    ppm.s += calculatePPM(product.s, gpl);
    ppm.b += calculatePPM(product.b, gpl);
    ppm.cu += calculatePPM(product.cu, gpl);
    ppm.fe += calculatePPM(product.fe, gpl);
    ppm.mn += calculatePPM(product.mn, gpl);
    ppm.zn += calculatePPM(product.zn, gpl);
    ppm.mo += calculatePPM(product.mo, gpl);
  });

  return ppm;
}

/**
 * Formata um número para exibição com 2 casas decimais
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.00';
  }
  return value.toFixed(2);
}

/**
 * Formata valores de PPM com precisão adequada ao tipo de nutriente
 * Macronutrientes: 2 casas decimais
 * Micronutrientes: até 7 casas decimais (remove zeros à direita)
 *
 * @param value - Valor a ser formatado
 * @param element - Código do elemento (n, p, k, etc)
 * @returns String formatada com a precisão apropriada
 */
export function formatPPM(value: number | null | undefined, element: string): string {
  if (value === null || value === undefined || isNaN(value)) {
    return isMacronutrient(element) ? '0.00' : '0.0000000';
  }

  if (isMacronutrient(element)) {
    // Macronutrientes: 2 casas decimais
    return value.toFixed(2);
  } else {
    // Micronutrientes: até 7 casas decimais, remove zeros à direita
    const formatted = value.toFixed(7);
    // Remove zeros desnecessários, mas mantém pelo menos uma casa decimal
    return formatted.replace(/\.?0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
  }
}

/**
 * Ordena produtos por sigla customizada
 * Ordem: NC, NP, MKP, SM, SP, Fe, B, Mn, Zn, Cu, Mo
 * Produtos não listados aparecem ao final, ordenados alfabeticamente
 *
 * @param products - Lista de produtos a ordenar
 * @returns Lista ordenada
 */
export function sortProductsByNutrients(products: Product[]): Product[] {
  const siglaOrder = ['NC', 'NP', 'MKP', 'SM', 'SP', 'Fe', 'B', 'Mn', 'Zn', 'Cu', 'Mo'];

  return [...products].sort((a, b) => {
    const aIndex = siglaOrder.indexOf(a.sigla);
    const bIndex = siglaOrder.indexOf(b.sigla);

    // Ambos na lista de ordem - ordena por índice
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }

    // Apenas 'a' na lista - 'a' vem primeiro
    if (aIndex !== -1) return -1;

    // Apenas 'b' na lista - 'b' vem primeiro
    if (bIndex !== -1) return 1;

    // Nenhum na lista - ordena alfabeticamente por nome
    return a.name.localeCompare(b.name);
  });
}

/**
 * Formata um valor monetário no padrão brasileiro
 * @param value - Valor a ser formatado
 * @returns String formatada como "R$ X,XX"
 */
export function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null) return '-';
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Configuração de tolerância por elemento
 * Macronutrientes: ±0.9 ppm
 * Micronutrientes: ±0.00000001 ppm
 */
const ELEMENT_CONFIG: Record<string, { isMacro: boolean; tolerance: number }> = {
  n: { isMacro: true, tolerance: 0.9 },
  p: { isMacro: true, tolerance: 0.9 },
  k: { isMacro: true, tolerance: 0.9 },
  ca: { isMacro: true, tolerance: 0.9 },
  mg: { isMacro: true, tolerance: 0.9 },
  s: { isMacro: true, tolerance: 0.9 },
  b: { isMacro: false, tolerance: 0.00000001 },
  cu: { isMacro: false, tolerance: 0.00000001 },
  fe: { isMacro: false, tolerance: 0.00000001 },
  mn: { isMacro: false, tolerance: 0.00000001 },
  zn: { isMacro: false, tolerance: 0.00000001 },
  mo: { isMacro: false, tolerance: 0.00000001 }
};

/**
 * Retorna a tolerância apropriada para um elemento
 * @param element - Código do elemento (n, p, k, etc)
 * @returns Tolerância em ppm
 */
export function getElementTolerance(element: string): number {
  return ELEMENT_CONFIG[element]?.tolerance ?? 0.9;
}

/**
 * Verifica se um elemento é macronutriente
 * @param element - Código do elemento
 * @returns true se for macronutriente
 */
export function isMacronutrient(element: string): boolean {
  return ELEMENT_CONFIG[element]?.isMacro ?? true;
}

/**
 * Calcula o preço por unidade de peso/volume
 * Converte o peso para gramas ou ml e divide o preço
 *
 * @param price - Preço do produto em reais
 * @param weight - Peso/volume do produto
 * @param unit - Unidade de medida (kg, g, mg, L, ml)
 * @returns Objeto com valor calculado e unidade, ou null se inválido
 */
export function calculatePricePerWeight(
  price: number | undefined | null,
  weight: number | undefined | null,
  unit: 'kg' | 'g' | 'mg' | 'L' | 'ml' | undefined
): { value: number; unit: string; formatted: string } | null {
  if (!price || !weight || !unit || price <= 0 || weight <= 0) {
    return null;
  }

  // Converter peso para gramas ou ml
  let weightInBaseUnit: number;
  let baseUnit: string;

  if (unit === 'kg') {
    weightInBaseUnit = weight * 1000; // kg para gramas
    baseUnit = 'g';
  } else if (unit === 'g') {
    weightInBaseUnit = weight; // já em gramas
    baseUnit = 'g';
  } else if (unit === 'mg') {
    weightInBaseUnit = weight * 0.001; // mg para gramas
    baseUnit = 'g';
  } else if (unit === 'L') {
    weightInBaseUnit = weight * 1000; // L para ml
    baseUnit = 'ml';
  } else if (unit === 'ml') {
    weightInBaseUnit = weight; // já em ml
    baseUnit = 'ml';
  } else {
    return null;
  }

  const pricePerWeight = price / weightInBaseUnit;
  const formatted = pricePerWeight.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  });

  return {
    value: pricePerWeight,
    unit: baseUnit,
    formatted: `${formatted} / ${baseUnit}`
  };
}
