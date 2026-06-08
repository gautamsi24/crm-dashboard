/**
 * Login / Switch Account page.
 * Sits outside the Layout shell — accessible without auth.
 * After login, redirects to the page the user originally requested.
 *
 * Intentionally shows NO role, plan, or permission information.
 * Users learn what they can access after login, not before.
 * For role reference during development, see src/data/mockUsers.ts.
 */

import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, Hexagon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { MOCK_USERS } from '@/data/mockUsers';

export default function Login() {
  const { login, user: currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/';

  const handleSelect = (userId: string) => {
    login(userId);
    navigate(returnTo, { replace: true });
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F8F9FC] px-4 py-12">

      {/* Logo */}
      <div className="mb-10 flex items-center gap-2.5">
        <Hexagon className="size-8 stroke-2 text-gray-800" />
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold text-gray-900">Dashboard</span>
          <span className="text-xs text-gray-400">v.01</span>
        </div>
      </div>

      <div className="w-full max-w-2xl">
        <h1 className="mb-1 text-center text-2xl font-bold text-gray-900">
          {currentUser ? 'Switch account' : 'Sign in'}
        </h1>
        <p className="mb-8 text-center text-sm text-gray-500">
          Select an account to continue.
        </p>

        <div className="grid grid-cols-2 gap-4">
          {MOCK_USERS.map(mockUser => {
            const isActive = currentUser?.id === mockUser.id;

            return (
              <button
                key={mockUser.id}
                onClick={() => handleSelect(mockUser.id)}
                className={cn(
                  'relative flex items-center gap-4 rounded-2xl border-2 bg-white p-5 text-left transition-all duration-150 hover:shadow-md',
                  isActive
                    ? 'border-primary shadow-md'
                    : 'border-gray-100 hover:border-gray-200',
                )}
              >
                {isActive && (
                  <CheckCircle2 className="absolute right-4 top-4 size-5 text-primary" />
                )}

                {/* Avatar */}
                <div className={cn(
                  'flex size-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white',
                  mockUser.color,
                )}>
                  {mockUser.initials}
                </div>

                {/* Identity only — no role or plan */}
                <div className="min-w-0 space-y-0.5">
                  <p className="truncate font-semibold text-gray-900">{mockUser.name}</p>
                  <p className="truncate text-xs text-gray-400">{mockUser.email}</p>
                  <p className="truncate text-xs text-gray-500">{mockUser.jobTitle}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}
