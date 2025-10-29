export interface Product {
  id: string;
  name: string;
  marca: string;
  sigla: string;
  image_url?: string;
  product_url?: string;
  password?: string;
  weight?: number;
  weight_unit?: 'kg' | 'g' | 'mg' | 'L' | 'ml';
  price?: number;
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
  password?: string;
  owner?: string;
  recipe_types?: string[];
  target_n?: number;
  target_p?: number;
  target_k?: number;
  target_ca?: number;
  target_mg?: number;
  target_s?: number;
  target_b?: number;
  target_cu?: number;
  target_fe?: number;
  target_mn?: number;
  target_zn?: number;
  target_mo?: number;
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
  fe: number;
  b: number;
  mn: number;
  zn: number;
  cu: number;
  mo: number;
}
