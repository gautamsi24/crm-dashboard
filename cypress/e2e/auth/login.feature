Feature: User Login

  As a CRM user
  I want to select my account on the login page
  So that I can access the dashboard

  Scenario: Successful login with a valid account
    Given I am on the login page
    When I select the account "Alice Reader"
    Then I should be redirected to the dashboard
    And the top header should greet me with "Alice"


  Scenario: Login page shows all available accounts
    Given I am on the login page
    Then I should see at least 2 account options

  Scenario: Switching account from within the app
    Given I am logged in as "Alice Reader"
    When I open the user menu
    And I click "Switch account"
    Then I should be on the login page
    And the current account should be highlighted
