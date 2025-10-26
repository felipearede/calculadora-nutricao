'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Product } from '@/lib/types';

export default function ProdutosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    n: 0, p: 0, k: 0, ca: 0, mg: 0, s: 0,
    b: 0, cu: 0, fe: 0, mn: 0, zn: 0, mo: 0
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar produtos:', error);
      alert('Erro ao carregar produtos');
    } else {
      setProducts(data || []);
    }
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
        alert('Produto atualizado com sucesso!');
      } else {
        // Criar novo produto
        const { error } = await supabase
          .from('products')
          .insert([formData]);

        if (error) throw error;
        alert('Produto cadastrado com sucesso!');
      }

      // Resetar formulário e recarregar lista
      setFormData({
        name: '',
        n: 0, p: 0, k: 0, ca: 0, mg: 0, s: 0,
        b: 0, cu: 0, fe: 0, mn: 0, zn: 0, mo: 0
      });
      setEditingId(null);
      loadProducts();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      alert('Erro ao salvar produto');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      n: product.n,
      p: product.p,
      k: product.k,
      ca: product.ca,
      mg: product.mg,
      s: product.s,
      b: product.b,
      cu: product.cu,
      fe: product.fe,
      mn: product.mn,
      zn: product.zn,
      mo: product.mo
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir produto:', error);
      alert('Erro ao excluir produto');
    } else {
      alert('Produto excluído com sucesso!');
      loadProducts();
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      name: '',
      n: 0, p: 0, k: 0, ca: 0, mg: 0, s: 0,
      b: 0, cu: 0, fe: 0, mn: 0, zn: 0, mo: 0
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-green-800 dark:text-green-400">
        {editingId ? 'Editar Produto' : 'Cadastrar Produto'}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Nome do Produto</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { key: 'n', label: 'N (%)' },
            { key: 'p', label: 'P (%)' },
            { key: 'k', label: 'K (%)' },
            { key: 'ca', label: 'Ca (%)' },
            { key: 'mg', label: 'Mg (%)' },
            { key: 's', label: 'S (%)' },
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

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 dark:bg-green-700 text-white px-6 py-2 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 disabled:bg-gray-400 transition"
          >
            {loading ? 'Salvando...' : editingId ? 'Atualizar' : 'Cadastrar'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-500 dark:bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-600 dark:hover:bg-gray-500 transition"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <h2 className="text-2xl font-bold mb-4 text-green-800 dark:text-green-400">Produtos Cadastrados</h2>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-x-auto">
        <table className="w-full">
          <thead className="bg-green-100 dark:bg-green-900">
            <tr>
              <th className="px-4 py-2 text-left text-gray-900 dark:text-gray-100">Nome</th>
              <th className="px-4 py-2 text-center text-gray-900 dark:text-gray-100">N</th>
              <th className="px-4 py-2 text-center text-gray-900 dark:text-gray-100">P</th>
              <th className="px-4 py-2 text-center text-gray-900 dark:text-gray-100">K</th>
              <th className="px-4 py-2 text-center text-gray-900 dark:text-gray-100">Ca</th>
              <th className="px-4 py-2 text-center text-gray-900 dark:text-gray-100">Mg</th>
              <th className="px-4 py-2 text-center text-gray-900 dark:text-gray-100">S</th>
              <th className="px-4 py-2 text-center text-gray-900 dark:text-gray-100">B</th>
              <th className="px-4 py-2 text-center text-gray-900 dark:text-gray-100">Cu</th>
              <th className="px-4 py-2 text-center text-gray-900 dark:text-gray-100">Fe</th>
              <th className="px-4 py-2 text-center text-gray-900 dark:text-gray-100">Mn</th>
              <th className="px-4 py-2 text-center text-gray-900 dark:text-gray-100">Zn</th>
              <th className="px-4 py-2 text-center text-gray-900 dark:text-gray-100">Mo</th>
              <th className="px-4 py-2 text-center text-gray-900 dark:text-gray-100">Ações</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-2 font-medium text-gray-900 dark:text-gray-100">{product.name}</td>
                <td className="px-4 py-2 text-center text-gray-700 dark:text-gray-300">{product.n}</td>
                <td className="px-4 py-2 text-center text-gray-700 dark:text-gray-300">{product.p}</td>
                <td className="px-4 py-2 text-center text-gray-700 dark:text-gray-300">{product.k}</td>
                <td className="px-4 py-2 text-center text-gray-700 dark:text-gray-300">{product.ca}</td>
                <td className="px-4 py-2 text-center text-gray-700 dark:text-gray-300">{product.mg}</td>
                <td className="px-4 py-2 text-center text-gray-700 dark:text-gray-300">{product.s}</td>
                <td className="px-4 py-2 text-center text-gray-700 dark:text-gray-300">{product.b}</td>
                <td className="px-4 py-2 text-center text-gray-700 dark:text-gray-300">{product.cu}</td>
                <td className="px-4 py-2 text-center text-gray-700 dark:text-gray-300">{product.fe}</td>
                <td className="px-4 py-2 text-center text-gray-700 dark:text-gray-300">{product.mn}</td>
                <td className="px-4 py-2 text-center text-gray-700 dark:text-gray-300">{product.zn}</td>
                <td className="px-4 py-2 text-center text-gray-700 dark:text-gray-300">{product.mo}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => handleEdit(product)}
                      className="bg-blue-500 dark:bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-600 dark:hover:bg-blue-500 text-sm transition"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="bg-red-500 dark:bg-red-600 text-white px-3 py-1 rounded hover:bg-red-600 dark:hover:bg-red-500 text-sm transition"
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Nenhum produto cadastrado ainda
          </div>
        )}
      </div>
    </div>
  );
}
