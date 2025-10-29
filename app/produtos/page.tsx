'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Product } from '@/lib/types';
import { sortProductsByNutrients, formatCurrency, calculatePricePerWeight } from '@/lib/utils';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { useGlobalPassword } from '@/contexts/GlobalPasswordContext';

function ProdutosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const { checkPassword } = useGlobalPassword();
  const [products, setProducts] = useState<Product[]>([]);
  const [sortColumn, setSortColumn] = useState<keyof Product | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; productId: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('products_view_mode');
      return (saved === 'list' || saved === 'cards') ? saved : 'list';
    }
    return 'list';
  });
  const [passwordModal, setPasswordModal] = useState<{
    isOpen: boolean;
    productId: string;
    action: 'edit' | 'delete';
    productName: string;
    actualPassword: string;
  } | null>(null);
  const [passwordInput, setPasswordInput] = useState('');

  const loadProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*');

    if (error) {
      console.error('Erro ao carregar produtos:', error);
      showToast('Erro ao carregar produtos', 'error');
    } else {
      // Aplicar ordenação padrão por sigla customizada
      const sortedProducts = sortProductsByNutrients(data || []);
      setProducts(sortedProducts);
    }
  }, [showToast]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Fecha menu contextual ao clicar fora
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu) setContextMenu(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu]);


  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Excluir Produto',
      message: 'Esta ação não pode ser desfeita. Tem certeza que deseja excluir este produto?',
      confirmText: 'Sim, excluir',
      cancelText: 'Cancelar',
      type: 'danger'
    });

    if (!confirmed) return;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir produto:', error);
      showToast('Erro ao excluir produto', 'error');
    } else {
      showToast('Produto excluído com sucesso!', 'success');
      loadProducts();
    }
  };

  const requestPassword = (product: Product, action: 'edit' | 'delete' | 'view') => {
    // Ver detalhes não precisa de senha
    if (action === 'view') {
      router.push(`/produtos/${product.id}`);
      return;
    }

    if (!product.password) {
      // Sem senha, executa ação diretamente
      if (action === 'edit') router.push(`/produtos/new?id=${product.id}`);
      else if (action === 'delete') handleDelete(product.id);
      return;
    }

    // Verificar se senha global bate com senha do produto
    if (checkPassword(product.password)) {
      // Senha global bate, executa ação diretamente
      if (action === 'edit') router.push(`/produtos/new?id=${product.id}`);
      else if (action === 'delete') handleDelete(product.id);
      return;
    }

    // Senha global não bate, mostra popup
    setPasswordModal({
      isOpen: true,
      productId: product.id,
      action,
      productName: product.name,
      actualPassword: product.password
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
      router.push(`/produtos/new?id=${passwordModal.productId}`);
    } else if (passwordModal.action === 'delete') {
      handleDelete(passwordModal.productId);
    }

    setPasswordModal(null);
    setPasswordInput('');
  };

  const handleViewModeChange = (mode: 'cards' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('products_view_mode', mode);
  };

  const handleSort = (column: keyof Product) => {
    if (sortColumn === column) {
      // Inverte a direção se já estiver ordenando por esta coluna
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Nova coluna, começa com decrescente (maior para menor)
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const handleRowClick = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      productId: product.id
    });
  };

  // Filtra e ordena os produtos
  const filteredProducts = products.filter(p => {
    if (searchQuery === '') return true;
    const query = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(query) ||
      p.marca.toLowerCase().includes(query) ||
      p.sigla.toLowerCase().includes(query)
    );
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (!sortColumn) {
      // Ordenação padrão por sigla customizada
      const sorted = sortProductsByNutrients([a, b]);
      return sorted.findIndex(p => p.id === a.id) - sorted.findIndex(p => p.id === b.id);
    }

    const aValue = a[sortColumn];
    const bValue = b[sortColumn];

    if (aValue === undefined || bValue === undefined) return 0;

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc'
        ? aValue - bValue
        : bValue - aValue;
    }

    return 0;
  });

  // Componente para header ordenável
  const SortableHeader = ({ column, label }: { column: keyof Product; label: string }) => (
    <th
      className="px-2 py-1.5 text-center text-xs text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-green-200 dark:hover:bg-green-800 select-none transition"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center justify-center gap-0.5">
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
        <h1 className="text-3xl font-bold text-green-800 dark:text-green-400">
          Produtos
        </h1>
        <button
          onClick={() => router.push('/produtos/new')}
          className="bg-green-600 dark:bg-green-700 text-white px-6 py-2 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition font-semibold flex items-center gap-2"
        >
          <span className="text-xl">+</span> Produto
        </button>
      </div>

      {/* Filtro de Busca */}
      <div className="mb-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, marca ou sigla..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Toggle de Visualização */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => handleViewModeChange('list')}
          className={`px-4 py-2 rounded-lg transition font-medium ${
            viewMode === 'list'
              ? 'bg-green-600 dark:bg-green-700 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          📋 Lista
        </button>
        <button
          onClick={() => handleViewModeChange('cards')}
          className={`px-4 py-2 rounded-lg transition font-medium ${
            viewMode === 'cards'
              ? 'bg-green-600 dark:bg-green-700 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          🗂️ Cards
        </button>
      </div>

      {/* Lista de Produtos - Cards */}
      {viewMode === 'cards' && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedProducts.map((product) => (
          <div
            key={product.id}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition relative"
          >
            {/* Botões de Ação - Canto Superior Direito */}
            <div className="absolute top-2 right-2 flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  requestPassword(product, 'view');
                }}
                className="p-1.5 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded transition"
                title="Ver Detalhes"
              >
                <span className="text-base">👁️</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  requestPassword(product, 'edit');
                }}
                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded transition"
                title="Editar"
              >
                <span className="text-base">✏️</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  requestPassword(product, 'delete');
                }}
                className="p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded transition"
                title="Excluir"
              >
                <span className="text-base">🗑️</span>
              </button>
            </div>

            <div
              onClick={() => router.push(`/produtos/${product.id}`)}
              className="cursor-pointer"
            >
              {/* Imagem */}
              {product.image_url && (
                <div className="mb-3 flex justify-center">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    loading="lazy"
                    className="h-20 w-20 object-cover rounded border border-gray-300 dark:border-gray-600"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Nome */}
              <h3 className="font-bold text-xl text-gray-900 dark:text-gray-100 mb-2">{product.name}</h3>

              {/* Marca e Sigla */}
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                <span className="font-medium">{product.marca}</span> • <span className="font-medium">{product.sigla}</span>
              </div>

              {/* Peso, Preço e Preço/Peso */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded text-center">
                  <div className="text-xs text-gray-600 dark:text-gray-400">Peso/Volume</div>
                  <div className="text-sm font-bold text-green-700 dark:text-green-400">
                    {product.weight && product.weight_unit ? `${product.weight} ${product.weight_unit}` : '-'}
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded text-center">
                  <div className="text-xs text-gray-600 dark:text-gray-400">Preço</div>
                  <div className="text-sm font-bold text-green-700 dark:text-green-400">
                    {formatCurrency(product.price)}
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded text-center border border-green-200 dark:border-green-800">
                  <div className="text-xs text-gray-600 dark:text-gray-400">Preço/Peso</div>
                  <div className="text-sm font-bold text-green-700 dark:text-green-400">
                    {(() => {
                      const pricePerWeight = calculatePricePerWeight(product.price, product.weight, product.weight_unit);
                      return pricePerWeight ? pricePerWeight.formatted : '-';
                    })()}
                  </div>
                </div>
              </div>

              {/* Link do Site */}
              {product.product_url && (
                <div className="mb-3">
                  <a
                    href={product.product_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
                  >
                    🔗 Ver no Site
                  </a>
                </div>
              )}

              {/* Macronutrientes */}
              <div className="mb-2">
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Macronutrientes</div>
                <div className="grid grid-cols-3 gap-1 text-xs">
                  <div className="bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded text-center">
                    <span className="font-semibold">N:</span> {product.n}
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded text-center">
                    <span className="font-semibold">P:</span> {product.p}
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded text-center">
                    <span className="font-semibold">K:</span> {product.k}
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded text-center">
                    <span className="font-semibold">Ca:</span> {product.ca}
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded text-center">
                    <span className="font-semibold">Mg:</span> {product.mg}
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded text-center">
                    <span className="font-semibold">S:</span> {product.s}
                  </div>
                </div>
              </div>

              {/* Micronutrientes */}
              <div>
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Micronutrientes</div>
                <div className="grid grid-cols-3 gap-1 text-xs">
                  <div className="bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded text-center">
                    <span className="font-semibold">B:</span> {product.b}
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded text-center">
                    <span className="font-semibold">Cu:</span> {product.cu}
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded text-center">
                    <span className="font-semibold">Fe:</span> {product.fe}
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded text-center">
                    <span className="font-semibold">Mn:</span> {product.mn}
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded text-center">
                    <span className="font-semibold">Zn:</span> {product.zn}
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded text-center">
                    <span className="font-semibold">Mo:</span> {product.mo}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        {sortedProducts.length === 0 && (
          <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-8">
            Nenhum produto encontrado
          </div>
        )}
      </div>
      )}

      {/* Lista de Produtos - Tabela */}
      {viewMode === 'list' && (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-x-auto">
        <table className="w-full">
          <thead className="bg-green-100 dark:bg-green-900">
            <tr>
              <th className="px-2 py-1.5 text-center text-xs text-gray-900 dark:text-gray-100">Img</th>
              <SortableHeader column="name" label="Nome" />
              <SortableHeader column="marca" label="Marca" />
              <SortableHeader column="sigla" label="Sigla" />
              <SortableHeader column="weight" label="Peso" />
              <SortableHeader column="price" label="Preço" />
              <th className="px-2 py-1.5 text-center text-xs text-gray-900 dark:text-gray-100">Preço/Peso</th>
              <SortableHeader column="n" label="N" />
              <SortableHeader column="p" label="P₂O₅" />
              <SortableHeader column="k" label="K₂O" />
              <SortableHeader column="ca" label="Ca" />
              <SortableHeader column="mg" label="Mg" />
              <SortableHeader column="s" label="S" />
              <SortableHeader column="b" label="B" />
              <SortableHeader column="cu" label="Cu" />
              <SortableHeader column="fe" label="Fe" />
              <SortableHeader column="mn" label="Mn" />
              <SortableHeader column="zn" label="Zn" />
              <SortableHeader column="mo" label="Mo" />
            </tr>
          </thead>
          <tbody>
            {sortedProducts.map((product) => (
              <tr
                key={product.id}
                onClick={(e) => handleRowClick(e, product)}
                className="border-b-2 border-gray-300 dark:border-gray-600 hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer transition"
              >
                <td className="px-2 py-1.5 text-center">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      loading="lazy"
                      className="h-10 w-10 object-cover rounded mx-auto"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded mx-auto flex items-center justify-center">
                      <span className="text-gray-400 dark:text-gray-500 text-xs">-</span>
                    </div>
                  )}
                </td>
                <td className="px-2 py-1.5 text-sm font-medium text-gray-900 dark:text-gray-100">{product.name}</td>
                <td className="px-2 py-1.5 text-center text-sm text-gray-700 dark:text-gray-300">{product.marca}</td>
                <td className="px-2 py-1.5 text-center text-sm text-gray-700 dark:text-gray-300">{product.sigla}</td>
                <td className="px-2 py-1.5 text-center text-sm text-gray-700 dark:text-gray-300">
                  {product.weight && product.weight_unit ? `${product.weight} ${product.weight_unit}` : '-'}
                </td>
                <td className="px-2 py-1.5 text-center text-sm text-gray-700 dark:text-gray-300">
                  {formatCurrency(product.price)}
                </td>
                <td className="px-2 py-1.5 text-center text-sm font-semibold text-green-700 dark:text-green-400">
                  {(() => {
                    const pricePerWeight = calculatePricePerWeight(product.price, product.weight, product.weight_unit);
                    return pricePerWeight ? pricePerWeight.formatted : '-';
                  })()}
                </td>
                <td className="px-2 py-1.5 text-center text-sm text-gray-700 dark:text-gray-300">{product.n}</td>
                <td className="px-2 py-1.5 text-center text-sm text-gray-700 dark:text-gray-300">{product.p}</td>
                <td className="px-2 py-1.5 text-center text-sm text-gray-700 dark:text-gray-300">{product.k}</td>
                <td className="px-2 py-1.5 text-center text-sm text-gray-700 dark:text-gray-300">{product.ca}</td>
                <td className="px-2 py-1.5 text-center text-sm text-gray-700 dark:text-gray-300">{product.mg}</td>
                <td className="px-2 py-1.5 text-center text-sm text-gray-700 dark:text-gray-300">{product.s}</td>
                <td className="px-2 py-1.5 text-center text-sm text-gray-700 dark:text-gray-300">{product.b}</td>
                <td className="px-2 py-1.5 text-center text-sm text-gray-700 dark:text-gray-300">{product.cu}</td>
                <td className="px-2 py-1.5 text-center text-sm text-gray-700 dark:text-gray-300">{product.fe}</td>
                <td className="px-2 py-1.5 text-center text-sm text-gray-700 dark:text-gray-300">{product.mn}</td>
                <td className="px-2 py-1.5 text-center text-sm text-gray-700 dark:text-gray-300">{product.zn}</td>
                <td className="px-2 py-1.5 text-center text-sm text-gray-700 dark:text-gray-300">{product.mo}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sortedProducts.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Nenhum produto encontrado
          </div>
        )}
      </div>
      )}

      {/* Menu Contextual */}
      {contextMenu && (
        <div
          className="fixed bg-white dark:bg-gray-700 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 z-50 min-w-[160px]"
          style={{
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              const product = products.find(p => p.id === contextMenu.productId);
              if (product) {
                requestPassword(product, 'view');
                setContextMenu(null);
              }
            }}
            className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-t-lg transition flex items-center gap-2"
          >
            <span>👁️</span> Ver Detalhes
          </button>
          <button
            onClick={() => {
              const product = products.find(p => p.id === contextMenu.productId);
              if (product) {
                requestPassword(product, 'edit');
                setContextMenu(null);
              }
            }}
            className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition flex items-center gap-2"
          >
            <span>✏️</span> Editar
          </button>
          <button
            onClick={() => {
              const product = products.find(p => p.id === contextMenu.productId);
              if (product) {
                requestPassword(product, 'delete');
                setContextMenu(null);
              }
            }}
            className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-b-lg transition flex items-center gap-2"
          >
            <span>🗑️</span> Excluir
          </button>
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
              Digite a senha para {passwordModal.action === 'edit' ? 'editar' : 'excluir'} o produto <strong>&quot;{passwordModal.productName}&quot;</strong>
            </p>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && verifyPasswordAndExecute()}
              placeholder="Digite a senha"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={verifyPasswordAndExecute}
                className="flex-1 bg-green-600 dark:bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition font-semibold"
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

export default function ProdutosPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-xl text-gray-600 dark:text-gray-400">Carregando...</div>
      </div>
    }>
      <ProdutosContent />
    </Suspense>
  );
}
