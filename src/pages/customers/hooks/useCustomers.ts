import { useState, useEffect, useCallback } from 'react';
import {
  fetchCustomers,
  type FetchCustomersParams,
  type CustomersPage,
  type StatusFilter,
  type SortField,
  type SortOrder,
} from '@/lib/mockApi';

interface State {
  data:      CustomersPage | null;
  isLoading: boolean;
  error:     string | null;
}

export interface UseCustomersReturn extends State {
  searchInput: string;
  status:      StatusFilter;
  sortBy:      SortField;
  sortOrder:   SortOrder;
  page:        number;
  setSearchInput: (v: string) => void;
  setStatus:      (s: StatusFilter) => void;
  setSort:        (by: SortField, order: SortOrder) => void;
  setPage:        (p: number) => void;
}

const DEFAULTS: FetchCustomersParams = {
  page: 1, pageSize: 10,
  search: '', status: 'all',
  sortBy: 'name', sortOrder: 'asc',
};

export function useCustomers(): UseCustomersReturn {
  const [params, setParams]           = useState<FetchCustomersParams>(DEFAULTS);
  const [searchInput, setSearchInput] = useState('');
  const [state, setState]             = useState<State>({ data: null, isLoading: true, error: null });

  // Debounce raw search input → params.search (resets to page 1)
  useEffect(() => {
    const t = setTimeout(() => {
      setParams(p => ({ ...p, search: searchInput.trim(), page: 1 }));
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Fetch when any param changes; cancel stale responses
  useEffect(() => {
    let cancelled = false;
    setState(s => ({ ...s, isLoading: true, error: null }));

    fetchCustomers(params)
      .then(data  => { if (!cancelled) setState({ data, isLoading: false, error: null }); })
      .catch((e: Error) => {
        if (!cancelled)
          setState({ data: null, isLoading: false, error: e.message || 'Failed to load customers.' });
      });

    return () => { cancelled = true; };
  }, [params]);

  const setStatus = useCallback((status: StatusFilter) =>
    setParams(p => ({ ...p, status, page: 1 })), []);

  const setSort = useCallback((sortBy: SortField, sortOrder: SortOrder) =>
    setParams(p => ({ ...p, sortBy, sortOrder, page: 1 })), []);

  const setPage = useCallback((page: number) =>
    setParams(p => ({ ...p, page })), []);

  return {
    ...state,
    searchInput,
    status:    params.status,
    sortBy:    params.sortBy,
    sortOrder: params.sortOrder,
    page:      params.page,
    setSearchInput,
    setStatus,
    setSort,
    setPage,
  };
}
