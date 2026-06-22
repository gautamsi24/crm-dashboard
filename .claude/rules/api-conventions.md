## API & Data Conventions

### Mock API seam
`src/lib/mockApi.ts` is the **only** place that touches data. UI code never constructs its own data — it always calls a function from `mockApi.ts`. When switching to a real backend, only `mockApi.ts` changes; call sites stay the same.

### Adding a new endpoint
1. Add the function to `mockApi.ts` with the same signature it will have when real
2. Simulate latency with a short `await delay()` so loading states are testable
3. Return typed data matching the shape the real API will return

### Session format
Sessions stored in `sessionStorage` under the key `crm_uid` are **JSON**, not plain strings:
```json
{ "userId": "u1", "expiresAt": 1750000000000 }
```
A plain string is rejected by `readSession()` in `AuthContext.tsx`, forcing re-login. This prevents trivial DevTools impersonation. When adding real auth, replace `readSession` / `writeSession` with JWT decode / refresh logic.

### RBAC — where things live
| Concern | File |
|---------|------|
| Role + Permission types | `src/types/auth.ts` |
| Role hierarchy & permission derivation | `src/types/auth.ts` → `resolvePermissions()` |
| User-facing denied messages | `src/types/auth.ts` → `PERMISSION_DENIED_MESSAGE` |
| Runtime permission check | `src/contexts/AuthContext.tsx` → `hasPermission()` / `permissionSet` |
| Route guard | `src/components/ProtectedRoute.tsx` |
| Render gate | `src/components/Can.tsx` |
| Event handler guard | `src/hooks/useAuthorizedAction.ts` |

### Current permissions

| Permission      | Minimum role | Plan       |
| --------------- | ------------ | ---------- |
| `document:view` | `user`       | Free       |
| `document:edit` | `proUser`    | Pro        |
| `document:comment` | `proUser` | Pro        |
| `document:annotate` | `proUser` | Pro       |
| `document:ai`   | `proUser`    | Pro        |
| `document:split` | `superUser` | Business   |
| `document:merge` | `superUser` | Business   |
| `document:delete` | `superUser` | Business  |
| `customer:view` | `user`       | Free       |
| `customer:create` | `proUser`  | Pro        |
| `customer:edit` | `proUser`    | Pro        |
| `customer:delete` | `admin`    | Enterprise |

### Adding a new permission
1. Add the string literal to the `Permission` union in `auth.ts`
2. Add it to `ROLE_OWN_PERMISSIONS` at the lowest tier that should have it (inherited roles get it automatically)
3. Add a user-facing message to `PERMISSION_DENIED_MESSAGE`
4. Gate UI elements with `<Can>` or `hasPermission()` — never with role comparisons

### Mock constants — do not change without a reason
These values are calibrated for a realistic demo feel. Changing them affects loading UX and test timing:

| Constant | Value | Purpose |
|----------|-------|---------|
| Network latency | 350 ms | `delay()` in mockApi.ts — most endpoints |
| AI summarize latency | 1 200 ms | `summarizeDocument()` mock — replace with real API call |
| Auto-save debounce | 1 500 ms | Inactivity before saving edits |
| Search debounce | 300 ms | Input → API params |
| Resume save debounce | 1 500 ms | Page position persistence |
| Presence move interval | 8 000 ms | How often simulated users change pages |
| Presence stale threshold | 60 000 ms | When a presence user is considered inactive |
| Session TTL | 8 h (28 800 000 ms) | `SESSION_TTL_MS` in AuthContext.tsx |
| Resume freshness | 30 days | `THIRTY_DAYS_MS` in useDocumentResume.ts |
| Document reveal chunks | 5 | Number of page batches in progressive load |
| Max fetch retries | 3 | Before showing permanent error state |

### Presence data
`MOCK_PRESENCE_SEED` in `mockUsers.ts` is cloned before mutation — never mutate the constant directly. The presence simulation runs entirely client-side; there is no WebSocket.
