'use client';

import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

export function Navbar() {
  return (
    <nav className="bg-green-700 dark:bg-green-900 text-white p-4 shadow-lg transition-colors">
      <div className="container mx-auto flex gap-4 items-center">
        <h1 className="text-2xl font-bold">Nutrição de Plantas</h1>
        <div className="flex gap-4 ml-auto items-center">
          <Link href="/" className="hover:underline">Home</Link>
          <Link href="/produtos" className="hover:underline">Produtos</Link>
          <Link href="/receitas" className="hover:underline">Receitas</Link>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
