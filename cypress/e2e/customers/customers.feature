Feature: Customers Page

  As a logged-in CRM user
  I want to browse and search the customer list
  So that I can find and manage customer records

  Background:
    Given I am logged in as "Alice Reader"
    And I navigate to the customers page

  Scenario: Customers page displays summary statistics
    Then I should see the customer statistics section
    And the statistics section should show "Total Customers"

  Scenario: Customers table loads with data
    Then the customers table should be visible
    And the table should have column headers
    And I should see customer rows loaded

  Scenario: Searching for a customer filters the table
    When I search using the first customer's name
    Then the table should show fewer rows than before the search
    And every visible row should contain the search term

  Scenario: Clicking a customer row opens the document workspace
    When I click on the first customer row
    Then the document workspace panel should open

  Scenario: Closing the document workspace
    Given the document workspace is open
    When I click the close button on the workspace
    Then the document workspace panel should be closed

  Scenario: Pagination navigates between pages
    When I click the next page button
    Then the page indicator should show page 2
