## Hook Patterns

Custom hooks live in `src/pages/customers/hooks/` (feature-scoped) or `src/hooks/` (app-wide).

### Return shape
Each hook exports a named interface for its return type, data/state fields first, then actions:

```ts
export interface UseDocumentLoaderReturn extends LoaderState {
  // actions come after state
  setCurrentPage: (page: number) => void;
  retry: () => void;
}
```

The return interface is always exported so consumers can type variables that hold the hook result.

### Async cancellation
Prevent state updates after unmount using a `cancelled` flag — **not** AbortController (the codebase is consistent on this):

```ts
useEffect(() => {
  let cancelled = false;
  fetchSomething().then(data => {
    if (!cancelled) setState(data);
  });
  return () => { cancelled = true; };
}, [dependency]);
```

Never set state inside a `.then()` without this guard.

### Debouncing
Use a `useRef` to hold the timer ID; clean it up in the effect's return:

```ts
const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

useEffect(() => {
  if (timerRef.current) clearTimeout(timerRef.current);
  timerRef.current = setTimeout(() => {
    doExpensiveThing();
  }, DELAY_MS);
  return () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };
}, [value]);
```

**Standard debounce delays in this project:**

| Use case | Delay | Constant |
|----------|-------|----------|
| Search input → API params | 300 ms | inline |
| Edit auto-save | 1 500 ms | `AUTO_SAVE_DELAY` |
| Resume position save | 1 500 ms | inline |

Match these delays when adding new debounced behaviour — do not invent new values without a reason.

### Retry pattern
Hooks that fetch data expose a `retry` callback that increments an `attempt` counter:

```ts
const [attempt, setAttempt] = useState(0);
const retry = useCallback(() => setAttempt(a => a + 1), []);

useEffect(() => {
  // fetch logic
}, [id, attempt]); // re-runs on retry
```

Network errors should apply exponential backoff: `(retryCount + 1) * 2000` ms, max 3 retries.

### Progressive reveal
When data arrives in chunks (e.g. document pages), expose a `pagesReady` counter so the UI can render available content while the rest loads — do not block the entire view until everything is ready.

### Hook naming
- Feature hooks: `use<Feature><Noun>` — `useDocumentLoader`, `useDocumentEdit`, `useDocumentComments`
- Generic utility hooks: `use<Noun>` — `useTextSelection`, `useAuthorizedAction`
- Hooks must not import other hooks from the same feature folder (avoid circular dependency chains)
