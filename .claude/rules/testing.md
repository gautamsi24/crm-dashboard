## Testing Conventions

### Stack
Cypress 15 + `@badeball/cypress-cucumber-preprocessor` (BDD). Tests live in `cypress/e2e/` organised by feature.

### File layout
```
cypress/e2e/
├── <feature>/
│   ├── <feature>.feature   # Gherkin scenarios
│   └── <feature>.steps.ts  # Step definitions
└── common/
    └── common.steps.ts     # Shared steps used across features
```

### Selectors
- Always use `data-cy` attributes for Cypress selectors — never class names, text, or IDs
- Follow the naming pattern `data-cy="<context>-<element>"` in **static, kebab-case** strings — never template literals
- Add `data-cy` to new interactive elements at the same time as writing the component

**Existing `data-cy` inventory** (match this pattern when adding new ones):

| Selector | Element |
|----------|---------|
| `document-workspace` | Workspace panel root |
| `workspace-filename` | Document title in header |
| `workspace-close` | Close button |
| `workspace-content-view` | Read-only content wrapper |
| `workspace-content-edit` | `contentEditable` pre in edit mode |
| `workspace-content-text` | Text pre (used to detect load completion) |
| `workspace-prev-page` / `workspace-next-page` | Footer pagination buttons |
| `workspace-page-indicator` | "X / Y" page counter |
| `toolbar-edit` / `toolbar-split` / `toolbar-merge` / `toolbar-delete` / `toolbar-comment` | Action buttons |
| `toolbar-toggle-pagenav` / `toolbar-toggle-comments` | Panel toggle buttons |
| `floating-comment-bubble` | Selection bubble root |
| `bubble-add-comment` / `bubble-comment-input` / `bubble-submit` | Bubble form elements |

### Auth in tests
- Use `cy.loginAs(userName)` (defined in `cypress/support/commands.ts`) — it visits `/login` and clicks the user button
- Use `cy.window().then(win => win.sessionStorage.clear())` to simulate logged-out state
- Never directly set `sessionStorage` to a raw user ID — the session is now JSON (`{ userId, expiresAt }`) and a plain string will be rejected

### Step definitions
- Shared steps (Given/When/Then used in multiple feature files) go in `common/common.steps.ts`
- Feature-specific steps go in `<feature>.steps.ts`
- Import from `@badeball/cypress-cucumber-preprocessor`, not `cypress-cucumber-preprocessor`

### Assertions
- Use `{ timeout: 15_000 }` for assertions that wait on document loading (worker renders are slow)
- Prefer `should('not.be.disabled')` over `should('be.enabled')` for consistency with the existing suite
- Wait for real data rows before clicking: `cy.get('main table tbody td:first-child', { timeout: 10_000 }).first().should('not.be.empty')` — skeleton rows have no text and clicks on them are silently ignored

### Permission tooltip assertions
Disabled toolbar button tooltips use plan-upgrade language. Match with:
```ts
.should('have.attr', 'title').and('match', /Upgrade to .+ plan/)
```
Never match against internal permission strings like `Requires "document:split" permission` — those were replaced with business-language messages.
