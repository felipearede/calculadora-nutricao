'use client';

import { useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import GlobalPasswordModal from "./GlobalPasswordModal";
import { useGlobalPassword } from "@/contexts/GlobalPasswordContext";

export function Navbar() {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const { hasPassword } = useGlobalPassword();

  return (
    <>
      <nav className="bg-green-700 dark:bg-green-900 text-white p-4 shadow-lg transition-colors">
        <div className="container mx-auto flex gap-4 items-center">
          <h1 className="text-2xl font-bold">Nutrição de Plantas</h1>
          <div className="flex gap-4 ml-auto items-center">
            <Link href="/" className="hover:underline">Home</Link>
            <Link href="/receitas" className="hover:underline">Receitas</Link>
            <Link href="/produtos" className="hover:underline">Produtos</Link>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="relative p-2 hover:bg-green-600 dark:hover:bg-green-800 rounded-lg transition"
              title="Gerenciar senha global"
            >
              <span className="text-xl">🔒</span>
              {hasPassword && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-green-400 rounded-full border border-white"></span>
              )}
            </button>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <GlobalPasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </>
  );
}
