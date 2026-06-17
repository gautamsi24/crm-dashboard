import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

// Note: the following live in common/common.steps.ts:
//   Given I am logged in as {string}
//   Given I am not logged in
//   When I navigate directly to {string}
//   Then the comments sidebar should be visible
//   Then the edit status bar should be visible

const WORKSPACE    = '[data-cy="document-workspace"]';
const CONTENT_TEXT = '[data-cy="workspace-content-text"]';
const LOAD_TIMEOUT = 15_000;

const toolbar = {
  edit:           '[data-cy="toolbar-edit"]',
  split:          '[data-cy="toolbar-split"]',
  merge:          '[data-cy="toolbar-merge"]',
  delete:         '[data-cy="toolbar-delete"]',
  comment:        '[data-cy="toolbar-comment"]',
  toggleComments: '[data-cy="toolbar-toggle-comments"]',
};

const ACTION_SELECTOR: Record<string, string> = {
  Edit:    toolbar.edit,
  Split:   toolbar.split,
  Merge:   toolbar.merge,
  Delete:  toolbar.delete,
  Comment: toolbar.comment,
};

// Permissions feature has no Background navigation, so visit here
function openWorkspace() {
  cy.visit('/customers');
  cy.get('main table tbody tr').first().click();
  cy.get(WORKSPACE).should('be.visible');
}

// ── Given ─────────────────────────────────────────────────────────────────────

Given('I open the document workspace', () => {
  openWorkspace();
});

Given('the document is fully loaded in the workspace', () => {
  openWorkspace();
  cy.get(CONTENT_TEXT, { timeout: LOAD_TIMEOUT }).should('not.be.empty');
});

// ── When ──────────────────────────────────────────────────────────────────────

When('I try to click the comments panel toggle', () => {
  cy.get(toolbar.toggleComments).click({ force: true });
});

When('I click the comments panel toggle', () => {
  cy.get(toolbar.toggleComments).should('not.be.disabled').click();
});

When('I click the {string} toolbar button', (action: string) => {
  cy.get(ACTION_SELECTOR[action]).should('not.be.disabled').click();
});

// ── Then ──────────────────────────────────────────────────────────────────────

Then('the {string} toolbar button should be disabled', (action: string) => {
  cy.get(ACTION_SELECTOR[action]).should('be.disabled');
});

Then('the {string} toolbar button should be enabled', (action: string) => {
  cy.get(ACTION_SELECTOR[action]).should('not.be.disabled');
});

Then('the {string} toolbar button should show a permission tooltip', (action: string) => {
  cy.get(ACTION_SELECTOR[action])
    .should('have.attr', 'title')
    .and('match', /Upgrade to .+ plan/);
});

Then('the comments panel toggle should be disabled', () => {
  cy.get(toolbar.toggleComments).should('be.disabled');
});

Then('the comments panel toggle should be enabled', () => {
  cy.get(toolbar.toggleComments).should('not.be.disabled');
});

Then('the comments sidebar should not be rendered', () => {
  cy.get('aside').contains('h2', 'Comments').should('not.exist');
});

Then('the split document dialog should be visible', () => {
  cy.get('[role="dialog"]').contains('Split Document').should('be.visible');
});

Then('the delete document dialog should be visible', () => {
  cy.get('[role="dialog"]').contains('Delete').should('be.visible');
});

Then('I should be redirected to the login page', () => {
  cy.url().should('include', '/login');
});
