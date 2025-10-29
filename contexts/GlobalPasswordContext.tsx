'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface PasswordData {
  password: string;
  expiresAt: number;
}

interface GlobalPasswordContextType {
  hasPassword: boolean;
  savePassword: (password: string) => void;
  getPassword: () => string | null;
  clearPassword: () => void;
  checkPassword: (itemPassword: string | undefined) => boolean;
  getExpirationDate: () => Date | null;
}

const GlobalPasswordContext = createContext<GlobalPasswordContextType | undefined>(undefined);

const STORAGE_KEY = 'global_password_cache';
const EXPIRATION_DAYS = 7;

export function GlobalPasswordProvider({ children }: { children: ReactNode }) {
  const [hasPassword, setHasPassword] = useState(false);

  useEffect(() => {
    // Verificar se há senha válida ao carregar
    checkPasswordValidity();
  }, []);

  const checkPasswordValidity = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setHasPassword(false);
        return;
      }

      const data: PasswordData = JSON.parse(stored);
      const now = Date.now();

      if (now > data.expiresAt) {
        // Senha expirou
        localStorage.removeItem(STORAGE_KEY);
        setHasPassword(false);
      } else {
        setHasPassword(true);
      }
    } catch (error) {
      console.error('Erro ao verificar senha salva:', error);
      localStorage.removeItem(STORAGE_KEY);
      setHasPassword(false);
    }
  };

  const savePassword = (password: string) => {
    const expiresAt = Date.now() + (EXPIRATION_DAYS * 24 * 60 * 60 * 1000);
    const data: PasswordData = {
      password,
      expiresAt
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setHasPassword(true);
  };

  const getPassword = (): string | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const data: PasswordData = JSON.parse(stored);
      const now = Date.now();

      if (now > data.expiresAt) {
        localStorage.removeItem(STORAGE_KEY);
        setHasPassword(false);
        return null;
      }

      return data.password;
    } catch (error) {
      console.error('Erro ao obter senha:', error);
      return null;
    }
  };

  const clearPassword = () => {
    localStorage.removeItem(STORAGE_KEY);
    setHasPassword(false);
  };

  const checkPassword = (itemPassword: string | undefined): boolean => {
    // Se item não tem senha, não precisa verificar
    if (!itemPassword) return true;

    const savedPassword = getPassword();
    if (!savedPassword) return false;

    return savedPassword === itemPassword;
  };

  const getExpirationDate = (): Date | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const data: PasswordData = JSON.parse(stored);
      return new Date(data.expiresAt);
    } catch (error) {
      return null;
    }
  };

  return (
    <GlobalPasswordContext.Provider
      value={{
        hasPassword,
        savePassword,
        getPassword,
        clearPassword,
        checkPassword,
        getExpirationDate
      }}
    >
      {children}
    </GlobalPasswordContext.Provider>
  );
}

export function useGlobalPassword() {
  const context = useContext(GlobalPasswordContext);
  if (!context) {
    throw new Error('useGlobalPassword must be used within GlobalPasswordProvider');
  }
  return context;
}
