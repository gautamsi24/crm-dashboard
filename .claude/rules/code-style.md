## Code Style

### General
- TypeScript strict mode — no `any`, no non-null assertions unless truly unavoidable
- No comments unless the WHY is non-obvious (a hidden constraint, a workaround, a subtle invariant)
- No emojis in code unless the user explicitly asks
- Prefer `Edit` over `Write` for existing files — only rewrite when more than ~70% of the file changes

### File naming
- **Components:** PascalCase (`DocumentWorkspace.tsx`, `FloatingCommentBubble.tsx`)
- **Hooks:** camelCase (`useDocumentLoader.ts`, `useTextSelection.ts`)
- **Utilities / data / types:** camelCase (`mockApi.ts`, `mockUsers.ts`, `auth.ts`)

### Import alias
All internal imports use the `@/` alias which maps to `src/`:
```ts
import { Can }      from '@/components/Can';
import { useAuth }  from '@/contexts/AuthContext';
import type { Permission } from '@/types/auth';
```
Never use relative `../../` paths when an `@/` path works.

### No barrel / index files
Every import names its file explicitly. Do not create `index.ts` re-export files:
```ts
// ✅
import { useDocumentLoader } from '@/pages/customers/hooks/useDocumentLoader';
// ✗
import { useDocumentLoader } from '@/pages/customers/hooks';
```

### Components
- Functional components only, no class components
- Use `cn()` from `@/lib/utils` for all `className` merging
- Type imports use the `type` keyword: `import type { Foo } from './foo'`
- Named exports for components (`export function Foo`), not default exports — except page-level components which use default exports to match the router pattern
- Keep component files focused: one primary export per file; internal helpers live at the bottom

### State & hooks
- `useCallback` / `useMemo` only when the value is passed as a prop to a memoized child or is a dependency of another hook — not for "just in case" optimisation
- Derived values inside `useMemo`, not separate `useState`

### Styling
- Tailwind utility classes only — no inline `style={{}}` unless setting dynamic CSS custom properties
- Follow existing class ordering: layout → spacing → sizing → color → typography → state variants

### Locale formatting
Use `toLocaleString` / `toLocaleDateString` with explicit options so output is stable regardless of system locale:
```ts
// dates
date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
// times
date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
// numbers
count.toLocaleString()
```

### Permissions
- Never check `user.role` directly in UI code — always go through `hasPermission()`, `<Can>`, or `useAuthorizedAction`
- Disabled UI messages must use `PERMISSION_DENIED_MESSAGE[permission]` from `@/types/auth` — never expose raw permission strings
