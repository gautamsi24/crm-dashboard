/**
 * AuthContext
 *
 * Single source of auth state for the entire app.
 * Mounted once in App.tsx — available to every route including /login.
 *
 * Flow:
 *   1. On mount, restore session from sessionStorage.
 *   2. login(userId) sets the active user and persists to sessionStorage.
 *   3. logout() clears everything; callers navigate to /login.
 *   4. hasPermission() derives from ROLE_PERMISSIONS[user.role] — no API call.
 *
 * Production replacement:
 *   - Replace sessionStorage with a real token store (HttpOnly cookie / STS).
 *   - Replace MOCK_USERS lookup with a JWT decode or GET /api/auth/me.
 *   - Role comes from the verified token; never trust client-supplied roles.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ROLE_PERMISSIONS, type Permission, type Role } from '@/types/auth';
import { getUserById, type MockUser } from '@/data/mockUsers';

const SESSION_KEY = 'crm_uid';

// ── Context type ─────────────────────────────────────────────────────────────
interface AuthContextType {
  user:            MockUser | null;
  role:            Role | null;
  permissions:     Permission[];
  isAuthenticated: boolean;
  isLoading:       boolean;
  hasPermission:   (permission: Permission) => boolean;
  login:           (userId: string) => void;
  logout:          () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user,      setUser]      = useState<MockUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const savedId = sessionStorage.getItem(SESSION_KEY);
    if (savedId) {
      const found = getUserById(savedId);
      if (found) setUser(found);
    }
    setIsLoading(false);
  }, []);

  const login = (userId: string) => {
    const found = getUserById(userId);
    if (!found) return;
    sessionStorage.setItem(SESSION_KEY, userId);
    setUser(found);
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  const permissions: Permission[] = user ? ROLE_PERMISSIONS[user.role] : [];

  const hasPermission = (permission: Permission) => permissions.includes(permission);

  return (
    <AuthContext.Provider value={{
      user,
      role:            user?.role ?? null,
      permissions,
      isAuthenticated: !!user,
      isLoading,
      hasPermission,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// ── Consumer hook ─────────────────────────────────────────────────────────────
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
};
