'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Product } from '@/lib/types';
import { formatCurrency, calculatePricePerWeight } from '@/lib/utils';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { useGlobalPassword } from '@/contexts/GlobalPasswordContext';

export default function ProductDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const { checkPassword } = useGlobalPassword();
  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordModal, setPasswordModal] = useState<{
    isOpen: boolean;
    action: 'edit' | 'delete';
  } | null>(null);
  const [passwordInput, setPasswordInput] = useState('');

  const loadProductDetails = useCallback(async () => {
    setLoading(true);

    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (productError) {
      console.error('Erro ao carregar produto:', productError);
      showToast('Erro ao carregar produto', 'error');
      router.push('/produtos');
      return;
    }

    setProduct(productData);
    setLoading(false);
  }, [id, showToast, router]);

  useEffect(() => {
    if (id) {
      loadProductDetails();
    }
  }, [id, loadProductDetails]);

  const handleDelete = async () => {
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
      router.push('/produtos');
    }
  };

  const handleEdit = () => {
    router.push(`/produtos/new?id=${id}`);
  };

  const requestPassword = (action: 'edit' | 'delete') => {
    if (!product?.password) {
      // Sem senha, executa ação diretamente
      if (action === 'edit') handleEdit();
      else if (action === 'delete') handleDelete();
      return;
    }

    // Verificar se senha global bate com senha do produto
    if (checkPassword(product.password)) {
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
    if (!passwordModal || !product) return;

    if (passwordInput !== product.password) {
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-xl text-gray-600 dark:text-gray-400">Carregando...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-xl text-gray-600 dark:text-gray-400">Produto não encontrado</div>
      </div>
    );
  }

  const macronutrients = [
    { key: 'n', label: 'Nitrogênio (N)', value: product.n, unit: '%' },
    { key: 'p', label: 'Fósforo (P₂O₅)', value: product.p, unit: '%' },
    { key: 'k', label: 'Potássio (K₂O)', value: product.k, unit: '%' },
    { key: 'ca', label: 'Cálcio (Ca)', value: product.ca, unit: '%' },
    { key: 'mg', label: 'Magnésio (Mg)', value: product.mg, unit: '%' },
    { key: 's', label: 'Enxofre (S)', value: product.s, unit: '%' }
  ];

  const micronutrients = [
    { key: 'b', label: 'Boro (B)', value: product.b, unit: '%' },
    { key: 'cu', label: 'Cobre (Cu)', value: product.cu, unit: '%' },
    { key: 'fe', label: 'Ferro (Fe)', value: product.fe, unit: '%' },
    { key: 'mn', label: 'Manganês (Mn)', value: product.mn, unit: '%' },
    { key: 'zn', label: 'Zinco (Zn)', value: product.zn, unit: '%' },
    { key: 'mo', label: 'Molibdênio (Mo)', value: product.mo, unit: '%' }
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <button
            onClick={() => router.push('/produtos')}
            className="text-green-600 dark:text-green-400 hover:underline mb-2 text-sm"
          >
            ← Voltar para Produtos
          </button>
          <h1 className="text-3xl font-bold text-green-800 dark:text-green-400">{product.name}</h1>
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

      {/* Informações do Produto */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Informações do Produto</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Marca</div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{product.marca}</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Sigla</div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{product.sigla}</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Peso/Volume</div>
            <div className="text-xl font-bold text-green-700 dark:text-green-400">
              {product.weight && product.weight_unit ? `${product.weight} ${product.weight_unit}` : '-'}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Preço</div>
            <div className="text-xl font-bold text-green-700 dark:text-green-400">
              {formatCurrency(product.price)}
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Preço/Peso</div>
            <div className="text-xl font-bold text-green-700 dark:text-green-400">
              {(() => {
                const pricePerWeight = calculatePricePerWeight(product.price, product.weight, product.weight_unit);
                return pricePerWeight ? pricePerWeight.formatted : '-';
              })()}
            </div>
          </div>
        </div>
        {product.product_url && (
          <div className="mt-4">
            <a
              href={product.product_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition font-semibold"
            >
              🔗 Ver no Site
            </a>
          </div>
        )}
      </div>

      {/* Imagem e Informações Básicas */}
      {product.image_url && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Imagem do Produto</h2>
          <div className="flex justify-center">
            <img
              src={product.image_url}
              alt={product.name}
              loading="lazy"
              className="max-h-64 max-w-md object-contain rounded-lg border border-gray-300 dark:border-gray-600"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        </div>
      )}

      {/* Macronutrientes */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Macronutrientes</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {macronutrients.map((nutrient) => (
            <div key={nutrient.key} className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{nutrient.label}</div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                {nutrient.value}{nutrient.unit}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Micronutrientes */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Micronutrientes</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {micronutrients.map((nutrient) => (
            <div key={nutrient.key} className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{nutrient.label}</div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                {nutrient.value}{nutrient.unit}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Senha */}
      {passwordModal?.isOpen && product && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Senha Necessária
            </h3>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Digite a senha para {passwordModal.action === 'edit' ? 'editar' : 'excluir'} o produto <strong>&quot;{product.name}&quot;</strong>
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
