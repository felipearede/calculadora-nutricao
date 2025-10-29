'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Recipe, Product } from '@/lib/types';

interface Stats {
  totalRecipes: number;
  totalProducts: number;
  recentRecipes: Recipe[];
  recentProducts: Product[];
  lastUpdatedRecipe: Recipe | null;
  lastAddedProduct: Product | null;
}

export default function Home() {
  const [stats, setStats] = useState<Stats>({
    totalRecipes: 0,
    totalProducts: 0,
    recentRecipes: [],
    recentProducts: [],
    lastUpdatedRecipe: null,
    lastAddedProduct: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Total de receitas
      const { count: recipesCount } = await supabase
        .from('recipes')
        .select('*', { count: 'exact', head: true });

      // Total de produtos
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      // Últimas 5 receitas
      const { data: recentRecipes } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      // Últimos 5 produtos
      const { data: recentProducts } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalRecipes: recipesCount || 0,
        totalProducts: productsCount || 0,
        recentRecipes: recentRecipes || [],
        recentProducts: recentProducts || [],
        lastUpdatedRecipe: recentRecipes?.[0] || null,
        lastAddedProduct: recentProducts?.[0] || null
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-xl text-gray-600 dark:text-gray-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-green-800 dark:text-green-400 mb-2">
          Dashboard - Sistema de Nutrição de Plantas
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Visão geral do sistema de gerenciamento de receitas
        </p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total de Receitas"
          value={stats.totalRecipes}
          icon="📋"
          color="blue"
        />
        <StatCard
          title="Total de Produtos"
          value={stats.totalProducts}
          icon="🧪"
          color="green"
        />
        <StatCard
          title="Última Receita"
          value={stats.lastUpdatedRecipe?.name || 'Nenhuma'}
          icon="⏰"
          color="purple"
          isText
        />
        <StatCard
          title="Último Produto"
          value={stats.lastAddedProduct?.name || 'Nenhum'}
          icon="🆕"
          color="orange"
          isText
        />
      </div>

      {/* Atalhos Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <QuickAction
          title="Gerenciar Receitas"
          description="Criar, editar e visualizar suas receitas de nutrição"
          href="/receitas"
          color="blue"
          icon="📋"
        />
        <QuickAction
          title="Gerenciar Produtos"
          description="Adicionar e organizar seus produtos fertilizantes"
          href="/produtos"
          color="green"
          icon="🧪"
        />
      </div>

      {/* Seção de Receitas e Produtos Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentRecipes recipes={stats.recentRecipes} />
        <RecentProducts products={stats.recentProducts} />
      </div>
    </div>
  );
}

// Componente de Card de Estatística
function StatCard({
  title,
  value,
  icon,
  color,
  isText = false
}: {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  isText?: boolean;
}) {
  const colorClasses = {
    blue: 'border-blue-500 dark:border-blue-400',
    green: 'border-green-500 dark:border-green-400',
    purple: 'border-purple-500 dark:border-purple-400',
    orange: 'border-orange-500 dark:border-orange-400'
  };

  return (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className={`${isText ? 'text-lg' : 'text-3xl'} font-bold text-gray-900 dark:text-gray-100 ${isText ? 'truncate' : ''}`}>
            {value}
          </p>
        </div>
        <div className="text-4xl ml-4">{icon}</div>
      </div>
    </div>
  );
}

// Componente de Atalho Rápido
function QuickAction({
  title,
  description,
  href,
  color,
  icon
}: {
  title: string;
  description: string;
  href: string;
  color: string;
  icon: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600',
    green: 'bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600'
  };

  return (
    <Link href={href}>
      <div className={`${colorClasses[color as keyof typeof colorClasses]} text-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 cursor-pointer`}>
        <div className="flex items-center gap-4 mb-3">
          <span className="text-4xl">{icon}</span>
          <h3 className="text-2xl font-bold">{title}</h3>
        </div>
        <p className="text-blue-100 dark:text-green-100">{description}</p>
      </div>
    </Link>
  );
}

// Componente de Receitas Recentes
function RecentRecipes({ recipes }: { recipes: Recipe[] }) {
  if (recipes.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Receitas Recentes</h2>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          Nenhuma receita cadastrada ainda
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Receitas Recentes</h2>
        <Link href="/receitas" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          Ver todas →
        </Link>
      </div>
      <div className="space-y-3">
        {recipes.map(recipe => (
          <Link href={`/receitas/${recipe.id}`} key={recipe.id}>
            <div className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition cursor-pointer border border-transparent hover:border-blue-300 dark:hover:border-blue-600">
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-gray-100">{recipe.name}</p>
                {recipe.owner && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                    {recipe.owner}
                  </p>
                )}
                {recipe.recipe_types && recipe.recipe_types.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
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
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${typeColors[type] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                        >
                          {type}
                        </span>
                      );
                    })}
                  </div>
                )}
                <div className="flex gap-3 mt-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {recipe.total_liters}L
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    EC: {recipe.ec}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    pH: {recipe.ph}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 ml-4">
                {new Date(recipe.created_at || '').toLocaleDateString('pt-BR')}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Componente de Produtos Recentes
function RecentProducts({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Produtos Recentes</h2>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          Nenhum produto cadastrado ainda
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Produtos Recentes</h2>
        <Link href="/produtos" className="text-sm text-green-600 dark:text-green-400 hover:underline">
          Ver todos →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {products.map(product => (
          <Link href={`/produtos/${product.id}`} key={product.id}>
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-500 dark:hover:border-green-400 transition cursor-pointer hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">{product.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {product.marca} - {product.sigla}
                  </p>
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500">
                  {new Date(product.created_at || '').toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
