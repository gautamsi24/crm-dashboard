import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

// Note: the following live in common/common.steps.ts:
//   Given I am logged in as {string}
//   Given I navigate to the customers page
//   Given the document workspace is open
//   When I click on the first customer row
//   Then the comments sidebar should be visible
//   Then the edit status bar should be visible

const WORKSPACE    = '[data-cy="document-workspace"]';
const CONTENT_VIEW = '[data-cy="workspace-content-view"]';
const CONTENT_TEXT = '[data-cy="workspace-content-text"]';
const CONTENT_EDIT = '[data-cy="workspace-content-edit"]';
const PAGE_IND     = '[data-cy="workspace-page-indicator"]';
const PREV_BTN     = '[data-cy="workspace-prev-page"]';
const NEXT_BTN     = '[data-cy="workspace-next-page"]';
const CLOSE_BTN    = '[data-cy="workspace-close"]';
const FILENAME     = '[data-cy="workspace-filename"]';
const BUBBLE       = '[data-cy="floating-comment-bubble"]';
const BUBBLE_INPUT = '[data-cy="bubble-comment-input"]';
const BUBBLE_POST  = '[data-cy="bubble-submit"]';

const LOAD_TIMEOUT = 15_000;

// Background already navigates to /customers — no cy.visit needed here
function openWorkspace() {
  cy.get('main table tbody tr').first().click();
  cy.get(WORKSPACE).should('be.visible');
}

function waitForContent() {
  cy.get(CONTENT_TEXT, { timeout: LOAD_TIMEOUT }).should('not.be.empty');
}

// ── Given ─────────────────────────────────────────────────────────────────────

Given('the document is fully loaded', () => {
  openWorkspace();
  waitForContent();
});

Given('the document is in edit mode', () => {
  openWorkspace();
  waitForContent();
  cy.get('[role="toolbar"]').contains('button', 'Edit').click();
  cy.get(CONTENT_EDIT, { timeout: 5_000 }).should('exist');
});

Given('I have navigated to page 2', () => {
  cy.get(NEXT_BTN).click();
  cy.get(PAGE_IND).should('contain', '2 /');
});

Given('the comments panel is open', () => {
  cy.get('[data-cy="toolbar-toggle-comments"]').should('not.be.disabled').click();
  cy.get('aside').contains('h2', 'Comments').should('be.visible');
});

// ── When ──────────────────────────────────────────────────────────────────────

When('I click the workspace close button', () => {
  cy.get(CLOSE_BTN).click();
});

When('I click the next page button in the workspace footer', () => {
  cy.get(NEXT_BTN).should('not.be.disabled').click();
});

When('I click the previous page button in the workspace footer', () => {
  cy.get(PREV_BTN).should('not.be.disabled').click();
});

When('I click page {int} in the page navigator sidebar', (pageNum: number) => {
  cy.get('nav[aria-label="Document pages"]')
    .contains('button', `Page ${pageNum}`)
    .should('not.be.disabled')
    .click();
});

When('I click the Edit button in the document toolbar', () => {
  cy.get('[data-cy="toolbar-edit"]').should('not.be.disabled').click();
});

When('I type {string} in the editable content', (text: string) => {
  cy.get(CONTENT_EDIT).focus().type(text);
});

When('I click {string} in the status bar', (label: string) => {
  cy.get('[role="status"]').contains(label).click();
});

When('I click the Comment toggle in the toolbar', () => {
  cy.get('[data-cy="toolbar-toggle-comments"]').should('not.be.disabled').click();
});

When('I select text in the document content area', () => {
  cy.get(CONTENT_TEXT).then($pre => {
    const textNode = $pre[0].firstChild;
    if (!textNode) return;
    cy.window().then(win => {
      const range = win.document.createRange();
      range.setStart(textNode, 0);
      range.setEnd(textNode, Math.min(40, (textNode.textContent ?? '').length));
      const sel = win.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    });
  });
  cy.get(CONTENT_VIEW).trigger('mouseup');
});

When('the floating comment bubble appears', () => {
  cy.get(BUBBLE, { timeout: 3_000 }).should('be.visible');
});

When('I click {string} in the bubble', (label: string) => {
  cy.get(BUBBLE).contains(label).click();
});

When('I type {string} in the bubble input', (text: string) => {
  cy.get(BUBBLE_INPUT).type(text);
});

When('I submit the comment', () => {
  cy.get(BUBBLE_POST).click();
});

When('I click {string} in the comments filter', (label: string) => {
  cy.get('aside').contains('h2', 'Comments')
    .closest('aside')
    .contains('button', label)
    .click();
});

// ── Then ──────────────────────────────────────────────────────────────────────

Then('the document workspace should be visible', () => {
  cy.get(WORKSPACE).should('be.visible');
});

Then('the workspace should display a filename', () => {
  cy.get(FILENAME).should('not.have.text', '—').and('not.be.empty');
});

Then('the document workspace should not be visible', () => {
  cy.get(WORKSPACE).should('not.be.visible');
});

Then('the customers table should still be visible', () => {
  cy.get('main table').should('be.visible');
});

Then('the document content should eventually be visible', () => {
  cy.get(CONTENT_TEXT, { timeout: LOAD_TIMEOUT }).should('not.be.empty');
});

Then('the page indicator should show {string}', (partial: string) => {
  cy.get(PAGE_IND).should('contain', partial);
});

Then('the page navigator sidebar should list at least 1 page', () => {
  cy.get('nav[aria-label="Document pages"]').find('button').should('have.length.gte', 1);
});

Then('the document content should update', () => {
  cy.get(CONTENT_TEXT, { timeout: LOAD_TIMEOUT }).should('exist');
});

Then('the editable content area should be active', () => {
  cy.get(CONTENT_EDIT).should('exist');
});

Then('the edit status bar should eventually show {string}', (text: string) => {
  cy.get('[role="status"]', { timeout: 5_000 }).should('contain', text);
});

Then('the edit status bar should not be visible', () => {
  cy.get('[role="status"]').should('not.exist');
});

Then('the read-only content area should be visible', () => {
  cy.get(CONTENT_VIEW).should('exist');
});

Then('the comment {string} should appear in the sidebar', (text: string) => {
  cy.get('aside').contains('h2', 'Comments')
    .closest('aside')
    .find('ul')
    .should('contain', text);
});

Then('the comments filter should show all document comments', () => {
  cy.get('aside').contains('h2', 'Comments')
    .closest('aside')
    .find('ul, p')
    .should('exist');
});
