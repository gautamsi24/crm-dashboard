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

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { ROLE_PERMISSIONS, type Permission, type Role } from '@/types/auth';
import { getUserById, type MockUser } from '@/data/mockUsers';

const SESSION_KEY = 'crm_uid';

// Stable module-level reference for the unauthenticated case.
// Avoids a separate useMemo on permissions while still giving value's
// useMemo a reference that is === equal between renders when user is null.
const EMPTY_PERMISSIONS: Permission[] = [];

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

  // Stable references — empty deps because they only close over setUser and
  // module-level constants, both of which never change.
  const login = useCallback((userId: string) => {
    const found = getUserById(userId);
    if (!found) return;
    sessionStorage.setItem(SESSION_KEY, userId);
    setUser(found);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  // permissions and hasPermission are derived entirely from user, so they live
  // inside the value memo rather than as separate memoized values.
  // ROLE_PERMISSIONS entries and EMPTY_PERMISSIONS are module-level constants,
  // so the permissions reference is always stable between renders for the same user.
  const value = useMemo<AuthContextType>(() => {
    const permissions = user ? ROLE_PERMISSIONS[user.role] : EMPTY_PERMISSIONS;
    return {
      user,
      role:            user?.role ?? null,
      permissions,
      isAuthenticated: !!user,
      isLoading,
      hasPermission:   (permission: Permission) => permissions.includes(permission),
      login,
      logout,
    };
  }, [user, isLoading, login, logout]);

  return (
    <AuthContext.Provider value={value}>
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
