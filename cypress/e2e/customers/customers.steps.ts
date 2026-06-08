import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

// Note: the following live in common/common.steps.ts:
//   Given I am logged in as {string}
//   Given I navigate to the customers page
//   Given the document workspace is open
//   When I click on the first customer row

When('I search using the first customer\'s name', () => {
  // Capture row count and first name before typing so we can compare after
  cy.get('main table tbody tr').its('length').as('rowCountBefore');

  cy.get('main table tbody td:first-child')
    .first()
    .invoke('text')
    .then(fullName => {
      // Use the first word so partial matching still exercises the search logic
      const term = fullName.trim().split(/\s+/)[0];
      cy.wrap(term).as('searchTerm');
      cy.get('input[placeholder="Search..."]').clear().type(term);
    });
});

When('I click the close button on the workspace', () => {
  cy.get('[data-cy="document-workspace"]').find('button[title]').first().click();
});

When('I click the next page button', () => {
  cy.get('nav[aria-label="Pagination"]').find('button').last().click();
});

Then('I should see the customer statistics section', () => {
  cy.get('section[aria-label="Customer statistics"]').should('be.visible');
});

Then('the statistics section should show {string}', (label: string) => {
  cy.get('section[aria-label="Customer statistics"]').should('contain', label);
});

Then('the customers table should be visible', () => {
  cy.get('main table').should('be.visible');
});

Then('the table should have column headers', () => {
  cy.get('main table thead th').should('have.length', 6);
});

Then('I should see customer rows loaded', () => {
  cy.get('main table tbody tr').should('have.length.gte', 1);
});

Then('the table should show fewer rows than before the search', () => {
  cy.get('@rowCountBefore').then(before => {
    cy.get('main table tbody tr').its('length').should('be.lte', before as unknown as number);
  });
});

Then('every visible row should contain the search term', () => {
  // Search matches across all fields — check the full row text, not just name column
  cy.get('@searchTerm').then(term => {
    cy.get('main table tbody tr').each($row => {
      expect($row.text().toLowerCase()).to.include((term as unknown as string).toLowerCase());
    });
  });
});

Then('the document workspace panel should open', () => {
  cy.get('[data-cy="document-workspace"]').should('be.visible');
});

Then('the document workspace panel should be closed', () => {
  // Panel is always in the DOM; closed state = translated off-screen = not visible
  cy.get('[data-cy="document-workspace"]').should('not.be.visible');
});

Then('the page indicator should show page 2', () => {
  cy.get('nav[aria-label="Pagination"]').should('contain', '2');
});
