/**
 * AuthContext
 *
 * Single source of auth state for the entire app.
 * Mounted once in App.tsx — available to every route including /login.
 *
 * Flow:
 *   1. On mount, restore session from sessionStorage (validates expiry).
 *   2. login(userId) sets the active user and writes a timestamped session.
 *   3. logout() clears everything; callers navigate to /login.
 *   4. hasPermission() and permissionSet derive from ROLE_PERMISSIONS[user.role].
 *
 * Session format:
 *   sessionStorage stores { userId, expiresAt } as JSON.
 *   Plain user-ID strings (old format) are rejected on restore, forcing re-login.
 *   Sessions expire after SESSION_TTL_MS (8 hours) even within the same tab.
 *
 * Production replacement:
 *   - Replace sessionStorage with a real token store (HttpOnly cookie / STS).
 *   - Replace MOCK_USERS lookup with a JWT decode or GET /api/auth/me.
 *   - Role comes from the verified token; never trust client-supplied roles.
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { ROLE_PERMISSIONS, type Permission, type Role } from '@/types/auth';
import { getUserById, type MockUser } from '@/data/mockUsers';

const SESSION_KEY     = 'crm_uid';
const SESSION_TTL_MS  = 8 * 60 * 60 * 1000; // 8 hours

interface SessionData {
  userId:    string;
  expiresAt: number; // Unix timestamp (ms)
}

function readSession(): string | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SessionData;
    if (typeof data.userId !== 'string' || typeof data.expiresAt !== 'number') {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    if (Date.now() > data.expiresAt) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return data.userId;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function writeSession(userId: string): void {
  const data: SessionData = { userId, expiresAt: Date.now() + SESSION_TTL_MS };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

// Stable module-level reference for the unauthenticated case.
const EMPTY_PERMISSIONS: Permission[]           = [];
const EMPTY_PERMISSION_SET: ReadonlySet<Permission> = new Set();

// ── Context type ─────────────────────────────────────────────────────────────
interface AuthContextType {
  user:            MockUser | null;
  role:            Role | null;
  permissions:     Permission[];
  /** O(1) permission lookup — prefer this over iterating permissions array. */
  permissionSet:   ReadonlySet<Permission>;
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

  // Restore session on mount — validates expiry before trusting stored id.
  useEffect(() => {
    const userId = readSession();
    if (userId) {
      const found = getUserById(userId);
      if (found) setUser(found);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((userId: string) => {
    const found = getUserById(userId);
    if (!found) return;
    writeSession(userId);
    setUser(found);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextType>(() => {
    const permissions    = user ? ROLE_PERMISSIONS[user.role] : EMPTY_PERMISSIONS;
    const permissionSet  = user ? new Set<Permission>(permissions) : EMPTY_PERMISSION_SET;
    return {
      user,
      role:            user?.role ?? null,
      permissions,
      permissionSet,
      isAuthenticated: !!user,
      isLoading,
      hasPermission:   (permission: Permission) => permissionSet.has(permission),
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
