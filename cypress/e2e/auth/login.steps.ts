import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

// Note: "Given I am logged in as {string}" lives in common/common.steps.ts

Given('I am on the login page', () => {
  cy.visit('/login');
});

When('I select the account {string}', (userName: string) => {
  cy.contains('button', userName).click();
});

When('I open the user menu', () => {
  cy.get('aside').find('button').last().click();
});

When('I click {string}', (label: string) => {
  cy.contains(label).click();
});

Then('I should be redirected to the dashboard', () => {
  cy.url().should('not.include', '/login');
});

Then('the top header should greet me with {string}', (firstName: string) => {
  cy.get('header h1').should('contain', firstName);
});

Then('I should see at least 2 account options', () => {
  cy.get('main button').should('have.length.gte', 2);
});

Then('I should be on the login page', () => {
  cy.url().should('include', '/login');
});

Then('the current account should be highlighted', () => {
  cy.get('main button[class*="border-primary"]').should('exist');
});
