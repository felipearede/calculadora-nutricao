'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Product, Recipe, RecipeProduct } from '@/lib/types';
import { calculateTotalGrams, calculateTotalPPM, formatNumber } from '@/lib/utils';

interface RecipeProductLocal extends Omit<RecipeProduct, 'id' | 'recipe_id'> {
  id?: string;
  product: Product;
}

export default function ReceitasPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [recipeProducts, setRecipeProducts] = useState<RecipeProductLocal[]>([]);
  const [loading, setLoading] = useState(false);

  const [recipeData, setRecipeData] = useState({
    name: '',
    total_liters: 0,
    ec: 0,
    ph: 0
  });

  const [selectedProductId, setSelectedProductId] = useState('');
  const [gramsPerLiter, setGramsPerLiter] = useState<number>(0);

  useEffect(() => {
    loadProducts();
    loadRecipes();
  }, []);

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');

    if (error) {
      console.error('Erro ao carregar produtos:', error);
    } else {
      setProducts(data || []);
    }
  };

  const loadRecipes = async () => {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar receitas:', error);
    } else {
      setRecipes(data || []);
    }
  };

  const loadRecipeDetails = async (recipe: Recipe) => {
    const { data, error } = await supabase
      .from('recipe_products')
      .select('*, product:products(*)')
      .eq('recipe_id', recipe.id);

    if (error) {
      console.error('Erro ao carregar detalhes da receita:', error);
    } else {
      const formattedData = data.map(rp => ({
        id: rp.id,
        product_id: rp.product_id,
        grams_per_liter: rp.grams_per_liter,
        product: rp.product as unknown as Product
      }));
      setRecipeProducts(formattedData);
      setSelectedRecipe(recipe);
      setRecipeData({
        name: recipe.name,
        total_liters: recipe.total_liters,
        ec: recipe.ec,
        ph: recipe.ph
      });
    }
  };

  const addProductToRecipe = () => {
    if (!selectedProductId || gramsPerLiter <= 0) {
      alert('Selecione um produto e informe a quantidade g/L');
      return;
    }

    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    // Verificar se o produto já foi adicionado
    if (recipeProducts.some(rp => rp.product_id === selectedProductId)) {
      alert('Este produto já foi adicionado à receita');
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

  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (recipeProducts.length === 0) {
      alert('Adicione pelo menos um produto à receita');
      return;
    }

    setLoading(true);

    try {
      if (selectedRecipe) {
        // Atualizar receita existente
        const { error: recipeError } = await supabase
          .from('recipes')
          .update(recipeData)
          .eq('id', selectedRecipe.id);

        if (recipeError) throw recipeError;

        // Deletar produtos antigos
        await supabase
          .from('recipe_products')
          .delete()
          .eq('recipe_id', selectedRecipe.id);

        // Inserir novos produtos
        const { error: productsError } = await supabase
          .from('recipe_products')
          .insert(recipeProducts.map(rp => ({
            recipe_id: selectedRecipe.id,
            product_id: rp.product_id,
            grams_per_liter: rp.grams_per_liter
          })));

        if (productsError) throw productsError;

        alert('Receita atualizada com sucesso!');
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

        alert('Receita criada com sucesso!');
      }

      // Resetar formulário
      handleNewRecipe();
      loadRecipes();
    } catch (error) {
      console.error('Erro ao salvar receita:', error);
      alert('Erro ao salvar receita');
    } finally {
      setLoading(false);
    }
  };

  const handleNewRecipe = () => {
    setSelectedRecipe(null);
    setRecipeData({
      name: '',
      total_liters: 0,
      ec: 0,
      ph: 0
    });
    setRecipeProducts([]);
  };

  const handleDeleteRecipe = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta receita?')) return;

    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir receita:', error);
      alert('Erro ao excluir receita');
    } else {
      alert('Receita excluída com sucesso!');
      loadRecipes();
      if (selectedRecipe?.id === id) {
        handleNewRecipe();
      }
    }
  };

  const ppmData = calculateTotalPPM(recipeProducts.map(rp => ({
    ...rp,
    id: rp.id || '',
    recipe_id: selectedRecipe?.id || ''
  })));

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-800 dark:text-blue-400">
          {selectedRecipe ? 'Editar Receita' : 'Nova Receita'}
        </h1>
        {selectedRecipe && (
          <button
            onClick={handleNewRecipe}
            className="bg-green-600 dark:bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition"
          >
            + Nova Receita
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário Principal */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSaveRecipe} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                  onChange={(e) => setRecipeData({ ...recipeData, total_liters: parseFloat(e.target.value) || 0 })}
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
                  onChange={(e) => setRecipeData({ ...recipeData, ec: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">pH</label>
                <input
                  type="number"
                  step="0.01"
                  value={recipeData.ph}
                  onChange={(e) => setRecipeData({ ...recipeData, ph: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Adicionar Produtos */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
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
                      <option key={product.id} value={product.id}>{product.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">g/L</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.001"
                      value={gramsPerLiter}
                      onChange={(e) => setGramsPerLiter(parseFloat(e.target.value) || 0)}
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

            {/* Produtos Adicionados */}
            {recipeProducts.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">Produtos na Receita</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-blue-100 dark:bg-blue-900">
                      <tr>
                        <th className="px-4 py-2 text-left text-gray-900 dark:text-gray-100">Produto</th>
                        <th className="px-4 py-2 text-center text-gray-900 dark:text-gray-100">g/L</th>
                        <th className="px-4 py-2 text-center text-gray-900 dark:text-gray-100">Gramas Totais</th>
                        <th className="px-4 py-2 text-center text-gray-900 dark:text-gray-100">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recipeProducts.map((rp) => (
                        <tr key={rp.product_id} className="border-t border-gray-200 dark:border-gray-700">
                          <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{rp.product.name}</td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              step="0.001"
                              value={rp.grams_per_liter}
                              onChange={(e) => updateProductGramsPerLiter(rp.product_id, parseFloat(e.target.value) || 0)}
                              className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </td>
                          <td className="px-4 py-2 text-center font-medium text-gray-900 dark:text-gray-100">
                            {formatNumber(calculateTotalGrams(recipeData.total_liters, rp.grams_per_liter))}g
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeProductFromRecipe(rp.product_id)}
                              className="bg-red-500 dark:bg-red-600 text-white px-3 py-1 rounded hover:bg-red-600 dark:hover:bg-red-500 text-sm transition"
                            >
                              Remover
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tabela PPM */}
            {recipeProducts.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">Concentração por Elemento (PPM)</h3>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {Object.entries(ppmData).map(([element, value]) => (
                    <div key={element} className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-center">
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">{element}</div>
                      <div className="text-lg font-bold text-blue-700 dark:text-blue-400">{formatNumber(value)}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">ppm</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 dark:bg-blue-700 text-white py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 font-semibold transition"
            >
              {loading ? 'Salvando...' : selectedRecipe ? 'Atualizar Receita' : 'Salvar Receita'}
            </button>
          </form>
        </div>

        {/* Lista de Receitas */}
        <div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4 text-blue-800 dark:text-blue-400">Receitas Salvas</h2>
            <div className="space-y-2">
              {recipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className={`p-3 border rounded-lg cursor-pointer transition ${
                    selectedRecipe?.id === recipe.id
                      ? 'bg-blue-100 dark:bg-blue-900 border-blue-500 dark:border-blue-400'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div onClick={() => loadRecipeDetails(recipe)}>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">{recipe.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {recipe.total_liters}L | EC: {recipe.ec} | pH: {recipe.ph}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteRecipe(recipe.id)}
                    className="mt-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm"
                  >
                    Excluir
                  </button>
                </div>
              ))}
              {recipes.length === 0 && (
                <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                  Nenhuma receita criada ainda
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
