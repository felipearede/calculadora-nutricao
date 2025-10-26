export interface Product {
  id: string;
  name: string;
  n: number;  // Nitrogênio
  p: number;  // Fósforo
  k: number;  // Potássio
  ca: number; // Cálcio
  mg: number; // Magnésio
  s: number;  // Enxofre
  b: number;  // Boro
  cu: number; // Cobre
  fe: number; // Ferro
  mn: number; // Manganês
  zn: number; // Zinco
  mo: number; // Molibdênio
  created_at?: string;
}

export interface Recipe {
  id: string;
  name: string;
  total_liters: number;
  ec: number;
  ph: number;
  created_at?: string;
}

export interface RecipeProduct {
  id: string;
  recipe_id: string;
  product_id: string;
  grams_per_liter: number;
  product?: Product;
}

export interface PPMCalculation {
  n: number;
  p: number;
  k: number;
  ca: number;
  mg: number;
  s: number;
  b: number;
  cu: number;
  fe: number;
  mn: number;
  zn: number;
  mo: number;
}
