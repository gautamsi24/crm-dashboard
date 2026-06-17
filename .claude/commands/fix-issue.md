Fix the issue described in $ARGUMENTS.

Steps:
1. Read the relevant files to understand the current behaviour
2. Identify the root cause — do not treat symptoms
3. Make the minimal change that fixes the issue without introducing new abstractions or refactoring surrounding code
4. If the fix touches a permission check, verify the change is consistent with the RBAC rules in `.claude/rules/api-conventions.md`
5. If the fix touches a component that has `data-cy` selectors, ensure those selectors still match their Cypress step definitions
6. Summarise: what was wrong, what was changed, and any follow-up that is out of scope for this fix
