'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Product, RecipeProduct } from '@/lib/types';
import { calculateTotalGrams, calculateTotalPPM, formatNumber, sortProductsByNutrients, getElementTolerance, formatPPM } from '@/lib/utils';
import { useToast } from '@/components/Toast';
import MultiSelect from '@/components/MultiSelect';
import Accordion from '@/components/Accordion';

interface RecipeProductLocal extends Omit<RecipeProduct, 'id' | 'recipe_id'> {
  id?: string;
  product: Product;
}

function NewRecipeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const editId = searchParams.get('id');

  const [products, setProducts] = useState<Product[]>([]);
  const [recipeProducts, setRecipeProducts] = useState<RecipeProductLocal[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortColumn, setSortColumn] = useState<'name' | 'marca' | 'sigla' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [recipeData, setRecipeData] = useState({
    name: '',
    total_liters: 0,
    ec: 0,
    ph: 0,
    password: '',
    owner: '',
    recipe_types: [] as string[],
    target_n: undefined as number | undefined,
    target_p: undefined as number | undefined,
    target_k: undefined as number | undefined,
    target_ca: undefined as number | undefined,
    target_mg: undefined as number | undefined,
    target_s: undefined as number | undefined,
    target_b: undefined as number | undefined,
    target_cu: undefined as number | undefined,
    target_fe: undefined as number | undefined,
    target_mn: undefined as number | undefined,
    target_zn: undefined as number | undefined,
    target_mo: undefined as number | undefined
  });

  const [selectedProductId, setSelectedProductId] = useState('');
  const [gramsPerLiter, setGramsPerLiter] = useState<number>(0);

  // Estado para controlar seções expandidas/colapsadas
  const [expandedSections, setExpandedSections] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('recipe-form-sections-state');
      return saved ? JSON.parse(saved) : { details: true, targets: true, products: true };
    }
    return { details: true, targets: true, products: true };
  });

  // Salvar preferências no localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('recipe-form-sections-state', JSON.stringify(expandedSections));
    }
  }, [expandedSections]);

  const toggleSection = (section: 'details' | 'targets' | 'products') => {
    setExpandedSections((prev: any) => ({ ...prev, [section]: !prev[section] }));
  };

  const loadProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*');

    if (error) {
      console.error('Erro ao carregar produtos:', error);
    } else {
      const sortedProducts = sortProductsByNutrients(data || []);
      setProducts(sortedProducts);
    }
  }, []);

  const loadRecipeDetails = useCallback(async () => {
    if (!editId) return;

    const { data: recipeData, error: recipeError } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', editId)
      .single();

    if (recipeError) {
      console.error('Erro ao carregar receita:', recipeError);
      return;
    }

    const { data: productsData, error: productsError } = await supabase
      .from('recipe_products')
      .select('*, product:products(*)')
      .eq('recipe_id', editId);

    if (!productsError && productsData) {
      setRecipeData({
        name: recipeData.name,
        total_liters: recipeData.total_liters,
        ec: recipeData.ec,
        ph: recipeData.ph,
        password: recipeData.password || '',
        owner: recipeData.owner || '',
        recipe_types: recipeData.recipe_types || [],
        target_n: recipeData.target_n,
        target_p: recipeData.target_p,
        target_k: recipeData.target_k,
        target_ca: recipeData.target_ca,
        target_mg: recipeData.target_mg,
        target_s: recipeData.target_s,
        target_b: recipeData.target_b,
        target_cu: recipeData.target_cu,
        target_fe: recipeData.target_fe,
        target_mn: recipeData.target_mn,
        target_zn: recipeData.target_zn,
        target_mo: recipeData.target_mo
      });
      setRecipeProducts(productsData.map(rp => ({
        id: rp.id,
        product_id: rp.product_id,
        grams_per_liter: rp.grams_per_liter,
        product: rp.product as unknown as Product
      })));
    }
  }, [editId]);

  useEffect(() => {
    loadProducts();
    if (editId) {
      loadRecipeDetails();
    }
  }, [editId, loadProducts, loadRecipeDetails]);

  const addProductToRecipe = () => {
    if (!selectedProductId || gramsPerLiter <= 0) {
      showToast('Selecione um produto e informe a quantidade g/L', 'error');
      return;
    }

    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    if (recipeProducts.some(rp => rp.product_id === selectedProductId)) {
      showToast('Este produto já foi adicionado à receita', 'error');
      return;
    }

    setRecipeProducts([
      ...recipeProducts,
      {
        product_id: selectedProductId,
        grams_per_liter: gramsPerLiter,
        product
      }
    ]);

    setSelectedProductId('');
    setGramsPerLiter(0);
  };

  const removeProductFromRecipe = (productId: string) => {
    setRecipeProducts(recipeProducts.filter(rp => rp.product_id !== productId));
  };

  const updateProductGramsPerLiter = (productId: string, newValue: number) => {
    setRecipeProducts(recipeProducts.map(rp =>
      rp.product_id === productId ? { ...rp, grams_per_liter: newValue } : rp
    ));
  };

  const handleSort = (column: 'name' | 'marca' | 'sigla') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (recipeProducts.length === 0) {
      showToast('Adicione pelo menos um produto à receita', 'error');
      return;
    }

    setLoading(true);

    try {
      if (editId) {
        // Atualizar receita existente
        const { error: recipeError } = await supabase
          .from('recipes')
          .update(recipeData)
          .eq('id', editId);

        if (recipeError) throw recipeError;

        // Deletar produtos antigos
        await supabase
          .from('recipe_products')
          .delete()
          .eq('recipe_id', editId);

        // Inserir novos produtos
        const { error: productsError } = await supabase
          .from('recipe_products')
          .insert(recipeProducts.map(rp => ({
            recipe_id: editId,
            product_id: rp.product_id,
            grams_per_liter: rp.grams_per_liter
          })));

        if (productsError) throw productsError;

        showToast('Receita atualizada com sucesso!', 'success');
        router.push(`/receitas/${editId}`);
      } else {
        // Criar nova receita
        const { data: newRecipe, error: recipeError } = await supabase
          .from('recipes')
          .insert([recipeData])
          .select()
          .single();

        if (recipeError) throw recipeError;

        // Inserir produtos da receita
        const { error: productsError } = await supabase
          .from('recipe_products')
          .insert(recipeProducts.map(rp => ({
            recipe_id: newRecipe.id,
            product_id: rp.product_id,
            grams_per_liter: rp.grams_per_liter
          })));

        if (productsError) throw productsError;

        showToast('Receita criada com sucesso!', 'success');
        router.push(`/receitas/${newRecipe.id}`);
      }
    } catch (error) {
      console.error('Erro ao salvar receita:', error);
      showToast('Erro ao salvar receita', 'error');
    } finally {
      setLoading(false);
    }
  };

  const sortedRecipeProducts = [...recipeProducts].sort((a, b) => {
    if (!sortColumn) {
      // Ordenação padrão por sigla customizada
      const sorted = sortProductsByNutrients([a.product, b.product]);
      return sorted.findIndex(p => p.id === a.product.id) - sorted.findIndex(p => p.id === b.product.id);
    }

    const aValue = a.product[sortColumn];
    const bValue = b.product[sortColumn];

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return 0;
  });

  const ppmData = calculateTotalPPM(recipeProducts.map(rp => ({
    ...rp,
    id: rp.id || '',
    recipe_id: editId || ''
  })));

  const getProductsForElement = (element: string): string[] => {
    const products: string[] = [];

    sortedRecipeProducts.forEach(rp => {
      const elementValue = rp.product[element.toLowerCase() as keyof Product];
      if (typeof elementValue === 'number' && elementValue > 0) {
        products.push(rp.product.sigla);
      }
    });

    return products;
  };

  const SortableHeader = ({ column, label }: { column: 'name' | 'marca' | 'sigla'; label: string }) => (
    <th
      className="px-4 py-2 text-left text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800 select-none transition"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortColumn === column && (
          <span className="text-xs">
            {sortDirection === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  );

  const formatProductNutrients = (product: Product): string => {
    const nutrients: string[] = [];

    // Sempre mostrar os macros principais
    if (product.n > 0) nutrients.push(`N:${product.n}%`);
    if (product.p > 0) nutrients.push(`P:${product.p}%`);
    if (product.k > 0) nutrients.push(`K:${product.k}%`);

    // Mostrar Ca, Mg, S se tiverem valor
    if (product.ca > 0) nutrients.push(`Ca:${product.ca}%`);
    if (product.mg > 0) nutrients.push(`Mg:${product.mg}%`);
    if (product.s > 0) nutrients.push(`S:${product.s}%`);

    return nutrients.length > 0 ? ` | ${nutrients.join(' ')}` : '';
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => router.push('/receitas')}
          className="text-blue-600 dark:text-blue-400 hover:underline mb-2 text-sm"
        >
          ← Voltar para Receitas
        </button>
        <h1 className="text-3xl font-bold text-blue-800 dark:text-blue-400">
          {editId ? 'Editar Receita' : 'Nova Receita'}
        </h1>
      </div>

      <form onSubmit={handleSaveRecipe} className="space-y-0">
        {/* Seção 1: Detalhes da Receita */}
        <Accordion
          title="1. Detalhes da Receita"
          isExpanded={expandedSections.details}
          onToggle={() => toggleSection('details')}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Nome da Receita</label>
              <input
                type="text"
                value={recipeData.name}
                onChange={(e) => setRecipeData({ ...recipeData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Total de Litros</label>
              <input
                type="number"
                step="0.01"
                value={recipeData.total_liters}
                onChange={(e) => setRecipeData({ ...recipeData, total_liters: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">EC</label>
              <input
                type="number"
                step="0.01"
                value={recipeData.ec}
                onChange={(e) => setRecipeData({ ...recipeData, ec: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">pH</label>
              <input
                type="number"
                step="0.01"
                value={recipeData.ph}
                onChange={(e) => setRecipeData({ ...recipeData, ph: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                Senha (opcional)
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">Para proteger edição e exclusão</span>
              </label>
              <input
                type="password"
                value={recipeData.password}
                onChange={(e) => setRecipeData({ ...recipeData, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Deixe em branco se não quiser proteger"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                Proprietário (opcional)
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">Ex: @joao, @maria123</span>
              </label>
              <input
                type="text"
                value={recipeData.owner}
                onChange={(e) => setRecipeData({ ...recipeData, owner: e.target.value.trim() })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Digite o nome do proprietário"
              />
            </div>
            <div className="md:col-span-2">
              <MultiSelect
                label="Tipo de Receita (opcional)"
                options={['vega', 'flora', 'clone', 'madre']}
                selectedValues={recipeData.recipe_types}
                onChange={(selected) => setRecipeData({ ...recipeData, recipe_types: selected })}
                placeholder="Selecione os tipos de receita"
              />
            </div>
          </div>
        </Accordion>

        {/* Seção 2: PPM Alvo */}
        <Accordion
          title="2. PPM Alvo"
          isExpanded={expandedSections.targets}
          onToggle={() => toggleSection('targets')}
          badge={Object.values(recipeData).filter((v, i) => i >= 5 && v !== undefined).length}
        >
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Defina os valores alvo de PPM para cada elemento. Isso ajudará a visualizar o quanto falta para atingir seus objetivos.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-900 dark:text-gray-100">N (ppm)</label>
              <input
                type="number"
                step="0.01"
                value={recipeData.target_n ?? ''}
                onChange={(e) => setRecipeData({ ...recipeData, target_n: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="150-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-900 dark:text-gray-100">P (ppm)</label>
              <input
                type="number"
                step="0.01"
                value={recipeData.target_p ?? ''}
                onChange={(e) => setRecipeData({ ...recipeData, target_p: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="30-60"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-900 dark:text-gray-100">K (ppm)</label>
              <input
                type="number"
                step="0.01"
                value={recipeData.target_k ?? ''}
                onChange={(e) => setRecipeData({ ...recipeData, target_k: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="150-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-900 dark:text-gray-100">Ca (ppm)</label>
              <input
                type="number"
                step="0.01"
                value={recipeData.target_ca ?? ''}
                onChange={(e) => setRecipeData({ ...recipeData, target_ca: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="100-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-900 dark:text-gray-100">Mg (ppm)</label>
              <input
                type="number"
                step="0.01"
                value={recipeData.target_mg ?? ''}
                onChange={(e) => setRecipeData({ ...recipeData, target_mg: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="40-80"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-900 dark:text-gray-100">S (ppm)</label>
              <input
                type="number"
                step="0.01"
                value={recipeData.target_s ?? ''}
                onChange={(e) => setRecipeData({ ...recipeData, target_s: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="40-80"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-900 dark:text-gray-100">Fe (ppm)</label>
              <input
                type="number"
                step="0.01"
                value={recipeData.target_fe ?? ''}
                onChange={(e) => setRecipeData({ ...recipeData, target_fe: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="1-3"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-900 dark:text-gray-100">B (ppm)</label>
              <input
                type="number"
                step="0.01"
                value={recipeData.target_b ?? ''}
                onChange={(e) => setRecipeData({ ...recipeData, target_b: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="0.2-0.5"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-900 dark:text-gray-100">Mn (ppm)</label>
              <input
                type="number"
                step="0.01"
                value={recipeData.target_mn ?? ''}
                onChange={(e) => setRecipeData({ ...recipeData, target_mn: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="0.5-1"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-900 dark:text-gray-100">Zn (ppm)</label>
              <input
                type="number"
                step="0.01"
                value={recipeData.target_zn ?? ''}
                onChange={(e) => setRecipeData({ ...recipeData, target_zn: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="0.3-0.5"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-900 dark:text-gray-100">Cu (ppm)</label>
              <input
                type="number"
                step="0.01"
                value={recipeData.target_cu ?? ''}
                onChange={(e) => setRecipeData({ ...recipeData, target_cu: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="0.05-0.1"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-900 dark:text-gray-100">Mo (ppm)</label>
              <input
                type="number"
                step="0.01"
                value={recipeData.target_mo ?? ''}
                onChange={(e) => setRecipeData({ ...recipeData, target_mo: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="0.05"
              />
            </div>
          </div>
        </Accordion>

        {/* Seção 3: Produtos e Concentração */}
        <Accordion
          title="3. Produtos e Concentração"
          isExpanded={expandedSections.products}
          onToggle={() => toggleSection('products')}
          badge={recipeProducts.length}
        >
          {/* Adicionar Produtos */}
          <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">Adicionar Produto</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Produto</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Selecione um produto</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} - {product.marca} ({product.sigla}){formatProductNutrients(product)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">g/L</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.0000001"
                  value={gramsPerLiter}
                  onChange={(e) => setGramsPerLiter(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={addProductToRecipe}
                  className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 whitespace-nowrap transition"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Layout Responsivo: Produtos e PPM lado a lado no desktop */}
        {recipeProducts.length > 0 && (
          <div className="grid lg:grid-cols-[1fr_400px] gap-6">
            {/* Coluna Esquerda: Produtos Adicionados */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">Produtos na Receita</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-blue-100 dark:bg-blue-900">
                    <tr>
                      <SortableHeader column="name" label="Produto" />
                      <SortableHeader column="marca" label="Marca" />
                      <SortableHeader column="sigla" label="Sigla" />
                      <th className="px-4 py-2 text-center text-gray-900 dark:text-gray-100">g/L</th>
                      <th className="px-4 py-2 text-center text-gray-900 dark:text-gray-100">Gramas Totais</th>
                      <th className="px-4 py-2 text-center text-gray-900 dark:text-gray-100">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRecipeProducts.map((rp) => (
                      <tr key={rp.product_id} className="border-t border-gray-200 dark:border-gray-700">
                        <td className="px-4 py-2 font-medium text-gray-900 dark:text-gray-100">
                          {rp.product.name}
                        </td>
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                          {rp.product.marca}
                        </td>
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                          {rp.product.sigla}
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            step="0.0000001"
                            value={rp.grams_per_liter}
                            onChange={(e) => updateProductGramsPerLiter(rp.product_id, e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </td>
                        <td className="px-4 py-2 text-center font-medium text-gray-900 dark:text-gray-100">
                          {formatNumber(calculateTotalGrams(recipeData.total_liters, rp.grams_per_liter))}g
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeProductFromRecipe(rp.product_id)}
                            className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition text-xl"
                            title="Remover produto"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Coluna Direita: Tabela PPM (Sticky no Desktop) */}
            <div className="lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-80px)]">
              <div className="border-t border-gray-200 dark:border-gray-700 lg:border-t-0 pt-4 lg:pt-0">
                <div className="bg-white dark:bg-gray-800 lg:border lg:border-gray-200 lg:dark:border-gray-700 lg:rounded-lg lg:p-4 lg:shadow-lg">
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">Concentração (PPM)</h3>
                  <div className="grid grid-cols-2 gap-2 lg:max-h-[calc(100vh-200px)] lg:overflow-y-auto lg:pr-2">
                    {['n', 'p', 'k', 'ca', 'mg', 's', 'fe', 'b', 'mn', 'zn', 'cu', 'mo'].map((element) => {
                      const value = ppmData[element as keyof typeof ppmData];
                      const products = getProductsForElement(element);
                      const targetKey = `target_${element}` as keyof typeof recipeData;
                      const targetValue = recipeData[targetKey] as number | undefined;
                      const diff = targetValue !== undefined ? value - targetValue : null;
                      const tolerance = getElementTolerance(element);
                      const isWithinTolerance = diff !== null && Math.abs(diff) <= tolerance;

                      return (
                        <div key={element} className="bg-gray-100 dark:bg-gray-700 p-2.5 rounded-lg text-center">
                          <div className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">{element}</div>
                          <div className="text-base font-bold text-blue-700 dark:text-blue-400 mt-0.5">
                            {formatPPM(value, element)} ppm
                          </div>
                          {targetValue !== undefined && (
                            <>
                              <div className="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5">
                                Alvo: {formatPPM(targetValue, element)} ppm
                              </div>
                              <div className={`text-xs font-semibold mt-0.5 ${
                                isWithinTolerance
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-red-600 dark:text-red-400'
                              }`}>
                                {diff !== null && (
                                  isWithinTolerance
                                    ? `✓ ${diff >= 0 ? '+' : ''}${formatPPM(diff, element)}`
                                    : diff < 0
                                      ? `- ${formatPPM(Math.abs(diff), element)} falta`
                                      : `+ ${formatPPM(diff, element)} a mais`
                                )}
                              </div>
                            </>
                          )}
                          {products.length > 0 && (
                            <div
                              className="text-[9px] text-gray-700 dark:text-gray-200 mt-1 truncate leading-tight font-medium"
                              title={products.join(', ')}
                            >
                              {products.join(', ')}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </Accordion>

        <div className="flex gap-2 mt-6">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 dark:bg-blue-700 text-white py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 font-semibold transition"
          >
            {loading ? 'Salvando...' : editId ? 'Atualizar Receita' : 'Salvar Receita'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/receitas')}
            className="px-6 bg-gray-500 dark:bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-600 dark:hover:bg-gray-500 font-semibold transition"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewRecipePage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-xl text-gray-600 dark:text-gray-400">Carregando...</div>
      </div>
    }>
      <NewRecipeContent />
    </Suspense>
  );
}
