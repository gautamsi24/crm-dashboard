## Component Patterns

### Modals / Dialogs
- Modals return `null` early when `open={false}` — they are **not remounted**, which preserves form state between opens
- Always set `role="dialog"` and `aria-modal="true"` on the modal root
- Use a `variant` prop for tone changes (`variant="danger"` → red confirm button + warning icon), not separate components

```tsx
export function ConfirmModal({ open, ...props }) {
  if (!open) return null;   // ← not a conditional render in JSX — early return
  return <div role="dialog" aria-modal="true">...</div>;
}
```

### Phase state machines for async UI
Multi-step async operations use a string union for phase, not a nest of booleans:

```ts
type LoadPhase = 'idle' | 'metadata' | 'chunking' | 'ready' | 'error';
```

- `idle` — nothing requested yet
- Intermediate phases (`metadata`, `chunking`) drive progress UI
- `ready` — data is usable; gate interactive elements on `phase === 'ready'`
- `error` — always provide a `retry` callback alongside an `error: string | null`

Never use `isLoading + isError + isSuccess` booleans — they allow impossible states.

### Loading skeletons
Use `animate-pulse` on fixed-size `div` placeholders — no external skeleton library:

```tsx
<div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
```

### Event handler naming
| Usage | Prefix | Example |
|-------|--------|---------|
| Prop callback (passed in) | `on` | `onPageSelect`, `onAddComment`, `onClose` |
| Internal handler (defined in file) | `handle` | `handlePageChange`, `handleAction` |
| Visibility toggles | `handleToggle` | `handleTogglePageNav`, `handleToggleComments` |
| Dialog confirm/cancel | `handle…Confirm`, `handle…Close` | `handleSplitConfirm`, `handleCloseDeleteDialog` |

### Toggle / show state
Boolean UI visibility props use the `show` prefix: `showPageNav`, `showComments`, `showSplitDialog`. Do not mix in `is` prefix (reserve `is` for entity state: `isEditing`, `isLoading`).

### Memoising leaf components
Wrap small purely-presentational leaf components (those that receive only primitives/stable callbacks as props) in `React.memo`:

```tsx
const ResumePrompt = memo(function ResumePrompt({ ... }) { ... });
```

Do **not** memo orchestrator components (they own state and will re-render anyway).

### Pre-computing expensive derived data
When a parent renders a list and each item needs a filtered/mapped result, build the map once with `useMemo` outside the render:

```tsx
// ✅ O(M) build once, O(1) per item
const presencePageMap = useMemo(() => {
  const map = new Map<number, PresenceUser[]>();
  for (const u of presence) { ... }
  return map;
}, [presence]);

// ✗ O(N×M) — filter called inside the render loop
items.map(item => presence.filter(u => u.page === item.page))
```

### Accessibility baseline
- Icon-only buttons must have a `title` attribute (tooltip + screen reader)
- Dynamic content regions use `aria-live="polite"` (or `"assertive"` for urgent alerts)
- Use `role="toolbar"` + `role="group"` for action bars, `role="status"` for auto-save indicators
