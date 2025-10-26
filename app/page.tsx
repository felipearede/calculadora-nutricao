import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <h1 className="text-4xl font-bold text-green-800 dark:text-green-400">
        Sistema de Gerenciamento de Receitas de Nutrição
      </h1>
      <p className="text-xl text-gray-600 dark:text-gray-300 text-center max-w-2xl">
        Gerencie seus produtos e crie receitas personalizadas para nutrição de plantas
        com cálculo automático de PPM para cada elemento.
      </p>
      <div className="flex gap-4 mt-8">
        <Link
          href="/produtos"
          className="bg-green-600 dark:bg-green-700 text-white px-8 py-3 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition font-semibold"
        >
          Gerenciar Produtos
        </Link>
        <Link
          href="/receitas"
          className="bg-blue-600 dark:bg-blue-700 text-white px-8 py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition font-semibold"
        >
          Criar Receitas
        </Link>
      </div>
    </div>
  );
}
