'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Product, Recipe, RecipeProduct } from '@/lib/types';
import { calculateTotalGrams, calculateTotalPPM, formatNumber, sortProductsByNutrients, calculatePricePerWeight, formatCurrency, getElementTolerance, formatPPM } from '@/lib/utils';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { useGlobalPassword } from '@/contexts/GlobalPasswordContext';

interface RecipeProductLocal extends RecipeProduct {
  product: Product;
}

export default function RecipeDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const { checkPassword } = useGlobalPassword();
  const id = params.id as string;

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [recipeProducts, setRecipeProducts] = useState<RecipeProductLocal[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortColumn, setSortColumn] = useState<'name' | 'marca' | 'sigla' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [passwordModal, setPasswordModal] = useState<{
    isOpen: boolean;
    action: 'edit' | 'delete';
  } | null>(null);
  const [passwordInput, setPasswordInput] = useState('');

  const loadRecipeDetails = useCallback(async () => {
    setLoading(true);

    // Carregar dados da receita
    const { data: recipeData, error: recipeError } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', id)
      .single();

    if (recipeError) {
      console.error('Erro ao carregar receita:', recipeError);
      showToast('Erro ao carregar receita', 'error');
      router.push('/receitas');
      return;
    }

    // Carregar produtos da receita
    const { data: productsData, error: productsError } = await supabase
      .from('recipe_products')
      .select('*, product:products(*)')
      .eq('recipe_id', id);

    if (productsError) {
      console.error('Erro ao carregar produtos:', productsError);
    }

    setRecipe(recipeData);
    setRecipeProducts(productsData?.map(rp => ({
      ...rp,
      product: rp.product as unknown as Product
    })) || []);
    setLoading(false);
  }, [id, showToast, router]);

  useEffect(() => {
    if (id) {
      loadRecipeDetails();
    }
  }, [id, loadRecipeDetails]);

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Excluir Receita',
      message: 'Esta ação não pode ser desfeita. Tem certeza que deseja excluir esta receita?',
      confirmText: 'Sim, excluir',
      cancelText: 'Cancelar',
      type: 'danger'
    });

    if (!confirmed) return;

    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir receita:', error);
      showToast('Erro ao excluir receita', 'error');
    } else {
      showToast('Receita excluída com sucesso!', 'success');
      router.push('/receitas');
    }
  };

  const handleEdit = () => {
    router.push(`/receitas/new?id=${id}`);
  };

  const requestPassword = (action: 'edit' | 'delete') => {
    if (!recipe?.password) {
      // Sem senha, executa ação diretamente
      if (action === 'edit') handleEdit();
      else if (action === 'delete') handleDelete();
      return;
    }

    // Verificar se senha global bate com senha da receita
    if (checkPassword(recipe.password)) {
      // Senha global bate, executa ação diretamente
      if (action === 'edit') handleEdit();
      else if (action === 'delete') handleDelete();
      return;
    }

    // Senha global não bate, mostra popup
    setPasswordModal({
      isOpen: true,
      action
    });
    setPasswordInput('');
  };

  const verifyPasswordAndExecute = () => {
    if (!passwordModal || !recipe) return;

    if (passwordInput !== recipe.password) {
      showToast('Senha incorreta!', 'error');
      return;
    }

    // Senha correta, executar ação
    if (passwordModal.action === 'edit') {
      handleEdit();
    } else if (passwordModal.action === 'delete') {
      handleDelete();
    }

    setPasswordModal(null);
    setPasswordInput('');
  };

  const handleSort = (column: 'name' | 'marca' | 'sigla') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-xl text-gray-600 dark:text-gray-400">Carregando...</div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-xl text-gray-600 dark:text-gray-400">Receita não encontrada</div>
      </div>
    );
  }

  const sortedRecipeProducts = [...recipeProducts].sort((a, b) => {
    if (!sortColumn) {
      // Ordenação padrão por macros/micros
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

  const ppmData = calculateTotalPPM(recipeProducts);

  // Calcular custo total da receita
  const calculateRecipeCost = (): number => {
    return recipeProducts.reduce((total, rp) => {
      const pricePerWeight = calculatePricePerWeight(
        rp.product.price,
        rp.product.weight,
        rp.product.weight_unit
      );

      if (!pricePerWeight) return total;

      const totalGrams = calculateTotalGrams(recipe.total_liters, rp.grams_per_liter);
      const productCost = pricePerWeight.value * totalGrams;

      return total + productCost;
    }, 0);
  };

  const recipeTotalCost = calculateRecipeCost();

  const getProductsForElement = (element: string): string[] => {
    const products: string[] = [];

    recipeProducts.forEach(rp => {
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

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <button
            onClick={() => router.push('/receitas')}
            className="text-blue-600 dark:text-blue-400 hover:underline mb-2 text-sm"
          >
            ← Voltar para Receitas
          </button>
          <h1 className="text-3xl font-bold text-blue-800 dark:text-blue-400">{recipe.name}</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => requestPassword('edit')}
            className="bg-blue-600 dark:bg-blue-700 text-white px-6 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition font-semibold"
          >
            Editar
          </button>
          <button
            onClick={() => requestPassword('delete')}
            className="bg-red-600 dark:bg-red-700 text-white px-6 py-2 rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition font-semibold"
          >
            Excluir
          </button>
        </div>
      </div>

      {/* Informações Básicas */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Informações</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total de Litros</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{recipe.total_liters}L</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">EC</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{recipe.ec}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">pH</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{recipe.ph}</div>
          </div>
          {recipe.owner && (
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Proprietário</div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{recipe.owner}</div>
            </div>
          )}
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="text-sm text-gray-600 dark:text-gray-400">Custo da Receita</div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">
              {recipeTotalCost > 0 ? formatCurrency(recipeTotalCost) : '-'}
            </div>
          </div>
        </div>
        {recipe.recipe_types && recipe.recipe_types.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Tipos de Receita</div>
            <div className="flex flex-wrap gap-2">
              {recipe.recipe_types.map((type) => {
                const typeColors: Record<string, string> = {
                  vega: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
                  flora: 'bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300',
                  clone: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300',
                  madre: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300'
                };
                return (
                  <span
                    key={type}
                    className={`text-sm px-3 py-1 rounded-full font-medium ${typeColors[type] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                  >
                    {type}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Produtos na Receita */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Produtos na Receita</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-blue-100 dark:bg-blue-900">
              <tr>
                <SortableHeader column="name" label="Produto" />
                <SortableHeader column="marca" label="Marca" />
                <SortableHeader column="sigla" label="Sigla" />
                <th className="px-4 py-2 text-center text-gray-900 dark:text-gray-100">g/L</th>
                <th className="px-4 py-2 text-center text-gray-900 dark:text-gray-100">Gramas Totais</th>
                <th className="px-4 py-2 text-center text-gray-900 dark:text-gray-100">Valor p/ Elemento</th>
              </tr>
            </thead>
            <tbody>
              {sortedRecipeProducts.map((rp) => {
                const pricePerWeight = calculatePricePerWeight(
                  rp.product.price,
                  rp.product.weight,
                  rp.product.weight_unit
                );
                const totalGrams = calculateTotalGrams(recipe.total_liters, rp.grams_per_liter);
                const productCost = pricePerWeight ? pricePerWeight.value * totalGrams : null;

                return (
                  <tr key={rp.id} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-2 font-medium text-gray-900 dark:text-gray-100">
                      {rp.product.name}
                    </td>
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                      {rp.product.marca}
                    </td>
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                      {rp.product.sigla}
                    </td>
                    <td className="px-4 py-2 text-center text-gray-900 dark:text-gray-100">
                      {rp.grams_per_liter}
                    </td>
                    <td className="px-4 py-2 text-center font-medium text-gray-900 dark:text-gray-100">
                      {formatNumber(totalGrams)}g
                    </td>
                    <td className="px-4 py-2 text-center font-medium text-green-700 dark:text-green-400">
                      {productCost !== null ? formatCurrency(productCost) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabela PPM */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Concentração por Elemento (PPM)</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {['n', 'p', 'k', 'ca', 'mg', 's', 'fe', 'b', 'mn', 'zn', 'cu', 'mo'].map((element) => {
            const value = ppmData[element as keyof typeof ppmData];
            const products = getProductsForElement(element);
            const targetKey = `target_${element}` as keyof typeof recipe;
            const targetValue = recipe[targetKey] as number | undefined;
            const diff = targetValue !== undefined ? value - targetValue : null;
            const tolerance = getElementTolerance(element);
            const isWithinTolerance = diff !== null && Math.abs(diff) <= tolerance;

            return (
              <div key={element} className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-center">
                <div className="text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">{element}</div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                  {formatPPM(value, element)} ppm
                </div>
                {targetValue !== undefined && (
                  <>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Alvo: {formatPPM(targetValue, element)} ppm
                    </div>
                    <div className={`text-sm font-semibold mt-1 ${
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
                    className="text-[10px] text-gray-700 dark:text-gray-200 mt-1 truncate leading-tight font-medium"
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

      {/* Modal de Senha */}
      {passwordModal?.isOpen && recipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Senha Necessária
            </h3>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Digite a senha para {passwordModal.action === 'edit' ? 'editar' : 'excluir'} a receita <strong>&quot;{recipe.name}&quot;</strong>
            </p>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && verifyPasswordAndExecute()}
              placeholder="Digite a senha"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={verifyPasswordAndExecute}
                className="flex-1 bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition font-semibold"
              >
                Confirmar
              </button>
              <button
                onClick={() => { setPasswordModal(null); setPasswordInput(''); }}
                className="flex-1 bg-gray-500 dark:bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-600 dark:hover:bg-gray-500 transition font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
