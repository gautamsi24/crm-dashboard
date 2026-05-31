import { Search, ChevronLeft, ChevronRight, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useCustomers } from '@/pages/customers/hooks/useCustomers';
import type { Customer, SortField, SortOrder } from '@/lib/mockApi';

// ── Sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Customer['status'] }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-medium',
        status === 'Active'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
          : 'border-rose-200 bg-rose-50 text-rose-600',
      )}
    >
      {status}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-50">
      {Array.from({ length: 6 }).map((_, j) => (
        <td key={j} className="px-6 py-4">
          <div className="h-4 animate-pulse rounded bg-gray-100" style={{ width: `${60 + j * 8}%` }} />
        </td>
      ))}
    </tr>
  );
}

function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  const pages = buildPageRange(page, totalPages);

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        className="flex size-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronLeft className="size-4" />
      </button>

      {pages.map((p, i) =>
        p === 'ellipsis' ? (
          <span key={`e-${i}`} className="flex size-8 items-center justify-center text-xs text-gray-400">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={cn(
              'flex size-8 items-center justify-center rounded-lg text-xs font-medium transition-colors',
              p === page
                ? 'bg-primary text-white'
                : 'text-gray-500 hover:bg-gray-100',
            )}
          >
            {p}
          </button>
        ),
      )}

      <button
        onClick={() => onPage(page + 1)}
        disabled={page === totalPages}
        className="flex size-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}

function buildPageRange(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const result: (number | 'ellipsis')[] = [1];
  if (current > 3)  result.push('ellipsis');

  const lo = Math.max(2, current - 1);
  const hi = Math.min(total - 1, current + 1);
  for (let p = lo; p <= hi; p++) result.push(p);

  if (current < total - 2) result.push('ellipsis');
  if (total > 1) result.push(total);

  return result;
}

// ── Sort options ─────────────────────────────────────────────────────────────
const SORT_OPTIONS: { label: string; sortBy: SortField; sortOrder: SortOrder }[] = [
  { label: 'Newest',    sortBy: 'joinedAt', sortOrder: 'desc' },
  { label: 'Oldest',    sortBy: 'joinedAt', sortOrder: 'asc'  },
  { label: 'Name A→Z',  sortBy: 'name',     sortOrder: 'asc'  },
  { label: 'Name Z→A',  sortBy: 'name',     sortOrder: 'desc' },
  { label: 'Company',   sortBy: 'company',  sortOrder: 'asc'  },
  { label: 'Country',   sortBy: 'country',  sortOrder: 'asc'  },
];

// ── Main component ───────────────────────────────────────────────────────────
interface CustomersTableProps {
  onRowClick:          (customer: Customer) => void;
  selectedCustomerId:  string | null;
}

export default function CustomersTable({ onRowClick, selectedCustomerId }: CustomersTableProps) {
  const {
    data, isLoading, error,
    searchInput, setSearchInput,
    sortBy, sortOrder, setSort,
    page, setPage,
  } = useCustomers();

  const currentSortKey = `${sortBy}_${sortOrder}`;
  const records = data?.records ?? [];
  const total   = data?.total   ?? 0;
  const totalPages = data?.totalPages ?? 1;

  // Range label: "Showing 1 to 10 of 400 entries"
  const pageSize = 10;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
        <div>
          <h2 className="text-base font-bold text-gray-900">All Customers</h2>
          <p className="mt-0.5 text-xs font-medium text-emerald-500">Active Members</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative w-52">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="border-gray-200 bg-gray-50 pl-8 text-xs focus:bg-white"
            />
          </div>

          {/* Sort dropdown */}
          <div className="relative flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-sm transition-colors hover:border-gray-300">
            <ChevronsUpDown className="size-3.5 shrink-0 text-gray-400" />
            <span className="text-gray-400">Sort by</span>
            <div className="h-3.5 w-px bg-gray-200" />
            <select
              value={currentSortKey}
              onChange={e => {
                const opt = SORT_OPTIONS.find(o => `${o.sortBy}_${o.sortOrder}` === e.target.value);
                if (opt) setSort(opt.sortBy, opt.sortOrder);
              }}
              className="cursor-pointer appearance-none bg-transparent pr-4 font-semibold text-gray-800 outline-none"
            >
              {SORT_OPTIONS.map(o => (
                <option key={`${o.sortBy}_${o.sortOrder}`} value={`${o.sortBy}_${o.sortOrder}`}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      {/* ── Error state ── */}
      {error && (
        <div className="px-6 py-8 text-center text-sm text-rose-500">{error}</div>
      )}

      {/* ── Table ── */}
      {!error && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100">
                {['Customer Name', 'Company', 'Phone Number', 'Email', 'Country', 'Status'].map(h => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {isLoading
                ? Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)
                : records.length === 0
                  ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center text-sm text-gray-400">
                        No customers found matching your search.
                      </td>
                    </tr>
                  )
                  : records.map(customer => (
                    <tr
                      key={customer.id}
                      onClick={() => onRowClick(customer)}
                      className={cn(
                        'cursor-pointer border-b border-gray-50 transition-colors last:border-0',
                        customer.id === selectedCustomerId
                          ? 'bg-violet-50'
                          : 'hover:bg-gray-50',
                      )}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {customer.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{customer.company}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{customer.phone}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{customer.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{customer.country}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={customer.status} />
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination footer ── */}
      {!error && !isLoading && total > 0 && (
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
          <p className="text-xs text-gray-400">
            Showing data <span className="font-medium text-gray-700">{from}</span> to{' '}
            <span className="font-medium text-gray-700">{to}</span> of{' '}
            <span className="font-medium text-gray-700">{total.toLocaleString()}</span> entries
          </p>
          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        </div>
      )}
    </div>
  );
}
