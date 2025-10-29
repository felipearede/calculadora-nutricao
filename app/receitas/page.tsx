'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Recipe, Product } from '@/lib/types';
import { calculateTotalGrams, calculatePricePerWeight, formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { useGlobalPassword } from '@/contexts/GlobalPasswordContext';
import MultiSelect from '@/components/MultiSelect';

interface RecipeWithProducts extends Recipe {
  recipe_products?: Array<{
    grams_per_liter: number;
    product: Product;
  }>;
}

export default function ReceitasPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const { checkPassword } = useGlobalPassword();
  const [recipes, setRecipes] = useState<RecipeWithProducts[]>([]);
  const [passwordModal, setPasswordModal] = useState<{
    isOpen: boolean;
    recipeId: string;
    action: 'edit' | 'delete';
    recipeName: string;
    actualPassword: string;
  } | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [ownerFilter, setOwnerFilter] = useState<string[]>([]);
  const [availableOwners, setAvailableOwners] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('recipes_view_mode');
      return (saved === 'list' || saved === 'cards') ? saved : 'list';
    }
    return 'list';
  });
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });

  useEffect(() => {
    loadRecipes();
  }, []);

  useEffect(() => {
    const handleClickOutside = () => {
      if (actionMenuOpen) setActionMenuOpen(null);
    };

    if (actionMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [actionMenuOpen]);

  const loadRecipes = async () => {
    const { data, error } = await supabase
      .from('recipes')
      .select(`
        *,
        recipe_products (
          grams_per_liter,
          product:products (*)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar receitas:', error);
    } else {
      const loadedRecipes = data || [];
      setRecipes(loadedRecipes);

      // Extrair owners únicos
      const owners = loadedRecipes
        .map(r => r.owner)
        .filter((o): o is string => !!o && o.trim() !== '')
        .filter((value, index, self) => self.indexOf(value) === index)
        .sort();
      setAvailableOwners(owners);

      // Extrair tipos únicos (recipe_types é um array)
      const types = loadedRecipes
        .flatMap(r => r.recipe_types || [])
        .filter((value, index, self) => self.indexOf(value) === index)
        .sort();
      setAvailableTypes(types);
    }
  };

  const handleDeleteRecipe = async (id: string) => {
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
      loadRecipes();
    }
  };

  const handleDuplicateRecipe = async (recipe: Recipe) => {
    const confirmed = await confirm({
      title: 'Duplicar Receita',
      message: `Deseja criar uma cópia da receita "${recipe.name}"? A cópia será criada sem senha de proteção.`,
      confirmText: 'Sim, duplicar',
      cancelText: 'Cancelar',
      type: 'info'
    });

    if (!confirmed) return;

    try {
      // Carregar produtos da receita original
      const { data: originalProducts, error: productsError } = await supabase
        .from('recipe_products')
        .select('product_id, grams_per_liter')
        .eq('recipe_id', recipe.id);

      if (productsError) {
        console.error('Erro ao carregar produtos:', productsError);
        showToast('Erro ao duplicar receita', 'error');
        return;
      }

      // Criar nova receita com " - copia" no nome
      const { data: newRecipe, error: recipeError} = await supabase
        .from('recipes')
        .insert([{
          name: `${recipe.name} - copia`,
          total_liters: recipe.total_liters,
          ec: recipe.ec,
          ph: recipe.ph,
          password: null,  // Receita duplicada sempre sem senha
          owner: recipe.owner,  // Copiar owner da receita original
          recipe_types: recipe.recipe_types  // Copiar tipos da receita original
        }])
        .select()
        .single();

      if (recipeError) {
        console.error('Erro ao criar receita duplicada:', recipeError);
        showToast('Erro ao duplicar receita', 'error');
        return;
      }

      // Copiar produtos para nova receita
      if (originalProducts && originalProducts.length > 0) {
        const { error: insertError } = await supabase
          .from('recipe_products')
          .insert(originalProducts.map(p => ({
            recipe_id: newRecipe.id,
            product_id: p.product_id,
            grams_per_liter: p.grams_per_liter
          })));

        if (insertError) {
          console.error('Erro ao copiar produtos:', insertError);
          showToast('Receita duplicada, mas houve erro ao copiar os produtos', 'error');
          loadRecipes();
          return;
        }
      }

      showToast('Receita duplicada com sucesso!', 'success');
      loadRecipes();
    } catch (error) {
      console.error('Erro ao duplicar receita:', error);
      showToast('Erro ao duplicar receita', 'error');
    }
  };

  const requestPassword = (recipe: RecipeWithProducts, action: 'edit' | 'delete' | 'duplicate') => {
    // Duplicar sempre executa diretamente (sem senha)
    if (action === 'duplicate') {
      handleDuplicateRecipe(recipe);
      return;
    }

    if (!recipe.password) {
      // Sem senha, executa ação diretamente
      if (action === 'edit') router.push(`/receitas/new?id=${recipe.id}`);
      else if (action === 'delete') handleDeleteRecipe(recipe.id);
      return;
    }

    // Verificar se senha global bate com senha da receita
    if (checkPassword(recipe.password)) {
      // Senha global bate, executa ação diretamente
      if (action === 'edit') router.push(`/receitas/new?id=${recipe.id}`);
      else if (action === 'delete') handleDeleteRecipe(recipe.id);
      return;
    }

    // Senha global não bate, mostra popup
    setPasswordModal({
      isOpen: true,
      recipeId: recipe.id,
      action,
      recipeName: recipe.name,
      actualPassword: recipe.password
    });
    setPasswordInput('');
  };

  const verifyPasswordAndExecute = () => {
    if (!passwordModal) return;

    if (passwordInput !== passwordModal.actualPassword) {
      showToast('Senha incorreta!', 'error');
      return;
    }

    // Senha correta, executar ação
    if (passwordModal.action === 'edit') {
      router.push(`/receitas/new?id=${passwordModal.recipeId}`);
    } else if (passwordModal.action === 'delete') {
      handleDeleteRecipe(passwordModal.recipeId);
    }

    setPasswordModal(null);
    setPasswordInput('');
  };

  const calculateMacros = (recipe: RecipeWithProducts) => {
    if (!recipe.recipe_products || recipe.recipe_products.length === 0) return null;

    const macros = { n: 0, p: 0, k: 0, ca: 0, mg: 0, s: 0 };

    recipe.recipe_products.forEach(rp => {
      const product = rp.product;
      const gpl = rp.grams_per_liter;

      macros.n += (product.n / 100) * gpl * 1000;
      macros.p += (product.p / 100) * gpl * 1000 * 0.4364; // P₂O₅ → P
      macros.k += (product.k / 100) * gpl * 1000 * 0.8302; // K₂O → K
      macros.ca += (product.ca / 100) * gpl * 1000;
      macros.mg += (product.mg / 100) * gpl * 1000;
      macros.s += (product.s / 100) * gpl * 1000;
    });

    return macros;
  };

  const calculateRecipeCost = (recipe: RecipeWithProducts): number | null => {
    if (!recipe.recipe_products || recipe.recipe_products.length === 0) return null;

    let totalCost = 0;
    let hasValidPrice = false;

    recipe.recipe_products.forEach(rp => {
      const pricePerWeight = calculatePricePerWeight(
        rp.product.price,
        rp.product.weight,
        rp.product.weight_unit
      );

      if (pricePerWeight) {
        const totalGrams = calculateTotalGrams(recipe.total_liters, rp.grams_per_liter);
        totalCost += pricePerWeight.value * totalGrams;
        hasValidPrice = true;
      }
    });

    return hasValidPrice ? totalCost : null;
  };

  const handleViewModeChange = (mode: 'cards' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('recipes_view_mode', mode);
  };

  const handleSort = (column: string) => {
    setSortConfig(prev => ({
      key: column,
      direction: prev.key === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const SortableTableHeader = ({ column, label, align = 'center' }: { column: string; label: string; align?: 'left' | 'center' }) => (
    <th
      onClick={() => handleSort(column)}
      className={`px-4 py-3 text-sm font-semibold cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800 transition select-none text-gray-900 dark:text-gray-100 ${align === 'left' ? 'text-left' : 'text-center'}`}
    >
      <div className={`flex items-center gap-1 ${align === 'left' ? 'justify-start' : 'justify-center'}`}>
        {label}
        {sortConfig.key === column && (
          <span className="text-xs">
            {sortConfig.direction === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-800 dark:text-blue-400">
          Receitas
        </h1>
        <button
          onClick={() => router.push('/receitas/new')}
          className="bg-blue-600 dark:bg-blue-700 text-white px-6 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition font-semibold flex items-center gap-2"
        >
          <span className="text-xl">+</span> Receita
        </button>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {availableTypes.length > 0 && (
          <div>
            <MultiSelect
              label="Filtrar por Tipo"
              options={availableTypes}
              selectedValues={typeFilter}
              onChange={setTypeFilter}
              placeholder="Todos os tipos"
            />
          </div>
        )}
        {availableOwners.length > 0 && (
          <div>
            <MultiSelect
              label="Filtrar por Proprietário"
              options={availableOwners}
              selectedValues={ownerFilter}
              onChange={setOwnerFilter}
              placeholder="Todos os proprietários"
            />
          </div>
        )}
      </div>

      {/* Toggle de Visualização */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => handleViewModeChange('list')}
          className={`px-4 py-2 rounded-lg transition font-medium ${
            viewMode === 'list'
              ? 'bg-blue-600 dark:bg-blue-700 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          📋 Lista
        </button>
        <button
          onClick={() => handleViewModeChange('cards')}
          className={`px-4 py-2 rounded-lg transition font-medium ${
            viewMode === 'cards'
              ? 'bg-blue-600 dark:bg-blue-700 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          🗂️ Cards
        </button>
      </div>

      {/* Lista de Receitas - Cards */}
      {viewMode === 'cards' && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recipes
          .filter(r => {
            // Filtro por tipo
            if (typeFilter.length > 0) {
              if (!r.recipe_types || r.recipe_types.length === 0) return false;
              if (!r.recipe_types.some(t => typeFilter.includes(t))) return false;
            }
            // Filtro por owner
            if (ownerFilter.length > 0) {
              if (!r.owner || !ownerFilter.includes(r.owner)) return false;
            }
            return true;
          })
          .map((recipe) => (
          <div
            key={recipe.id}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition relative"
          >
            {/* Botões de Ação - Canto Superior Direito */}
            <div className="absolute top-2 right-2 flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  requestPassword(recipe, 'duplicate');
                }}
                className="p-1.5 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded transition"
                title="Duplicar"
              >
                <span className="text-lg font-bold">+</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  requestPassword(recipe, 'edit');
                }}
                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded transition"
                title="Editar"
              >
                <span className="text-base">✏️</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  requestPassword(recipe, 'delete');
                }}
                className="p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded transition"
                title="Excluir"
              >
                <span className="text-base">🗑️</span>
              </button>
            </div>
            <div
              onClick={() => router.push(`/receitas/${recipe.id}`)}
              className="cursor-pointer mb-4"
            >
              <h3 className="font-bold text-xl text-gray-900 dark:text-gray-100 mb-2">{recipe.name}</h3>
              {recipe.owner && (
                <div className="text-sm text-blue-600 dark:text-blue-400 mb-2 font-medium">
                  {recipe.owner}
                </div>
              )}
              {recipe.recipe_types && recipe.recipe_types.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
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
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[type] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                      >
                        {type}
                      </span>
                    );
                  })}
                </div>
              )}
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <div className="flex justify-between text-xs">
                  <span>{recipe.total_liters}L</span>
                  <span>EC: {recipe.ec}</span>
                  <span>pH: {recipe.ph}</span>
                </div>

                {/* Macros PPM */}
                {(() => {
                  const macros = calculateMacros(recipe);
                  if (!macros) return null;

                  return (
                    <div className="grid grid-cols-3 gap-1 text-xs pt-1">
                      <div className="bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded text-center">
                        <span className="font-semibold">N:</span> {Math.round(macros.n)}
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded text-center">
                        <span className="font-semibold">P:</span> {Math.round(macros.p)}
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded text-center">
                        <span className="font-semibold">K:</span> {Math.round(macros.k)}
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded text-center">
                        <span className="font-semibold">Ca:</span> {Math.round(macros.ca)}
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded text-center">
                        <span className="font-semibold">Mg:</span> {Math.round(macros.mg)}
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded text-center">
                        <span className="font-semibold">S:</span> {Math.round(macros.s)}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        ))}
        {recipes.length === 0 && (
          <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-8">
            Nenhuma receita criada ainda
          </div>
        )}
      </div>
      )}

      {/* Lista de Receitas - Tabela */}
      {viewMode === 'list' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-100 dark:bg-blue-900 sticky top-0">
                <tr>
                  <SortableTableHeader column="name" label="Nome" />
                  <SortableTableHeader column="recipe_types" label="Tipos" align="left" />
                  <SortableTableHeader column="owner" label="Proprietário" />
                  <SortableTableHeader column="ec" label="EC" />
                  <SortableTableHeader column="ph" label="pH" />
                  <SortableTableHeader column="n" label="N" />
                  <SortableTableHeader column="p" label="P" />
                  <SortableTableHeader column="k" label="K" />
                  <SortableTableHeader column="ca" label="Ca" />
                  <SortableTableHeader column="mg" label="Mg" />
                  <SortableTableHeader column="s" label="S" />
                  <SortableTableHeader column="liters" label="Litros" />
                  <SortableTableHeader column="cost" label="Custo" />
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-gray-100">Ações</th>
                </tr>
              </thead>
              <tbody>
                {recipes
                  .filter(r => {
                    if (typeFilter.length > 0) {
                      if (!r.recipe_types || r.recipe_types.length === 0) return false;
                      if (!r.recipe_types.some(t => typeFilter.includes(t))) return false;
                    }
                    if (ownerFilter.length > 0) {
                      if (!r.owner || !ownerFilter.includes(r.owner)) return false;
                    }
                    return true;
                  })
                  .sort((a, b) => {
                    if (!sortConfig.key) return 0;

                    let aValue: any, bValue: any;

                    switch(sortConfig.key) {
                      case 'name':
                        aValue = a.name;
                        bValue = b.name;
                        break;
                      case 'owner':
                        aValue = a.owner || '';
                        bValue = b.owner || '';
                        break;
                      case 'ec':
                        aValue = a.ec;
                        bValue = b.ec;
                        break;
                      case 'ph':
                        aValue = a.ph;
                        bValue = b.ph;
                        break;
                      case 'liters':
                        aValue = a.total_liters;
                        bValue = b.total_liters;
                        break;
                      case 'n':
                      case 'p':
                      case 'k':
                      case 'ca':
                      case 'mg':
                      case 's':
                        const macrosA = calculateMacros(a);
                        const macrosB = calculateMacros(b);
                        aValue = macrosA?.[sortConfig.key as keyof typeof macrosA] || 0;
                        bValue = macrosB?.[sortConfig.key as keyof typeof macrosB] || 0;
                        break;
                      case 'cost':
                        aValue = calculateRecipeCost(a) || 0;
                        bValue = calculateRecipeCost(b) || 0;
                        break;
                      case 'recipe_types':
                        // Ordenar por tipos: converter array para string e comparar
                        // Receitas sem tipos vão para o final
                        aValue = (a.recipe_types && a.recipe_types.length > 0)
                          ? a.recipe_types.sort().join(', ')
                          : 'zzz';  // Coloca vazios no final
                        bValue = (b.recipe_types && b.recipe_types.length > 0)
                          ? b.recipe_types.sort().join(', ')
                          : 'zzz';
                        break;
                      default:
                        return 0;
                    }

                    if (typeof aValue === 'string' && typeof bValue === 'string') {
                      return sortConfig.direction === 'asc'
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue);
                    }

                    return sortConfig.direction === 'asc'
                      ? (aValue as number) - (bValue as number)
                      : (bValue as number) - (aValue as number);
                  })
                  .map((recipe) => {
                    const macros = calculateMacros(recipe);
                    return (
                      <tr
                        key={recipe.id}
                        onClick={() => router.push(`/receitas/${recipe.id}`)}
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-blue-600 dark:text-blue-400">
                            {recipe.name}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {recipe.recipe_types && recipe.recipe_types.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
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
                                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[type] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                                  >
                                    {type}
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {recipe.owner || '-'}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                          {recipe.ec}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                          {recipe.ph}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                          {macros ? Math.round(macros.n) : '-'}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                          {macros ? Math.round(macros.p) : '-'}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                          {macros ? Math.round(macros.k) : '-'}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                          {macros ? Math.round(macros.ca) : '-'}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                          {macros ? Math.round(macros.mg) : '-'}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                          {macros ? Math.round(macros.s) : '-'}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                          {recipe.total_liters}L
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-medium text-green-700 dark:text-green-400">
                          {(() => {
                            const cost = calculateRecipeCost(recipe);
                            return cost !== null ? formatCurrency(cost) : '-';
                          })()}
                        </td>
                        <td className="px-4 py-3 text-center relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionMenuOpen(actionMenuOpen === recipe.id ? null : recipe.id);
                            }}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition"
                          >
                            ⋮
                          </button>
                          {actionMenuOpen === recipe.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10"
                            >
                              <button
                                onClick={() => {
                                  setActionMenuOpen(null);
                                  requestPassword(recipe, 'edit');
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2"
                              >
                                ✏️ Editar
                              </button>
                              <button
                                onClick={() => {
                                  setActionMenuOpen(null);
                                  requestPassword(recipe, 'duplicate');
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2"
                              >
                                📋 Duplicar
                              </button>
                              <button
                                onClick={() => {
                                  setActionMenuOpen(null);
                                  requestPassword(recipe, 'delete');
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-red-600 dark:text-red-400 flex items-center gap-2"
                              >
                                🗑️ Excluir
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                {recipes.length === 0 && (
                  <tr>
                    <td colSpan={13} className="text-center text-gray-500 dark:text-gray-400 py-8">
                      Nenhuma receita criada ainda
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Senha */}
      {passwordModal?.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Senha Necessária
            </h3>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Digite a senha para {passwordModal.action === 'edit' ? 'editar' : 'excluir'} a receita <strong>&quot;{passwordModal.recipeName}&quot;</strong>
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
