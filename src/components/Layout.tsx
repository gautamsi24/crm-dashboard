import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Users, DollarSign,
  Megaphone, HelpCircle, Search, ChevronRight,
  ChevronDown, Hexagon, Sparkles, LogOut, RefreshCw,
} from 'lucide-react';
import { Input }               from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn }                  from '@/lib/utils';
import { useAuth }             from '@/contexts/AuthContext';
import { ROLE_LABEL }          from '@/types/auth';

const navItems = [
  { to: '/',          label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/products',  label: 'Product',   Icon: Package },
  { to: '/customers', label: 'Customers', Icon: Users },
  { to: '/income',    label: 'Income',    Icon: DollarSign },
  { to: '/promote',   label: 'Promote',   Icon: Megaphone },
  { to: '/help',      label: 'Help',      Icon: HelpCircle },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleSwitchAccount = () => {
    setShowUserMenu(false);
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8F9FC]">

      {/* ── Sidebar ── */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-gray-100 bg-white">

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-6">
          <Hexagon className="size-7 shrink-0 stroke-2 text-gray-800" />
          <div className="flex items-baseline gap-1">
            <span className="text-base font-bold text-gray-900">Dashboard</span>
            <span className="text-[10px] text-gray-400">v.01</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-0.5 px-3">
          {navItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="size-4 shrink-0" />
                  <span className="flex-1">{label}</span>
                  <ChevronRight className={cn('size-3.5 shrink-0', isActive ? 'text-white/60' : 'text-gray-300')} />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Upgrade promo */}
        <div className="mx-3 mb-4 mt-6 rounded-2xl bg-gradient-to-b from-violet-500 to-purple-700 p-4 text-white">
          <div className="mb-3 flex size-8 items-center justify-center rounded-full bg-white/20">
            <Sparkles className="size-4" />
          </div>
          <p className="mb-3 text-xs font-semibold leading-snug">
            Upgrade to PRO to get access all Features!
          </p>
          <button className="w-full rounded-full bg-white py-1.5 text-xs font-bold text-purple-700 transition-colors hover:bg-white/90">
            Get Pro Now!
          </button>
        </div>

        {/* User profile + dropdown */}
        <div className="relative border-t border-gray-100">
          <button
            onClick={() => setShowUserMenu(v => !v)}
            className="flex w-full items-center gap-3 px-4 py-4 hover:bg-gray-50"
          >
            <Avatar className="size-9 shrink-0">
              <AvatarFallback className={cn('text-sm font-bold text-white', user?.color ?? 'bg-gray-400')}>
                {user?.initials ?? '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col text-left">
              <span className="truncate text-sm font-semibold text-gray-900">
                {user?.name ?? 'Guest'}
              </span>
              <span className="text-xs text-gray-400">
                {user ? ROLE_LABEL[user.role] : '—'}
              </span>
            </div>
            <ChevronDown className={cn('size-4 shrink-0 text-gray-400 transition-transform', showUserMenu && 'rotate-180')} />
          </button>

          {/* Dropdown menu */}
          {showUserMenu && (
            <div className="absolute bottom-full left-3 right-3 mb-1 z-20 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="text-xs font-semibold text-gray-900">{user?.name}</p>
                <p className="text-[10px] text-gray-400">{user?.email}</p>
                <span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-medium text-gray-500">
                  {user?.plan} plan
                </span>
              </div>
              <button
                onClick={handleSwitchAccount}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw className="size-3.5 text-gray-400" />
                Switch account
              </button>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="size-3.5" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Right panel ── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Top header */}
        <header className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-white px-8 py-4">
          <h1 className="text-xl font-bold text-gray-900">
            Hello {user?.name?.split(' ')[0] ?? 'there'} 👋,
          </h1>

          <div className="flex items-center gap-3">
            <div className="relative w-60">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search" className="border-gray-200 bg-gray-50 pl-9 text-sm" />
            </div>

            <button
              onClick={handleLogout}
              title="Sign out"
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            >
              <LogOut className="size-3.5" />
              Sign out
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>

      {/* Dismiss dropdown when clicking outside */}
      {showUserMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
      )}
    </div>
  );
}
