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
    ppm.p += calculatePPM(product.p, gpl);
    ppm.k += calculatePPM(product.k, gpl);
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
export function formatNumber(value: number): string {
  return value.toFixed(2);
}
