# CRM Dashboard

A React 19 single-page application featuring a collaborative document workspace with real-time presence simulation, progressive document loading, inline commenting, and granular RBAC — all backed by a mock API layer designed for straightforward backend swaps.

## Tech Stack

| Layer          | Technology                     |
| -------------- | ------------------------------ |
| Framework      | React 19 + TypeScript (strict) |
| Routing        | React Router v7                |
| Styling        | Tailwind CSS v4                |
| Build          | Vite 8                         |
| UI primitives  | Radix UI + shadcn/ui           |
| Testing        | Cypress 15 + Cucumber BDD      |

## Key Commands

```bash
npm run dev           # Start dev server (localhost:5173)
npm run build         # tsc -b && vite build
npm run lint          # ESLint
npm run cy:open       # Cypress interactive runner
npm run cy:run        # Cypress headless
npm run cy:run:headed # Cypress headed (useful for debugging)
```

## Project Structure

```text
src/
├── App.tsx                        # Root router — AuthProvider wraps everything
├── contexts/
│   └── AuthContext.tsx            # Session management, permissionSet, hasPermission
├── components/
│   ├── Can.tsx                    # <Can permission="..."> declarative gate
│   ├── ProtectedRoute.tsx         # Route-level auth + authz (inline 403 view)
│   └── Layout.tsx                 # Sidebar shell + top header
├── hooks/
│   └── useAuthorizedAction.ts     # Wraps event handlers with permission check
├── types/
│   └── auth.ts                    # Role hierarchy, ROLE_PERMISSIONS, PERMISSION_DENIED_MESSAGE
├── data/
│   ├── mockUsers.ts               # 4 users (user/proUser/superUser/admin)
│   └── mockCustomers.ts
├── lib/
│   └── mockApi.ts                 # All "API" calls — swap for real fetch here
│                                  # Includes summarizeDocument() AI stub
└── pages/
    └── customers/
        ├── DocumentWorkspace.tsx  # Orchestrates all document feature hooks
        ├── hooks/                 # useDocumentLoader, useDocumentEdit, etc.
        └── workspace/
            ├── DocumentToolbar.tsx    # RBAC-aware action bar
            └── CommentsSidebar.tsx
```

## Architecture Notes

### RBAC

Permissions derive from a role hierarchy (`user → proUser → superUser → admin`) defined in `src/types/auth.ts`. Each role only declares the permissions it *adds*; the rest are inherited. Never check `user.role` directly in components — always check `hasPermission()` or use `<Can>`.

### Session

Sessions are stored as `{ userId, expiresAt }` JSON in `sessionStorage` with an 8-hour TTL. Plain strings are rejected on restore (prevents trivial DevTools injection). Replace `readSession` / `writeSession` in `AuthContext.tsx` with real JWT handling when adding a backend.

### Mock API

`src/lib/mockApi.ts` is the single seam between UI and data. All mutations and fetches go through it. When adding a real backend, replace function bodies without changing call sites. The `summarizeDocument()` function is a mock stub — replace its body with a real Anthropic API call and set `VITE_ANTHROPIC_KEY` in `.env.local`.

### Permission messages

`PERMISSION_DENIED_MESSAGE` in `auth.ts` maps every permission to a plan-upgrade hint shown to users (e.g. "Upgrade to Business plan to split documents"). Never expose raw permission strings in UI copy.
