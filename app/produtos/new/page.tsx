'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Product } from '@/lib/types';
import { useToast } from '@/components/Toast';
import { calculatePricePerWeight } from '@/lib/utils';

function NewProductContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    marca: '',
    sigla: '',
    image_url: '',
    product_url: '',
    password: '',
    weight: 0,
    weight_unit: 'kg' as 'kg' | 'g' | 'mg' | 'L' | 'ml',
    price: 0,
    n: 0, p: 0, k: 0, ca: 0, mg: 0, s: 0,
    b: 0, cu: 0, fe: 0, mn: 0, zn: 0, mo: 0
  });

  // Carregar produto se estiver editando
  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      loadProduct(id);
    }
  }, [searchParams]);

  const loadProduct = async (id: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao carregar produto:', error);
      showToast('Erro ao carregar produto', 'error');
      router.push('/produtos');
      return;
    }

    setEditingId(id);
    setFormData({
      name: data.name,
      marca: data.marca,
      sigla: data.sigla,
      image_url: data.image_url || '',
      product_url: data.product_url || '',
      password: data.password || '',
      weight: data.weight || 0,
      weight_unit: data.weight_unit || 'kg',
      price: data.price || 0,
      n: data.n, p: data.p, k: data.k, ca: data.ca, mg: data.mg, s: data.s,
      b: data.b, cu: data.cu, fe: data.fe, mn: data.mn, zn: data.zn, mo: data.mo
    });
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        // Atualizar produto existente
        const { error } = await supabase
          .from('products')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;
        showToast('Produto atualizado com sucesso!', 'success');
      } else {
        // Criar novo produto
        const { error } = await supabase
          .from('products')
          .insert([formData]);

        if (error) throw error;
        showToast('Produto cadastrado com sucesso!', 'success');
      }

      router.push('/produtos');
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      showToast('Erro ao salvar produto', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/produtos');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={handleCancel}
          className="text-green-600 dark:text-green-400 hover:underline mb-2 text-sm"
        >
          ← Voltar para Produtos
        </button>
        <h1 className="text-3xl font-bold text-green-800 dark:text-green-400">
          {editingId ? 'Editar Produto' : 'Novo Produto'}
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Nome do Produto</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Marca</label>
              <input
                type="text"
                value={formData.marca}
                onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Sigla</label>
              <input
                type="text"
                value={formData.sigla}
                onChange={(e) => setFormData({ ...formData, sigla: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Peso/Volume</label>
              <input
                type="number"
                step="0.01"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Unidade</label>
              <select
                value={formData.weight_unit}
                onChange={(e) => setFormData({ ...formData, weight_unit: e.target.value as 'kg' | 'g' | 'mg' | 'L' | 'ml' })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="mg">mg</option>
                <option value="L">L</option>
                <option value="ml">ml</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Preço (R$)</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Preço/Peso Calculado */}
          {(() => {
            const pricePerWeight = calculatePricePerWeight(formData.price, formData.weight, formData.weight_unit);
            if (pricePerWeight) {
              return (
                <div className="mb-6 bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
                    Preço/Peso
                  </label>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                    {pricePerWeight.formatted}
                  </div>
                </div>
              );
            }
            return null;
          })()}

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">URL da Imagem</label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="https://exemplo.com/imagem.jpg"
            />
            {formData.image_url && (
              <div className="mt-2">
                <img
                  src={formData.image_url}
                  alt="Preview"
                  loading="lazy"
                  className="h-20 w-20 object-cover rounded border border-gray-300 dark:border-gray-600"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Link do Site (opcional)</label>
            <input
              type="url"
              value={formData.product_url}
              onChange={(e) => setFormData({ ...formData, product_url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="https://loja.com/produto"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              URL do site onde o produto é vendido
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Senha de Proteção (opcional)
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Digite uma senha para proteger este produto"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Se definida, será necessário digitar esta senha para editar ou excluir o produto
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">Macronutrientes</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { key: 'n', label: 'N (%)' },
                { key: 'p', label: 'P₂O₅ (%)' },
                { key: 'k', label: 'K₂O (%)' },
                { key: 'ca', label: 'Ca (%)' },
                { key: 'mg', label: 'Mg (%)' },
                { key: 's', label: 'S (%)' }
              ].map((element) => (
                <div key={element.key}>
                  <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">{element.label}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData[element.key as keyof typeof formData]}
                    onChange={(e) => setFormData({
                      ...formData,
                      [element.key]: parseFloat(e.target.value) || 0
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">Micronutrientes</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { key: 'b', label: 'B (%)' },
                { key: 'cu', label: 'Cu (%)' },
                { key: 'fe', label: 'Fe (%)' },
                { key: 'mn', label: 'Mn (%)' },
                { key: 'zn', label: 'Zn (%)' },
                { key: 'mo', label: 'Mo (%)' }
              ].map((element) => (
                <div key={element.key}>
                  <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">{element.label}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData[element.key as keyof typeof formData]}
                    onChange={(e) => setFormData({
                      ...formData,
                      [element.key]: parseFloat(e.target.value) || 0
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 dark:bg-green-700 text-white px-6 py-2 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 disabled:bg-gray-400 transition font-semibold"
            >
              {loading ? 'Salvando...' : editingId ? 'Atualizar' : 'Cadastrar'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-500 dark:bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-600 dark:hover:bg-gray-500 transition font-semibold"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewProductPage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-xl text-gray-600 dark:text-gray-400">Carregando...</div>
      </div>
    }>
      <NewProductContent />
    </Suspense>
  );
}
