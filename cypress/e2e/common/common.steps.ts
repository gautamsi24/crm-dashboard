import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

// Shared step definitions used across multiple feature files.
// Each step here appears in exactly ONE place — removing duplicates
// that previously caused "Multiple matching step definitions" errors.

Given('I am logged in as {string}', (name: string) => {
  cy.loginAs(name);
});

Given('I am not logged in', () => {
  cy.window().then(win => win.sessionStorage.clear());
});

Given('I navigate to the customers page', () => {
  cy.visit('/customers');
});

// Waits for real data rows (skeleton rows have no text, ignore clicks)
function waitForTableRow() {
  cy.get('main table tbody td:first-child', { timeout: 10_000 })
    .first()
    .should('not.be.empty');
}

// Assumes the test is already on the customers page (via Background or prior step)
Given('the document workspace is open', () => {
  waitForTableRow();
  cy.get('main table tbody tr').first().click();
  cy.get('[data-cy="document-workspace"]').should('be.visible');
});

When('I click on the first customer row', () => {
  waitForTableRow();
  cy.get('main table tbody tr').first().click();
});

When('I navigate directly to {string}', (path: string) => {
  cy.visit(path);
});

Then('the comments sidebar should be visible', () => {
  cy.get('aside').contains('h2', 'Comments').should('be.visible');
});

Then('the edit status bar should be visible', () => {
  cy.get('[role="status"]').should('be.visible');
});
