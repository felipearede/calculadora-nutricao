'use client';

import { useState, useEffect } from 'react';
import { useGlobalPassword } from '@/contexts/GlobalPasswordContext';
import { useToast } from '@/components/Toast';

interface GlobalPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalPasswordModal({ isOpen, onClose }: GlobalPasswordModalProps) {
  const { hasPassword, savePassword, getPassword, clearPassword, getExpirationDate } = useGlobalPassword();
  const { showToast } = useToast();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Carregar senha atual se existir
      const currentPassword = getPassword();
      setPassword(currentPassword || '');
      setShowPassword(false);
    }
  }, [isOpen, getPassword]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!password.trim()) {
      showToast('Digite uma senha para salvar', 'error');
      return;
    }

    savePassword(password);
    showToast('Senha salva por 7 dias!', 'success');
    onClose();
  };

  const handleClear = () => {
    clearPassword();
    setPassword('');
    showToast('Senha removida', 'success');
  };

  const expirationDate = getExpirationDate();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            🔒 Gerenciar Senha Global
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Status */}
        <div className="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          {hasPassword ? (
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                ✓ Senha salva ativa
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Expira em: {expirationDate?.toLocaleString('pt-BR')}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Nenhuma senha salva no momento
            </p>
          )}
        </div>

        {/* Info */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Salve sua senha para evitar digitá-la toda vez ao editar/excluir receitas e produtos protegidos.
          A senha ficará salva apenas neste navegador por 7 dias.
        </p>

        {/* Input de Senha */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
            Sua Senha
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        {/* Botões */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleSave}
            className="w-full bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition font-semibold"
          >
            💾 Salvar Senha
          </button>

          {hasPassword && (
            <button
              onClick={handleClear}
              className="w-full bg-red-600 dark:bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition font-semibold"
            >
              🗑️ Limpar Senha
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full bg-gray-500 dark:bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-600 dark:hover:bg-gray-500 transition font-semibold"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
