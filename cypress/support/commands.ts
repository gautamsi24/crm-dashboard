/// <reference types="cypress" />

export {};

declare global {
  namespace Cypress {
    interface Chainable {
      loginAs(userName: string): void;
    }
  }
}

Cypress.Commands.add('loginAs', (userName: string) => {
  cy.visit('/login');
  cy.contains('button', userName).click();
});
