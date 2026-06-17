Review the current uncommitted changes (or the diff of $ARGUMENTS if a branch/commit is provided).

Check for:
1. **Correctness bugs** — logic errors, off-by-ones, race conditions, unhandled edge cases
2. **RBAC integrity** — any new UI that renders without a `<Can>` gate or `hasPermission()` check; any raw role comparisons instead of permission checks; any new user-facing string that exposes internal permission names instead of using `PERMISSION_DENIED_MESSAGE`
3. **Session security** — any new code that reads/writes `sessionStorage` directly instead of going through `readSession` / `writeSession` in `AuthContext.tsx`
4. **Mock API seam** — any component that constructs data directly instead of calling `mockApi.ts`
5. **Test coverage** — do new interactive elements have `data-cy` attributes? Are new permission gates covered by the permissions feature file?

For each finding: file path + line number, what the issue is, and the one-line fix. Skip style nits that ESLint would catch.
